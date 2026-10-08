import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

type R2BucketLike = {
  put(
    key: string,
    value: unknown,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: BodyInit | null;
    httpEtag: string;
    writeHttpMetadata(headers: Headers): void;
  } | null>;
  delete(key: string): Promise<unknown>;
};

export type StorageEnv = {
  R2?: R2BucketLike;
};

function getStorageDir(): string {
  return path.join(process.cwd(), 'storage');
}

/**
 * Save an uploaded screenshot.
 * Uses Cloudflare R2 if available, otherwise falls back to local server disk storage.
 */
export async function saveScreenshotFile(
  filename: string,
  bytes: Uint8Array,
  contentType: string,
  env?: StorageEnv
): Promise<void> {
  // 1. Try Cloudflare R2 binding if present
  if (env?.R2) {
    await env.R2.put(filename, bytes.buffer as ArrayBuffer, {
      httpMetadata: { contentType },
    });
    return;
  }

  // 2. Fallback to Local Server Disk Storage
  const fullPath = path.join(getStorageDir(), filename);
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, Buffer.from(bytes));
}

/**
 * Read a screenshot for streaming to the browser.
 * Reads from Cloudflare R2 if available, otherwise from local server disk storage.
 */
export async function getScreenshotResponse(
  filename: string,
  env?: StorageEnv
): Promise<NextResponse> {
  // 1. Try Cloudflare R2 binding if present
  if (env?.R2) {
    const object = await env.R2.get(filename);
    if (object === null) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(object.body, { headers });
  }

  // 2. Fallback to Local Server Disk Storage
  try {
    const fullPath = path.join(getStorageDir(), filename);
    const data = await fs.readFile(fullPath);

    // Determine content type by extension
    let contentType = 'image/jpeg';
    if (filename.endsWith('.png')) contentType = 'image/png';
    else if (filename.endsWith('.webp')) contentType = 'image/webp';

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'ENOENT') {
      return new NextResponse('Image not found', { status: 404 });
    }
    console.error('Failed to read local screenshot:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Delete a screenshot file from R2 or local disk storage.
 */
export async function deleteScreenshotFile(
  filename: string,
  env?: StorageEnv
): Promise<void> {
  if (env?.R2) {
    await env.R2.delete(filename);
    return;
  }

  try {
    const fullPath = path.join(getStorageDir(), filename);
    await fs.unlink(fullPath);
  } catch {
    // Ignore if file doesn't exist
  }
}
