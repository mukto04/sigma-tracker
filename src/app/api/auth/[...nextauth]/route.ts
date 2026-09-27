import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const runtime = 'edge';

// POST /api/auth/login - Login
export async function POST(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.endsWith('/login') || pathname.includes('credentials')) {
    const body = await req.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, user.password);
    } catch (err) {
      console.error("Bcrypt error:", err);
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({ 
      ok: true, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
    const isHttps = req.nextUrl.protocol === 'https:';
    
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  }

  if (pathname.endsWith('/logout') || pathname.endsWith('/signout')) {
    const response = NextResponse.json({ ok: true });
    const isHttps = req.nextUrl.protocol === 'https:';
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// GET /api/auth/session - Get session
export async function GET(req: NextRequest) {
  // Session check
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const user = await verifySessionToken(token);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ user: freshUser || null });
}
