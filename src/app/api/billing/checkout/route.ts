import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripeSecretKey, isStripeConfigured } from '@/lib/stripe-settings';


export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true, role: true, email: true } });
  if (!user?.companyId || !['ADMIN', 'SUPERADMIN'].includes(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const subscription = await prisma.subscription.findFirst({
    where: { companyId: user.companyId, status: { in: ['Payment Pending', 'Past Due'] } },
    include: { company: { select: { name: true } }, payments: { where: { status: 'Pending' }, orderBy: { createdAt: 'asc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });
  const payment = subscription?.payments[0];
  if (!subscription || !payment) return NextResponse.json({ error: 'No payment is currently due.' }, { status: 400 });

  const stripeKey = await getStripeSecretKey();
  if (!isStripeConfigured(stripeKey)) return NextResponse.json({ error: 'Payments are not configured. Please contact SigmaTracker support.' }, { status: 503 });

  const origin = new URL(req.url).origin;
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', `${origin}/company-admin/settings?billing=success`);
  params.set('cancel_url', `${origin}/company-admin/settings?billing=cancelled`);
  params.set('customer_email', user.email);
  params.set('client_reference_id', user.companyId);
  params.set('line_items[0][quantity]', String(subscription.seatCount));
  params.set('line_items[0][price_data][currency]', subscription.currency);
  params.set('line_items[0][price_data][unit_amount]', String(subscription.unitAmount));
  params.set('line_items[0][price_data][recurring][interval]', subscription.interval);
  params.set('line_items[0][price_data][product_data][name]', `SigmaTracker ${subscription.plan} subscription`);
  params.set('line_items[0][price_data][product_data][description]', `${subscription.seatCount} licensed seat${subscription.seatCount === 1 ? '' : 's'} for ${subscription.company.name}`);
  params.set('metadata[flow]', 'manual_subscription_payment');
  params.set('metadata[companyId]', user.companyId);
  params.set('metadata[subscriptionId]', subscription.id);
  params.set('metadata[paymentId]', payment.id);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await response.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !data.url || !data.id) return NextResponse.json({ error: data.error?.message || 'Unable to start secure checkout.' }, { status: 502 });

  await prisma.payment.update({ where: { id: payment.id }, data: { stripeCheckoutSessionId: data.id } });
  return NextResponse.json({ url: data.url });
}
