import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ScreenshotGrid } from '@/components/ScreenshotGrid';

function getLocalDateStr(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

  const [fy, fm, fd] = fromStr.split('-').map(Number);
  const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);

  const [ty, tm, td] = toStr.split('-').map(Number);
  const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      screenshots: {
        where: { createdAt: { gte: fromDate, lte: toDate } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Employee not found.</p>
        <Link href="/company-admin/reports">← Back to Reports</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link
          href={`/company-admin/reports?from=${fromStr}&to=${toStr}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
        >
          ← Reports Overview
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <Link
          href={`/company-admin/reports/${user.id}?from=${fromStr}&to=${toStr}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#2563eb', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
        >
          {user.name || user.email} Details
        </Link>
      </div>

      {/* Header Info Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgb(0 0 0 / 0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            backgroundColor: '#eff6ff', color: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.25rem',
          }}>
            {(user.name || user.email).substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {user.name || user.email}&apos;s Screenshots
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Showing screenshots from <strong>{fromStr}</strong> to <strong>{toStr}</strong>
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'right',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Screenshots
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>
            {user.screenshots.length}
          </div>
        </div>
      </div>

      {/* Interactive Screenshot Gallery Grid */}
      <ScreenshotGrid screenshots={user.screenshots} />
    </div>
  );
}
