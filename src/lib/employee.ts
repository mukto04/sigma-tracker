import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function requireEmployee(callbackUrl = '/dashboard') {
  const session = await getSession();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      company: { select: { name: true, logoUrl: true } },
    },
  });

  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (user.role === 'ADMIN') redirect('/company-admin');
  if (user.role === 'SUPERADMIN') redirect('/superadmin');
  if (user.role !== 'EMPLOYEE') redirect('/login');

  return user;
}
