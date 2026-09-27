'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

async function getSessionUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, companyId: true, password: true },
  });
}

export async function updateCompanyLogo(companyId: string, base64Image: string) {
  try {
    const user = await getSessionUser();
    if (!user || user.companyId !== companyId || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return { error: 'Unauthorized' };
    }

    if (!base64Image.startsWith('data:image/') || base64Image.length > 700_000) {
      return { error: 'Please upload an image under 500 KB' };
    }

    await prisma.company.update({
      where: { id: user.companyId },
      data: { logoUrl: base64Image }
    });
    revalidatePath('/company-admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update company logo:', error);
    return { error: 'Failed to update company logo' };
  }
}

export async function updateUserAvatar(userId: string, base64Image: string) {
  try {
    const user = await getSessionUser();
    if (!user || user.id !== userId) return { error: 'Unauthorized' };

    if (!base64Image.startsWith('data:image/') || base64Image.length > 700_000) {
      return { error: 'Please upload an image under 500 KB' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: base64Image }
    });
    revalidatePath('/dashboard');
    revalidatePath('/company-admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to update avatar:', error);
    return { error: 'Failed to update avatar' };
  }
}

export async function changePassword(userId: string, oldPass: string, newPass: string) {
  try {
    const user = await getSessionUser();
    if (!user || user.id !== userId) return { error: 'Unauthorized' };

    if (!newPass || newPass.length < 8) {
      return { error: 'New password must be at least 8 characters long' };
    }

    const isValid = await bcrypt.compare(oldPass, user.password);
    if (!isValid) return { error: 'Current password is incorrect' };

    const hashed = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to change password:', error);
    return { error: 'Failed to change password' };
  }
}
