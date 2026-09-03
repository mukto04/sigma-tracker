import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, imageUrl } = body;

    if (!userId || !imageUrl) {
      return NextResponse.json({ error: 'Missing userId or imageUrl' }, { status: 400 });
    }

    const screenshot = await prisma.screenshot.create({
      data: {
        userId,
        imageUrl,
        ...(body.offlineCreatedAt ? { createdAt: new Date(body.offlineCreatedAt) } : {}),
      },
    });

    return NextResponse.json({ success: true, screenshot });
  } catch (error) {
    console.error('Failed to save screenshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
