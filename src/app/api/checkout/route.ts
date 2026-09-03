import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_12345', {
  apiVersion: '2026-08-26.dahlia' as any, // Cast to any to avoid type error if strict, or use the exact string
});

export async function POST(req: Request) {
  try {
    const { employees, companyName, email } = await req.json();

    if (!employees || employees < 1) {
      return NextResponse.json({ error: 'At least 1 employee is required' }, { status: 400 });
    }

    // Dynamic price calculation: $1.00 USD per employee per month
    // Stripe expects amounts in cents, so $1.00 = 100 cents
    const unitAmount = 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SigmaTracker Subscription - ${companyName}`,
              description: `Monthly tracking for ${employees} employees`,
            },
            unit_amount: unitAmount,
            recurring: { interval: 'month' },
          },
          quantity: employees,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/?canceled=true`,
      customer_email: email,
      metadata: {
        companyName,
        email,
        employees: employees.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error.message);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
