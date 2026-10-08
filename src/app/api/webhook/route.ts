import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';
import { getStripeWebhookSecret } from '@/lib/stripe-settings';

export const runtime = 'edge';

type StripeEvent = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      customer?: string;
      subscription?: string;
      metadata?: {
        companyName?: string;
        email?: string;
        employees?: string;
        flow?: string;
        companyId?: string;
        subscriptionId?: string;
        paymentId?: string;
      };
    };
  };
};

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function makeTemporaryPassword() {
  return `${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}A1!`;
}

async function verifyStripeSignature(body: string, signature: string | null, secret: string) {
  if (!signature) return false;

  const parts = Object.fromEntries(
    signature.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    })
  );

  if (!parts.t || !parts.v1) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${body}`));

  return toHex(digest) === parts.v1;
}

export async function POST(req: Request) {
  const webhookSecret = await getStripeWebhookSecret();
  if (!webhookSecret || webhookSecret.includes('12345')) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const isValid = await verifyStripeSignature(body, signature, webhookSecret);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const event = JSON.parse(body) as StripeEvent;

  if (event.type === 'checkout.session.completed') {
    const metadata = event.data?.object?.metadata;
    const sessionObject = event.data?.object;
    if (metadata?.flow === 'manual_subscription_payment' && metadata.companyId && metadata.subscriptionId && metadata.paymentId) {
      try {
        const now = new Date();
        const nextRenewal = new Date(now);
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        await prisma.payment.updateMany({
          where: { id: metadata.paymentId, companyId: metadata.companyId, subscriptionId: metadata.subscriptionId, status: 'Pending' },
          data: { status: 'Paid', paidAt: now, stripeCheckoutSessionId: sessionObject?.id || undefined },
        });
        await prisma.subscription.update({
          where: { id: metadata.subscriptionId },
          data: {
            status: 'Active',
            stripeCustomerId: sessionObject?.customer || undefined,
            stripeSubscriptionId: sessionObject?.subscription || undefined,
            startedAt: now,
            currentPeriodEnd: nextRenewal,
          },
        });
        await prisma.company.update({
          where: { id: metadata.companyId },
          data: { subscriptionStatus: 'Active', purchaseDate: now, renewalDate: nextRenewal },
        });
      } catch (error) {
        console.error('Error activating manual subscription:', error);
        return NextResponse.json({ received: false, error: 'Unable to activate subscription' }, { status: 500 });
      }
      return NextResponse.json({ received: true, activated: 'manual_subscription' });
    }

    const companyName = metadata?.companyName;
    const email = metadata?.email?.trim().toLowerCase();
    const employees = Math.max(1, Math.min(500, parseInt(metadata?.employees || '1', 10)));

    if (companyName && email) {
      try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          console.warn(`Stripe webhook skipped provisioning because ${email} already exists.`);
          return NextResponse.json({ received: true, skipped: 'email_exists' });
        }

        const subscriptionId = crypto.randomUUID();
        const amount = employees * 100;
        const newCompany = await prisma.company.create({
          data: {
            name: companyName,
            plan: 'PRO',
            paidSeats: employees,
            subscriptionStatus: 'Active',
            purchaseDate: new Date(),
            renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            subscriptions: { create: { id: subscriptionId, plan: 'PRO', seatCount: employees, unitAmount: 100, status: 'Active', stripeCustomerId: sessionObject?.customer || undefined, stripeSubscriptionId: sessionObject?.subscription || undefined, startedAt: new Date(), currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)) } },
            payments: { create: { id: crypto.randomUUID(), subscriptionId, amount, status: 'Paid', description: `Pro subscription, ${employees} seat${employees === 1 ? '' : 's'}`, paidAt: new Date(), stripeCheckoutSessionId: sessionObject?.id || undefined } },
          },
        });

        const tempPassword = makeTemporaryPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await prisma.user.create({
          data: {
            name: 'Admin',
            email,
            password: hashedPassword,
            role: 'ADMIN',
            companyId: newCompany.id,
          },
        });

        const loginUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
        await sendWelcomeEmail({
          to: email,
          employeeName: 'Admin',
          companyName,
          loginUrl,
          password: tempPassword,
        });
      } catch (error) {
        console.error('Error provisioning company from webhook:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
