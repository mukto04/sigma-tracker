import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  
  let user = null;
  if (token) {
    user = await verifySessionToken(token);
  }

  const isProtectedRoute = path.startsWith('/superadmin') || 
                           path.startsWith('/company-admin') || 
                           path.startsWith('/employee') ||
                           path.startsWith('/desktop') ||
                           path.startsWith('/dashboard');

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  if (path === '/' && user) {
    if (user.role === 'SUPERADMIN') return NextResponse.redirect(new URL('/superadmin', req.url));
    if (user.role === 'ADMIN') return NextResponse.redirect(new URL('/company-admin', req.url));
    if (user.role === 'EMPLOYEE') return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (path.startsWith('/superadmin') && user?.role !== 'SUPERADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (path.startsWith('/company-admin') && user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (path.startsWith('/employee') && user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/superadmin/:path*',
    '/company-admin/:path*',
    '/employee/:path*',
    '/desktop/:path*',
    '/dashboard/:path*',
  ],
};
