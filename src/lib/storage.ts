import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

function getStorageDir(): string {
  return path.join(process.cwd(), 'storage');
}

/**
 * Save an uploaded screenshot to local server disk storage.
 */
export async function saveScreenshotFile(
  filename: string,
  bytes: Uint8Array,
  contentType: string
): Promise<void> {
  const fullPath = path.join(getStorageDir(), filename);
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, Buffer.from(bytes));
}

/**
 * Read a screenshot for streaming to the browser.
 */
export async function getScreenshotResponse(
  filename: string
): Promise<NextResponse> {
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
    console.error('Failed to read screenshot:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Delete a screenshot file from local server disk storage.
 */
export async function deleteScreenshotFile(
  filename: string
): Promise<void> {
  try {
    const fullPath = path.join(getStorageDir(), filename);
    await fs.unlink(fullPath);
  } catch {
    // Ignore if file doesn't exist
  }
}
