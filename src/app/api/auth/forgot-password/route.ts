import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetLinkEmail } from '@/lib/email';

export const runtime = 'edge';

const GENERIC_RESPONSE = { ok: true, message: 'If an account exists for that email, a reset link has been sent.' };

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json() as { email?: string };
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length > 254) return NextResponse.json(GENERIC_RESPONSE);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { company: { select: { name: true } } },
    });
    if (!user) return NextResponse.json(GENERIC_RESPONSE);

    const db = (getRequestContext().env as { DB?: D1Database }).DB;
    if (!db) throw new Error('Cloudflare DB binding not found');

    const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const tokenHash = await hashToken(token);
    const expiresAt = Date.now() + 30 * 60 * 1000;

    await db.batch([
      db.prepare('DELETE FROM "PasswordResetToken" WHERE "userId" = ?').bind(user.id),
      db.prepare('INSERT INTO "PasswordResetToken" ("id", "userId", "tokenHash", "expiresAt") VALUES (?, ?, ?, ?)')
        .bind(crypto.randomUUID(), user.id, tokenHash, expiresAt),
    ]);

    const resetUrl = new URL('/reset-password', request.nextUrl.origin);
    resetUrl.searchParams.set('token', token);
    await sendPasswordResetLinkEmail({
      to: user.email,
      employeeName: user.name || user.email,
      companyName: user.company.name,
      resetUrl: resetUrl.toString(),
    });
  } catch (error) {
    console.error('Forgot password request failed:', error);
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
