import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      companyName?: string;
      name?: string;
      email?: string;
      password?: string;
    };

    const companyName = String(body.companyName || '').trim();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!companyName || !name || !email || password.length < 8) {
      return NextResponse.json({ error: 'Company, name, email and an 8+ character password are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account already exists for this email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const company = await prisma.company.create({
      data: {
        name: companyName,
        plan: 'FREE',
        paidSeats: 3,
        subscriptionStatus: 'Trial',
        users: {
          create: {
            name,
            email,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const admin = company.users[0];
    const token = await createSessionToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({ ok: true, redirectTo: '/company-admin' });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: new URL(req.url).protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup failed:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
