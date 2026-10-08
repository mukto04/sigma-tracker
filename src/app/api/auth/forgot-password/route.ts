import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetLinkEmail } from '@/lib/email';

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

    const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const tokenHash = await hashToken(token);
    const expiresAt = Date.now() + 30 * 60 * 1000;

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt: BigInt(expiresAt),
      },
    });

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
