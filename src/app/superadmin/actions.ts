'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateCompanyPlan(companyId: string, newPlan: string) {
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { plan: newPlan }
    });
    
    // Revalidate the page so it shows the updated plan immediately
    revalidatePath('/superadmin');
    return { success: true };
  } catch (error) {
    console.error('Failed to update plan:', error);
    return { success: false, error: 'Failed to update plan' };
  }
}

export async function createCompanyManually(
  companyName: string, 
  adminEmail: string, 
  adminName: string, 
  adminPassword: string,
  employeeCount: number = 1,
  validityDays: number = 30
) {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) return { success: false, error: 'User with this email already exists.' };

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Calculate dates
    const purchaseDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + validityDays);

    const company = await prisma.company.create({
      data: {
        name: companyName,
        paidSeats: employeeCount,
        purchaseDate: purchaseDate,
        endDate: endDate,
        users: {
          create: {
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            role: 'ADMIN'
          }
        }
      }
    });
    
    revalidatePath('/superadmin');
    revalidatePath('/superadmin/purchases');
    revalidatePath('/superadmin/tenants');
    return { success: true, company };
  } catch (error) {
    console.error('Failed to create company:', error);
    return { success: false, error: 'Failed to create company manually.' };
  }
}

export async function softDeleteCompany(companyId: string) {
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { subscriptionStatus: 'Deleted' }
    });
    revalidatePath('/superadmin');
    revalidatePath('/superadmin/tenants');
    return { success: true };
  } catch (error) {
    console.error('Failed to soft delete company:', error);
    return { success: false, error: 'Failed to delete company' };
  }
}

export async function restoreCompany(companyId: string) {
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { subscriptionStatus: 'Active' }
    });
    revalidatePath('/superadmin');
    revalidatePath('/superadmin/tenants');
    return { success: true };
  } catch (error) {
    console.error('Failed to restore company:', error);
    return { success: false, error: 'Failed to restore company' };
  }
}

export async function hardDeleteCompany(companyId: string) {
  try {
    // Delete users first due to foreign key
    await prisma.user.deleteMany({
      where: { companyId }
    });
    // Delete the company
    await prisma.company.delete({
      where: { id: companyId }
    });
    revalidatePath('/superadmin');
    revalidatePath('/superadmin/tenants');
    return { success: true };
  } catch (error) {
    console.error('Failed to hard delete company:', error);
    return { success: false, error: 'Failed to permanently delete company' };
  }
}

export async function editCompany(companyId: string, companyName: string, employeeCount: number, validityDays: number) {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + validityDays);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        name: companyName,
        paidSeats: employeeCount,
        endDate: endDate
      }
    });
    revalidatePath('/superadmin');
    revalidatePath('/superadmin/tenants');
    return { success: true };
  } catch (error) {
    console.error('Failed to edit company:', error);
    return { success: false, error: 'Failed to update company details' };
  }
}
