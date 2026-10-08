import { NextResponse } from 'next/server';
import { getStripeSecretKey, isStripeConfigured } from '@/lib/stripe-settings';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      employees?: number;
      companyName?: string;
      email?: string;
    };
    const employees = Math.max(1, Math.min(500, Number(body.employees || 1)));
    const companyName = String(body.companyName || '').trim();
    const email = String(body.email || '').trim();

    if (!companyName || !email) {
      return NextResponse.json({ error: 'Company name and email are required' }, { status: 400 });
    }

    const stripeKey = await getStripeSecretKey();
    if (!isStripeConfigured(stripeKey)) {
      return NextResponse.json({ error: 'Online payments are not available yet. Please contact SigmaTracker support.' }, { status: 503 });
    }

    const origin = new URL(req.url).origin;
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('success_url', `${process.env.NEXTAUTH_URL || origin}/login?success=true`);
    params.set('cancel_url', `${process.env.NEXTAUTH_URL || origin}/?canceled=true`);
    params.set('customer_email', email);
    params.set('line_items[0][quantity]', String(employees));
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', '100');
    params.set('line_items[0][price_data][recurring][interval]', 'month');
    params.set('line_items[0][price_data][product_data][name]', `SigmaTracker Subscription - ${companyName}`);
    params.set('line_items[0][price_data][product_data][description]', `Monthly tracking for ${employees} employees`);
    params.set('metadata[companyName]', companyName);
    params.set('metadata[email]', email);
    params.set('metadata[employees]', String(employees));

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json() as { url?: string; error?: { message?: string } };
    if (!response.ok || !data.url) {
      return NextResponse.json({ error: data.error?.message || 'Failed to create checkout session' }, { status: 502 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
