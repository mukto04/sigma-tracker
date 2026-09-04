import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    return NextResponse.json({ ok: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
