import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 20;

    const dateParam = searchParams.get('date');
    let targetDate = new Date();
    if (dateParam) {
      const parts = dateParam.split('-');
      targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0, 0);
    } else {
      targetDate.setHours(0, 0, 0, 0);
    }
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    const screenshots = await prisma.screenshot.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: targetDate, lte: targetDateEnd }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ screenshots });
  } catch (error) {
    console.error('Failed to fetch screenshots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
