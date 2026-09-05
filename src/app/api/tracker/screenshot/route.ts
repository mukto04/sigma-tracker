import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, imageUrl } = body;

    if (!userId || !imageUrl) {
      return NextResponse.json({ error: 'Missing userId or imageUrl' }, { status: 400 });
    }

    let finalImageUrl = imageUrl;

    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      
      // Cloudflare R2 accepts ArrayBuffer, so we decode base64 to Uint8Array
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const filename = `screenshots/${userId}/${Date.now()}.jpg`;

      const env = getRequestContext().env as any;
      if (!env.R2) throw new Error("R2 binding not found");

      await env.R2.put(filename, bytes.buffer, {
        httpMetadata: { contentType: 'image/jpeg' },
      });

      // Use our internal proxy endpoint so we don't need the user to setup a Public R2 Bucket domain
      finalImageUrl = `/api/tracker/screenshots/image?file=${filename}`;
    }

    const screenshot = await prisma.screenshot.create({
      data: {
        userId,
        imageUrl: finalImageUrl,
        ...(body.offlineCreatedAt ? { createdAt: new Date(body.offlineCreatedAt) } : {}),
      },
    });

    return NextResponse.json({ success: true, screenshot });
  } catch (error) {
    console.error('Failed to save screenshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
