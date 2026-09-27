import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const MAX_SCREENSHOT_BYTES = 450 * 1024;
export const SCREENSHOT_RETENTION_DAYS = 14;

type R2BucketLike = {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: BodyInit | null;
    httpEtag: string;
    writeHttpMetadata(headers: Headers): void;
  } | null>;
  delete(key: string): Promise<unknown>;
};

export type TrackerEnv = {
  R2?: R2BucketLike;
};

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export async function requireTrackerUser(bodyUserId?: string, req?: Request) {
  const token = getCookieValue(req?.headers.get('cookie') || null, SESSION_COOKIE);
  const sessionUser = token ? await verifySessionToken(token) : null;

  if (!sessionUser?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (bodyUserId && bodyUserId !== sessionUser.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { company: true },
  });

  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  if (user.role !== 'EMPLOYEE') {
    return { error: NextResponse.json({ error: 'Tracker access is only available for employee accounts' }, { status: 403 }) };
  }

  return { user };
}

export function parseOfflineDate(value: unknown, fallback = new Date()) {
  if (typeof value !== 'string') return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const oneHourAhead = now + 60 * 60 * 1000;

  if (parsed.getTime() < thirtyDaysAgo || parsed.getTime() > oneHourAhead) {
    return fallback;
  }

  return parsed;
}

export function decodeDataImage(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) {
    throw new Error('Unsupported screenshot image type');
  }

  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  if (bytes.byteLength > MAX_SCREENSHOT_BYTES) {
    throw new Error('Screenshot is too large');
  }

  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const contentType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;

  return { bytes, extension, contentType };
}

export function getR2KeyFromImageUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl, 'https://tracker.local');
    const file = url.searchParams.get('file');
    if (file?.startsWith('screenshots/')) return file;
  } catch {}

  const marker = 'screenshots/';
  const idx = imageUrl.indexOf(marker);
  return idx >= 0 ? imageUrl.slice(idx) : null;
}

export async function pruneOldScreenshots(env: TrackerEnv, userId: string) {
  const cutoff = new Date(Date.now() - SCREENSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const oldScreenshots = await prisma.screenshot.findMany({
    where: { userId, createdAt: { lt: cutoff } },
    select: { id: true, imageUrl: true },
    take: 50,
  });

  if (oldScreenshots.length === 0) return;

  await Promise.allSettled(
    oldScreenshots.map(async (screenshot) => {
      const key = getR2KeyFromImageUrl(screenshot.imageUrl);
      if (key && env?.R2) await env.R2.delete(key);
    })
  );

  await prisma.screenshot.deleteMany({
    where: { id: { in: oldScreenshots.map((s) => s.id) } },
  });
}
