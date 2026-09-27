'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getSuperadminUser } from '@/lib/superadmin';

export async function getSettings() {
  const admin = await getSuperadminUser();
  if (!admin) return {};

  const settingsArray = await prisma.setting.findMany();
  const settings: Record<string, string> = {};
  for (const s of settingsArray) {
    settings[s.key] = s.value;
  }
  return settings;
}

export async function updateSetting(key: string, value: string) {
  try {
    const admin = await getSuperadminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    const allowedKeys = ['login_title', 'login_subtitle', 'smtp_user', 'smtp_from_name'];
    if (!allowedKeys.includes(key)) return { success: false, error: 'Invalid setting' };

    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
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
