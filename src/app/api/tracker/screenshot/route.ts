import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeDataImage, MAX_SCREENSHOT_REQUEST_BYTES, parseOfflineDate, pruneOldScreenshots, requireTrackerUser } from '@/lib/tracker-api';
import { saveScreenshotFile } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_SCREENSHOT_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Screenshot payload is too large' }, { status: 413 });
    }

    const body = await req.json() as {
      userId?: string;
      imageUrl?: string;
      offlineCreatedAt?: string;
    };
    const { userId, imageUrl } = body;

    if (!userId || !imageUrl) {
      return NextResponse.json({ error: 'Missing userId or imageUrl' }, { status: 400 });
    }

    const auth = await requireTrackerUser(userId, req);
    if ('error' in auth) return auth.error;

    let finalImageUrl = imageUrl;

    if (imageUrl.startsWith('data:image')) {
      const createdAt = parseOfflineDate(body.offlineCreatedAt);
      const { bytes, extension, contentType } = decodeDataImage(imageUrl);
      const filename = `screenshots/${userId}/${createdAt.getTime()}-${crypto.randomUUID()}.${extension}`;

      await saveScreenshotFile(filename, bytes, contentType);

      // Use our internal proxy endpoint so we don't need the user to setup a Public R2 Bucket domain
      finalImageUrl = `/api/tracker/screenshots/image?file=${filename}`;
    }

    const screenshot = await prisma.screenshot.create({
      data: {
        userId,
        imageUrl: finalImageUrl,
        createdAt: parseOfflineDate(body.offlineCreatedAt),
      },
    });

    await pruneOldScreenshots(userId);

    return NextResponse.json({ success: true, screenshot });
  } catch (error) {
    console.error('Failed to save screenshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
