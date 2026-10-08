'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getSuperadminUser } from '@/lib/superadmin';
import { encryptSetting } from '@/lib/secure-settings';

export async function getSettings() {
  const admin = await getSuperadminUser();
  if (!admin) return {};

  const settingsArray = await prisma.setting.findMany();
  const settings: Record<string, string | boolean> = {};
  for (const s of settingsArray) {
    if (s.key === 'smtp2go_api_key') {
      settings.smtp2go_api_key_configured = Boolean(s.value);
      continue;
    }
    settings[s.key] = s.value;
  }
  return settings;
}

export async function updateSetting(key: string, value: string) {
  try {
    const admin = await getSuperadminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    const allowedKeys = [
      'login_title',
      'login_subtitle',
      'stripe_public_key',
      'stripe_secret_key',
      'stripe_webhook_secret',
      'smtp_host',
      'smtp_port',
      'smtp_user',
      'smtp_pass',
      'smtp_from_name',
      'smtp2go_api_key',
    ];
    if (!allowedKeys.includes(key)) return { success: false, error: 'Invalid setting' };

    const storedValue = key === 'smtp2go_api_key' ? await encryptSetting(value.trim()) : value;
    await prisma.setting.upsert({
      where: { key },
      update: { value: storedValue },
      create: { key, value: storedValue }
    });
    revalidatePath('/superadmin/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to update setting:', error);
    return { success: false, error: 'Internal error' };
  }
}

export async function updateMasterSecret(newPass: string) {
  try {
    const superAdmin = await getSuperadminUser();
    if (!superAdmin) return { success: false, error: 'Unauthorized' };
    if (!newPass || newPass.length < 8) return { success: false, error: 'Password must be at least 8 characters' };

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update master secret:', error);
    return { success: false, error: 'Internal error' };
  }
}
