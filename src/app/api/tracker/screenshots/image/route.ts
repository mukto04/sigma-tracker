import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getScreenshotResponse } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filename = url.searchParams.get('file');

    if (!filename) {
      return new NextResponse('Missing file parameter', { status: 400 });
    }

    if (!filename.startsWith('screenshots/')) {
      return new NextResponse('Invalid file parameter', { status: 400 });
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const ownerId = filename.split('/')[1];
    const viewer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, companyId: true },
    });

    if (!viewer) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (ownerId !== viewer.id && viewer.role !== 'SUPERADMIN') {
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { companyId: true },
      });

      if (!owner || viewer.role !== 'ADMIN' || owner.companyId !== viewer.companyId) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    return await getScreenshotResponse(filename);
  } catch (error) {
    console.error('Error fetching image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
