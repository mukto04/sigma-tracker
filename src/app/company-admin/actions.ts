'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/email';

export async function addEmployee(companyId: string, name: string, email: string, pass: string) {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { success: false, error: 'Email already exists' };

    const hashedPassword = await bcrypt.hash(pass, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        companyId,
      }
    });

    // Get company name for email
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Send welcome email (non-blocking — don't fail if email fails)
    sendWelcomeEmail({
      to: email,
      employeeName: name,
      companyName: company?.name || 'Your Company',
      loginUrl,
      password: pass, // plain text, before hashing
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
    await prisma.company.update({
      where: { id: companyId },
      data: { idleTimeoutMinutes: minutes }
    });
    revalidatePath('/company-admin');
    return { success: true };
  } catch (error) {
    console.error('Error updating timeout:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function addProject(companyId: string, name: string, description: string) {
  try {
    await prisma.project.create({
      data: {
        name,
        description,
        companyId
      }
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      include: { company: true },
    });

    const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Send password reset email (non-blocking)
    sendPasswordResetEmail({
      to: user.email,
      employeeName: user.name || user.email,
      companyName: user.company?.name || 'Your Company',
      loginUrl,
      newPassword, // plain text
    }).catch(console.error);

    revalidatePath('/company-admin/employees');
    return { success: true };
  } catch (error) {
    console.error('Failed to reset password:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}
