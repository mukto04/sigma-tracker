'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function updateCompanyLogo(companyId: string, base64Image: string) {
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: base64Image }
    });
    revalidatePath('/company-admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateUserAvatar(userId: string, base64Image: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: base64Image }
    });
    revalidatePath('/dashboard');
    revalidatePath('/company-admin');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function changePassword(userId: string, oldPass: string, newPass: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'User not found' };

    if (!newPass || newPass.length < 6) {
      return { error: 'New password must be at least 6 characters long' };
    }

    const isValid = await bcrypt.compare(oldPass, user.password);
    if (!isValid) return { error: 'Current password is incorrect' };

    const hashed = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    });
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
