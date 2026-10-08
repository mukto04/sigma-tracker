import { prisma } from '@/lib/prisma';
import { decryptSetting } from '@/lib/secure-settings';

export async function getStripeSecretKey() {
  const setting = await prisma.setting.findUnique({ where: { key: 'stripe_secret_key' } });
  const savedKey = setting?.value ? await decryptSetting(setting.value) : '';
  return savedKey || process.env.STRIPE_SECRET_KEY || '';
}

export async function getStripeWebhookSecret() {
  const setting = await prisma.setting.findUnique({ where: { key: 'stripe_webhook_secret' } });
  const savedSecret = setting?.value ? await decryptSetting(setting.value) : '';
  return savedSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
}

export function isStripeConfigured(value: string) {
  return Boolean(value) && !value.includes('12345');
}
