import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DateFilter from './DateFilter';

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h === 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getLocalDateStr(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;

  const todayStr = getLocalDateStr(new Date());
  const fromStr = params.from || todayStr;
  const toStr = params.to || todayStr;

  const [fy, fm, fd] = fromStr.split('-').map(Number);
  const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);

  const [ty, tm, td] = toStr.split('-').map(Number);
  const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);

  const company = await prisma.company.findFirst({
    where: { name: { not: 'Superadmin HQ' } },
    include: {
      users: { where: { role: { not: 'SUPERADMIN' } } }
    }
  });

  if (!company) return null;

  // Fetch all data in date range for this company
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      user: { companyId: company.id },
      startTime: { gte: fromDate, lte: toDate }
    }
  });

  const activities = await prisma.activityLog.findMany({
    where: {
      user: { companyId: company.id },
      createdAt: { gte: fromDate, lte: toDate }
    }
  });

  const screenshots = await prisma.screenshot.findMany({
    where: {
      user: { companyId: company.id },
      createdAt: { gte: fromDate, lte: toDate }
    }
  });

  // Build per-user report rows
  const rows = company.users.map(user => {
    const userEntries = timeEntries.filter(e => e.userId === user.id);
    let totalSeconds = 0;
    userEntries.forEach(e => {
      if (e.duration !== null) {
        totalSeconds += e.duration;
      } else {
        let ongoing = Math.floor((Date.now() - new Date(e.startTime).getTime()) / 1000);
        if (ongoing > 24 * 3600) ongoing = 0;
        totalSeconds += ongoing;
      }
    });

    const userActivities = activities.filter(a => a.userId === user.id);
    const avgActivity = userActivities.length > 0
      ? Math.round(userActivities.reduce((acc, a) => acc + a.productivityScore, 0) / userActivities.length)
      : 0;

    const screenshotCount = screenshots.filter(s => s.userId === user.id).length;

    return {
      user,
      totalSeconds,
      avgActivity,
      screenshotCount,
    };
  });

  const styles = {
    th: {
      padding: '1rem 1.5rem',
      textAlign: 'left' as const,
      fontSize: '0.75rem',
      fontWeight: 700,
      color: '#64748b',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
    },
    td: {
      padding: '1rem 1.5rem',
      fontSize: '0.875rem',
      color: '#0f172a',
      borderBottom: '1px solid #f1f5f9',
      verticalAlign: 'middle' as const,
    },
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Reports</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          Showing data from <strong>{fromStr}</strong> to <strong>{toStr}</strong>
        </p>
      </div>

      {/* Date Filter */}
      <DateFilter currentFrom={fromStr} currentTo={toStr} />

      {/* Report Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgb(0 0 0 / 0.08)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={styles.th}>Employee</th>
              <th style={styles.th}>Time Logged</th>
              <th style={styles.th}>Avg Activity</th>
              <th style={styles.th}>Screenshots</th>
              <th style={styles.th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ user, totalSeconds, avgActivity, screenshotCount }) => (
              <tr key={user.id} style={{ transition: 'background 0.15s' }}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: '#eff6ff', color: '#2563eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.875rem', flexShrink: 0
                    }}>
                      {(user.name || user.email).substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                    {formatDuration(totalSeconds)}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      height: '6px', width: '60px', borderRadius: '99px',
                      backgroundColor: '#e2e8f0', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${avgActivity}%`, borderRadius: '99px',
                        backgroundColor: avgActivity >= 70 ? '#16a34a' : avgActivity >= 40 ? '#d97706' : '#dc2626',
                      }} />
                    </div>
                    <span style={{ fontWeight: 600, color: avgActivity >= 70 ? '#16a34a' : avgActivity >= 40 ? '#d97706' : '#dc2626' }}>
                      {avgActivity}%
                    </span>
                  </div>
                </td>
                <td style={styles.td}>
                  <Link
                    href={`/company-admin/reports/${user.id}/screenshots?from=${fromStr}&to=${toStr}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.75rem',
                      backgroundColor: screenshotCount > 0 ? '#f0fdf4' : '#f8fafc',
                      color: screenshotCount > 0 ? '#16a34a' : '#94a3b8',
                      border: '1px solid',
                      borderColor: screenshotCount > 0 ? '#bbf7d0' : '#e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                    title={`View ${screenshotCount} screenshots`}
                  >
                    <span>🖼️</span>
                    <span style={{ fontWeight: 700 }}>{screenshotCount}</span>
                    <span style={{ color: screenshotCount > 0 ? '#15803d' : '#94a3b8' }}>taken</span>
                    <span style={{ fontSize: '0.75rem', marginLeft: '2px' }}>→</span>
                  </Link>
                </td>
                <td style={styles.td}>
                  <Link
                    href={`/company-admin/reports/${user.id}?from=${fromStr}&to=${toStr}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.4rem 0.875rem',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    View Details →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No data for this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
