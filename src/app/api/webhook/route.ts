import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';

export const runtime = 'edge';

type StripeEvent = {
  type?: string;
  data?: {
    object?: {
      metadata?: {
        companyName?: string;
        email?: string;
        employees?: string;
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
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

        const newCompany = await prisma.company.create({
          data: {
            name: companyName,
            plan: 'PRO',
            paidSeats: employees,
            subscriptionStatus: 'Active',
            purchaseDate: new Date(),
            renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
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
