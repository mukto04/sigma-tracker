import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

    const tokenHash = await hashToken(token);
    const reset = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: BigInt(Date.now()) },
      },
      select: { id: true, userId: true },
    });

    if (!reset) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { password: passwordHash },
      }),
      prisma.passwordResetToken.delete({
        where: { id: reset.id },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Password reset failed:', error);
    return NextResponse.json({ error: 'Unable to reset the password. Please request a new link.' }, { status: 500 });
  }
}
