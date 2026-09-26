import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { TrackerEnv } from '@/lib/tracker-api';

export const runtime = 'edge';

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

    const env = getRequestContext().env as TrackerEnv;
    if (!env.R2) {
      return new NextResponse('R2 binding not found', { status: 500 });
    }

    const object = await env.R2.get(filename);

    if (object === null) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'private, max-age=3600');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error fetching image from R2:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
