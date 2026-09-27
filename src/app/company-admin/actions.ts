'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/email';

async function getAdminContext() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      companyId: true,
      company: { select: { name: true, paidSeats: true } },
    },
  });

  if (!user?.companyId || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) return null;
  return user;
}

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export async function addEmployee(companyId: string, name: string, email: string, pass: string) {
  try {
    const admin = await getAdminContext();
    if (!admin || admin.companyId !== companyId) return { success: false, error: 'Unauthorized' };

    const cleanName = String(name || '').trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPass = String(pass || '');

    if (!cleanName || !cleanEmail || cleanPass.length < 8) {
      return { success: false, error: 'Name, email and an 8+ character password are required' };
    }

    const seatLimit = Math.max(1, admin.company?.paidSeats || 3);
    const usedSeats = await prisma.user.count({
      where: { companyId: admin.companyId, role: 'EMPLOYEE' },
    });
    if (usedSeats >= seatLimit) {
      return { success: false, error: `Seat limit reached. Your current plan allows ${seatLimit} users.` };
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return { success: false, error: 'Email already exists' };

    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash(cleanPass, 10);

    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: 'EMPLOYEE',
        companyId: admin.companyId,
      },
    });

    const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    sendWelcomeEmail({
      to: cleanEmail,
      employeeName: cleanName,
      companyName: admin.company?.name || 'Your Company',
      loginUrl,
      password: cleanPass,
    }).catch(console.error);

    revalidatePath('/company-admin');
    revalidatePath('/company-admin/employees');
    return { success: true, user: newUser };
  } catch (error) {
    console.error('Error adding employee:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function updateIdleTimeout(companyId: string, minutes: number) {
  try {
    const admin = await getAdminContext();
    if (!admin || admin.companyId !== companyId) return { success: false, error: 'Unauthorized' };

    const safeMinutes = Math.max(0, Math.min(120, Math.round(Number(minutes) || 0)));
    await prisma.company.update({
      where: { id: admin.companyId },
      data: { idleTimeoutMinutes: safeMinutes },
    });
    revalidatePath('/company-admin');
    revalidatePath('/company-admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating timeout:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function addProject(companyId: string, name: string, description: string) {
  try {
    const admin = await getAdminContext();
    if (!admin || admin.companyId !== companyId) return { success: false, error: 'Unauthorized' };

    const cleanName = String(name || '').trim();
    const cleanDescription = String(description || '').trim();
    if (!cleanName || cleanName.length > 80) {
      return { success: false, error: 'Project name is required and must be 80 characters or less' };
    }

    await prisma.project.create({
      data: {
        name: cleanName,
        description: cleanDescription,
        companyId: admin.companyId,
      },
    });

    revalidatePath('/company-admin');
    revalidatePath('/company-admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to add project:', error);
    return { success: false, error: 'Internal error' };
  }
}

export async function resetEmployeePassword(userId: string, newPassword: string) {
  try {
    const admin = await getAdminContext();
    if (!admin) return { success: false, error: 'Unauthorized' };

    const cleanPassword = String(newPassword || '');
    if (cleanPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long' };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!targetUser || targetUser.companyId !== admin.companyId || targetUser.role !== 'EMPLOYEE') {
      return { success: false, error: 'Employee not found' };
    }

    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      include: { company: true },
    });

    const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    sendPasswordResetEmail({
      to: user.email,
      employeeName: user.name || user.email,
      companyName: user.company?.name || 'Your Company',
      loginUrl,
      newPassword: cleanPassword,
    }).catch(console.error);

    revalidatePath('/company-admin/employees');
    return { success: true };
  } catch (error) {
    console.error('Failed to reset password:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}
