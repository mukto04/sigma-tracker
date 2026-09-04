import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let user = null;
  let error = null;
  
  try {
    if (token) {
      user = await verifySessionToken(token);
    }
  } catch (err: any) {
    error = err.message;
  }

  return NextResponse.json({
    token: token ? 'present' : 'missing',
    user: user,
    error: error,
    time: new Date().toISOString()
  });
}
