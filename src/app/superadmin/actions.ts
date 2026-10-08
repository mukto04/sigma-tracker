'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getSuperadminUser } from '@/lib/superadmin';

async function ensureSuperadmin() {
  const user = await getSuperadminUser();
  if (!user) return { success: false as const, error: 'Unauthorized' };
  return null;
}

export async function updateCompanyPlan(companyId: string, newPlan: string) {
  try {
    const unauthorized = await ensureSuperadmin();
    if (unauthorized) return unauthorized;

    const safePlan = String(newPlan || '').trim().toUpperCase();
    if (!['FREE', 'PRO', 'ENTERPRISE'].includes(safePlan)) {
      return { success: false, error: 'Invalid plan' };
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { plan: safePlan }
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
  validityDays: number = 30,
  plan: string = 'PRO',
  monthlySeatPrice: number = 1
) {
  try {
    const unauthorized = await ensureSuperadmin();
    if (unauthorized) return unauthorized;

    const cleanCompanyName = String(companyName || '').trim();
    const cleanAdminEmail = String(adminEmail || '').trim().toLowerCase();
    const cleanAdminName = String(adminName || '').trim();
    const cleanPassword = String(adminPassword || '');
    const seats = Math.max(1, Math.min(500, Math.round(Number(employeeCount) || 1)));
    const days = Math.max(1, Math.min(3650, Math.round(Number(validityDays) || 30)));
    const safePlan = ['PRO', 'ENTERPRISE'].includes(String(plan).toUpperCase()) ? String(plan).toUpperCase() : 'PRO';
    const unitAmount = Math.max(1, Math.min(1000000, Math.round(Number(monthlySeatPrice) * 100)));

    if (!cleanCompanyName || !cleanAdminEmail || !cleanAdminName || cleanPassword.length < 8) {
      return { success: false, error: 'Company, admin and 8+ character password are required.' };
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanAdminEmail } });
    if (existingUser) return { success: false, error: 'User with this email already exists.' };

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    
    // Calculate dates
    const purchaseDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const subscriptionId = crypto.randomUUID();
    const company = await prisma.company.create({
      data: {
        name: cleanCompanyName,
        plan: safePlan,
        paidSeats: seats,
        purchaseDate: null,
        endDate: endDate,
        subscriptionStatus: 'Payment Pending',
        subscriptions: {
          create: {
            id: subscriptionId,
            plan: safePlan,
            seatCount: seats,
            unitAmount,
            currency: 'usd',
            interval: 'month',
            status: 'Payment Pending',
          },
        },
        payments: {
          create: {
            id: crypto.randomUUID(),
            subscriptionId,
            amount: seats * unitAmount,
            currency: 'usd',
            status: 'Pending',
            description: `${safePlan} subscription, ${seats} seat${seats === 1 ? '' : 's'} (${days} day access)` ,
            dueAt: purchaseDate,
          },
        },
        users: {
          create: {
            email: cleanAdminEmail,
            name: cleanAdminName,
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

export async function recordManualPayment(companyId: string) {
  try {
    const unauthorized = await ensureSuperadmin();
    if (unauthorized) return unauthorized;

    const subscription = await prisma.subscription.findFirst({
      where: { companyId, status: { in: ['Payment Pending', 'Past Due'] } },
      include: { payments: { where: { status: 'Pending' }, orderBy: { createdAt: 'asc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
    const payment = subscription?.payments[0];
    if (!subscription || !payment) return { success: false, error: 'No pending payment was found.' };

    const now = new Date();
    const nextRenewal = new Date(now);
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'Paid', paidAt: now, description: `${payment.description} - Manual payment received` } });
    await prisma.subscription.update({ where: { id: subscription.id }, data: { status: 'Active', startedAt: now, currentPeriodEnd: nextRenewal } });
    await prisma.company.update({ where: { id: companyId }, data: { subscriptionStatus: 'Active', purchaseDate: now, renewalDate: nextRenewal } });

    revalidatePath('/superadmin');
    revalidatePath('/company-admin/subscriptions');
    revalidatePath('/company-admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to record manual payment:', error);
    return { success: false, error: 'Unable to record manual payment.' };
  }
}

export async function softDeleteCompany(companyId: string) {
  try {
    const unauthorized = await ensureSuperadmin();
    if (unauthorized) return unauthorized;

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
    const unauthorized = await ensureSuperadmin();
    if (unauthorized) return unauthorized;

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
    const unauthorized = await ensureSuperadmin();
    if (unauthorized) return unauthorized;

    console.warn(`Permanent delete blocked for company ${companyId}. Use soft delete until backup/export retention is implemented.`);
    return { success: false, error: 'Permanent delete is disabled for data safety. Use soft delete instead.' };
  } catch (error) {
    console.error('Failed to hard delete company:', error);
    return { success: false, error: 'Failed to permanently delete company' };
  }
}

export async function editCompany(companyId: string, companyName: string, employeeCount: number, validityDays: number) {
  try {
    const unauthorized = await ensureSuperadmin();
    if (unauthorized) return unauthorized;

    const cleanCompanyName = String(companyName || '').trim();
    const seats = Math.max(1, Math.min(500, Math.round(Number(employeeCount) || 1)));
    const days = Math.max(1, Math.min(3650, Math.round(Number(validityDays) || 30)));
    if (!cleanCompanyName) return { success: false, error: 'Company name is required' };

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        name: cleanCompanyName,
        paidSeats: seats,
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
