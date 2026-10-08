import { NextResponse } from 'next/server';
import { requireAdminCompany } from '@/lib/company-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdminCompany('/company-admin/settings');

  const company = await prisma.company.findUnique({
    where: { id: admin.companyId },
    select: {
      id: true,
      logoUrl: true,
      idleTimeoutMinutes: true,
      plan: true,
      paidSeats: true,
      subscriptionStatus: true,
      purchaseDate: true,
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          plan: true,
          seatCount: true,
          unitAmount: true,
          currency: true,
          interval: true,
          status: true,
          paymentMethodLabel: true,
          stripeCustomerId: true,
          currentPeriodEnd: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 12,
            select: { id: true, amount: true, currency: true, status: true, description: true, dueAt: true, paidAt: true, createdAt: true },
          },
        },
      },
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, name: true, description: true },
      },
    },
  });

  return NextResponse.json(
    {
      userId: admin.userId,
      company: company || {
        id: admin.companyId,
        logoUrl: null,
        idleTimeoutMinutes: 10,
        plan: 'FREE',
        paidSeats: 0,
        subscriptionStatus: 'Inactive',
        purchaseDate: null,
        subscriptions: [],
        projects: [],
      },
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
