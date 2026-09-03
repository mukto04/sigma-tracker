import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, productivityScore, activeApps } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const activity = await prisma.activityLog.create({
      data: {
        userId,
        productivityScore: productivityScore || 0,
        activeApps: activeApps || '[]',
        ...(body.offlineCreatedAt ? { createdAt: new Date(body.offlineCreatedAt) } : {}),
      },
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('Failed to save activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
