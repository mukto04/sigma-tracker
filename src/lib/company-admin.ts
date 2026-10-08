import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type AdminCompanyContext = {
  userId: string;
  companyId: string;
  companyName: string;
};

export const requireAdminCompany = cache(async (callbackUrl: string): Promise<AdminCompanyContext> => {
  const session = await getSession();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      companyId: true,
      company: { select: { name: true } },
    },
  });

  if (!user?.companyId || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    redirect('/dashboard');
  }

  return {
    userId: user.id,
    companyId: user.companyId,
    companyName: user.company?.name || 'Sigma Workspace',
  };
});

export function clampDateRange(fromDate: Date, toDate: Date, maxDays = 31) {
  const maxMs = maxDays * 24 * 60 * 60 * 1000;
  if (toDate.getTime() - fromDate.getTime() <= maxMs) {
    return { fromDate, toDate };
  }

  const clampedFrom = new Date(toDate.getTime() - maxMs);
  clampedFrom.setHours(0, 0, 0, 0);
  return { fromDate: clampedFrom, toDate };
}
