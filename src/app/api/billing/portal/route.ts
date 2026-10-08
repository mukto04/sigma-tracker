import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripeSecretKey, isStripeConfigured } from '@/lib/stripe-settings';

export const runtime = 'edge';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true, role: true } });
  if (!user?.companyId || !['ADMIN', 'SUPERADMIN'].includes(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const subscription = await prisma.subscription.findFirst({ where: { companyId: user.companyId, stripeCustomerId: { not: null } }, orderBy: { createdAt: 'desc' } });
  if (!subscription?.stripeCustomerId) return NextResponse.json({ error: 'Add a payment method through the outstanding payment first.' }, { status: 400 });
  const stripeKey = await getStripeSecretKey();
  if (!isStripeConfigured(stripeKey)) return NextResponse.json({ error: 'Payments are not configured. Please contact SigmaTracker support.' }, { status: 503 });

  const params = new URLSearchParams({ customer: subscription.stripeCustomerId, return_url: `${new URL(req.url).origin}/company-admin/settings` });
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', { method: 'POST', headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
  const data = await response.json() as { url?: string; error?: { message?: string } };
  if (!response.ok || !data.url) return NextResponse.json({ error: data.error?.message || 'Unable to open billing portal.' }, { status: 502 });
  return NextResponse.json({ url: data.url });
}
