import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseOfflineDate, requireTrackerUser } from '@/lib/tracker-api';


export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > 12 * 1024) {
      return NextResponse.json({ error: 'Activity payload is too large' }, { status: 413 });
    }

    const body = await req.json() as {
      userId?: string;
      productivityScore?: number;
      activeApps?: string;
      offlineCreatedAt?: string;
    };
    const { userId, productivityScore, activeApps } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const auth = await requireTrackerUser(userId, req);
    if ('error' in auth) return auth.error;

    const score = typeof productivityScore === 'number' && Number.isFinite(productivityScore)
      ? Math.min(100, Math.max(0, Math.round(productivityScore)))
      : 0;

    const apps = typeof activeApps === 'string' && activeApps.length <= 8000 ? activeApps : '[]';

    const activity = await prisma.activityLog.create({
      data: {
        userId,
        productivityScore: score,
        activeApps: apps,
        createdAt: parseOfflineDate(body.offlineCreatedAt),
      },
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('Failed to save activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
