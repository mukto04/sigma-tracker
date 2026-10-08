import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import bcrypt from 'bcryptjs';

export const runtime = 'edge';

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json() as { token?: string; password?: string };
    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Use a password with at least 8 characters.' }, { status: 400 });
    }

    const db = (getRequestContext().env as { DB?: D1Database }).DB;
    if (!db) throw new Error('Cloudflare DB binding not found');

    const tokenHash = await hashToken(token);
    const reset = await db.prepare(
      'SELECT "id", "userId" FROM "PasswordResetToken" WHERE "tokenHash" = ? AND "expiresAt" > ? LIMIT 1',
    ).bind(tokenHash, Date.now()).first<{ id: string; userId: string }>();

    if (!reset) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.batch([
      db.prepare('UPDATE "User" SET "password" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?').bind(passwordHash, reset.userId),
      db.prepare('DELETE FROM "PasswordResetToken" WHERE "id" = ?').bind(reset.id),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Password reset failed:', error);
    return NextResponse.json({ error: 'Unable to reset the password. Please request a new link.' }, { status: 500 });
  }
}
