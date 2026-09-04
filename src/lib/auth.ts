import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Hardcoded secret for edge consistency (Cloudflare middleware env var bug workaround)
const SECRET_KEY = new TextEncoder().encode('SigmaSecureTrackerSecret123!_HARDCODED');

export const SESSION_COOKIE = 'sigma-session';

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

export interface Session {
  user: SessionUser;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await verifySessionToken(token);
  if (!user) return null;
  return { user };
}
