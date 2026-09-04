import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

function getPrisma() {
  try {
    const ctx = getRequestContext();
    if (!ctx || !ctx.env || !ctx.env.DB) {
      throw new Error("Cloudflare DB binding not found");
    }
    const adapter = new PrismaD1(ctx.env.DB);
    return new PrismaClient({ adapter });
  } catch (error) {
    // During Next.js build time, getRequestContext throws because it's not the edge runtime.
    // We return a dummy proxy so the build doesn't crash.
    return new Proxy({}, {
      get() { return () => Promise.resolve(null); }
    }) as unknown as PrismaClient;
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrisma();
    return (client as any)[prop];
  }
});
