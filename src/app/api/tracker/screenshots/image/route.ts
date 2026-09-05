import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filename = url.searchParams.get('file');

    if (!filename) {
      return new NextResponse('Missing file parameter', { status: 400 });
    }

    const env = getRequestContext().env as any;
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
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error('Error fetching image from R2:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
