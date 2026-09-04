import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const ctx = getRequestContext();
    return NextResponse.json({ 
      ok: true, 
      ctxKeys: ctx ? Object.keys(ctx) : null,
      envKeys: ctx?.env ? Object.keys(ctx.env) : null,
      dbType: ctx?.env?.DB ? typeof ctx.env.DB : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
