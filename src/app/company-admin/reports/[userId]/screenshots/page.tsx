import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ScreenshotGrid } from '@/components/ScreenshotGrid';
import { clampDateRange, requireAdminCompany } from '@/lib/company-admin';

export const dynamic = 'force-dynamic';

function getLocalDateStr(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseRange(fromStr: string, toStr: string) {
  const [fy, fm, fd] = fromStr.split('-').map(Number);
  const [ty, tm, td] = toStr.split('-').map(Number);
  const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
  const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);
  return clampDateRange(fromDate, toDate);
}

export default async function EmployeeScreenshotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { userId } = await params;
  const query = await searchParams;
  const todayStr = getLocalDateStr(new Date());
  const fromStr = query.from || todayStr;
  const toStr = query.to || todayStr;
  const { fromDate, toDate } = parseRange(fromStr, toStr);
  const company = await requireAdminCompany(`/company-admin/reports/${userId}/screenshots`);

  const user = await prisma.user.findFirst({
    where: { id: userId, companyId: company.companyId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Employee not found.</p>
        <Link href="/company-admin/reports">Back to Reports</Link>
      </div>
    );
  }

  const screenshots = await prisma.screenshot.findMany({
    where: { userId: user.id, createdAt: { gte: fromDate, lte: toDate } },
    select: { id: true, imageUrl: true, createdAt: true, userId: true },
    orderBy: { createdAt: 'desc' },
    take: 120,
  });

  const normalizedScreenshots = screenshots.map((screenshot) => {
    if (screenshot.imageUrl && screenshot.imageUrl.includes('pub-your-r2-dev-url.r2.dev')) {
      const parts = screenshot.imageUrl.split('/');
      const filename = parts.slice(parts.length - 3).join('/');
      return { ...screenshot, imageUrl: `/api/tracker/screenshots/image?file=${filename}` };
    }
    return screenshot;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href={`/company-admin/reports?from=${fromStr}&to=${toStr}`} style={{ color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
          Reports Overview
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <Link href={`/company-admin/reports/${user.id}?from=${fromStr}&to=${toStr}`} style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
          {user.name || user.email} Details
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          {user.name || user.email} Screenshots
        </h1>
        <p style={{ color: '#64748b', margin: '0.35rem 0 0' }}>
          Showing up to 120 screenshots from <strong>{fromStr}</strong> to <strong>{toStr}</strong>
        </p>
      </div>

      <ScreenshotGrid screenshots={normalizedScreenshots} />
    </div>
  );
}
