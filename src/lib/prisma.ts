import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

function getPrisma() {
  const ctx = getRequestContext();
  if (!ctx || !ctx.env || !ctx.env.DB) {
    throw new Error("Cloudflare DB binding not found in getRequestContext()");
  }
  const adapter = new PrismaD1(ctx.env.DB);
  return new PrismaClient({ adapter });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrisma();
    return (client as any)[prop];
  }
});
