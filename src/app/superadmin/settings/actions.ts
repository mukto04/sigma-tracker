'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getSettings() {
  const settingsArray = await prisma.setting.findMany();
  const settings: Record<string, string> = {};
  for (const s of settingsArray) {
    settings[s.key] = s.value;
  }
  return settings;
}

export async function updateSetting(key: string, value: string) {
  try {
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
    // For MVP, we update the first ADMIN we find. 
    // In a real app with sessions, we update the logged in user's password.
    const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
    if (!superAdmin) return { success: false, error: 'Superadmin not found' };

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
