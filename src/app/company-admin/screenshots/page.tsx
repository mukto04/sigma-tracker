import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UnifiedScreenshotStream } from './UnifiedScreenshotStream';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function CompanyAdminScreenshotsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; userId?: string }>;
}) {
  const query = await searchParams;
  const range = query.range || 'today';
  const selectedUserId = query.userId || '';

  const company = await prisma.company.findFirst({
    where: { name: { not: 'Superadmin HQ' } },
    include: { users: true },
  });

  if (!company) return null;

  const employees = company.users.filter(u => u.role !== 'SUPERADMIN');

  // Compute date range
  const now = new Date();
  let fromDate: Date | undefined = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  let toDate: Date | undefined = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (range === 'yesterday') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (range === '7days') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
  } else if (range === 'all') {
    fromDate = undefined;
    toDate = undefined;
  }

  // Build screenshot where clause
  const whereClause: any = {
    user: { companyId: company.id },
  };

  if (fromDate || toDate) {
    whereClause.createdAt = {};
    if (fromDate) whereClause.createdAt.gte = fromDate;
    if (toDate) whereClause.createdAt.lte = toDate;
  }

  if (selectedUserId) {
    whereClause.userId = selectedUserId;
  }

  const screenshots = await prisma.screenshot.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 120, // Clean batch limit
  });

  // Unique users with screenshots
  const userScreenshotCounts: Record<string, number> = {};
  screenshots.forEach(s => {
    userScreenshotCounts[s.userId] = (userScreenshotCounts[s.userId] || 0) + 1;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Company Screenshots Feed</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            Unified real-time desktop screen captures for {company.name}
          </p>
        </div>

        {/* Date Presets */}
        <div style={{ display: 'inline-flex', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.25rem', gap: '0.25rem' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: 'all', label: 'All Time' },
          ].map(tab => (
            <Link
              key={tab.id}
              href={`/company-admin/screenshots?range=${tab.id}${selectedUserId ? `&userId=${selectedUserId}` : ''}`}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
                backgroundColor: range === tab.id ? '#2563eb' : 'transparent',
                color: range === tab.id ? 'white' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Employee Quick Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', marginRight: '0.25rem' }}>Filter by Employee:</span>
        <Link
          href={`/company-admin/screenshots?range=${range}`}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textDecoration: 'none',
            backgroundColor: !selectedUserId ? '#0f172a' : 'white',
            color: !selectedUserId ? 'white' : '#475569',
            border: '1px solid',
            borderColor: !selectedUserId ? '#0f172a' : '#e2e8f0',
          }}
        >
          All Team Members ({screenshots.length})
        </Link>

        {employees.map(emp => {
          const isSelected = selectedUserId === emp.id;
          return (
            <Link
              key={emp.id}
              href={`/company-admin/screenshots?range=${range}&userId=${emp.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
                backgroundColor: isSelected ? '#2563eb' : 'white',
                color: isSelected ? 'white' : '#475569',
                border: '1px solid',
                borderColor: isSelected ? '#2563eb' : '#e2e8f0',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#eff6ff', color: isSelected ? 'white' : '#2563eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700 }}>
                {(emp.name || emp.email).substring(0, 1).toUpperCase()}
              </span>
              <span>{emp.name || emp.email.split('@')[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* Unified Stream Grid */}
      <UnifiedScreenshotStream screenshots={screenshots} />
    </div>
  );
}
