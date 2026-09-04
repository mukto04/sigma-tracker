import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h === 0 && m === 0) return `${s}s`;
  if (h === 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getLocalDateStr(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const colorPalette = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#6366f1', '#14b8a6', '#f97316', '#84cc16'
];

export default async function CompanyAdminAppsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const query = await searchParams;
  const range = query.range || 'today';

  const company = await prisma.company.findFirst({
    where: { name: { not: 'Superadmin HQ' } },
    include: { users: true },
  });

  if (!company) return null;

  // Compute date range
  const now = new Date();
  let fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  let toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (range === 'yesterday') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (range === '7days') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
  } else if (range === '30days') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
  }

  // Fetch all activity logs in range
  const logs = await prisma.activityLog.findMany({
    where: {
      user: { companyId: company.id },
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: { user: true },
  });

  // Aggregate apps
  interface AppStat {
    name: string;
    totalSeconds: number;
    userMap: Record<string, { user: typeof company.users[0]; seconds: number }>;
  }

  const appMap: Record<string, AppStat> = {};
  let totalCompanySeconds = 0;

  logs.forEach(log => {
    try {
      const apps = JSON.parse(log.activeApps || '[]');
      if (Array.isArray(apps)) {
        apps.forEach((a: { name: string; duration: number }) => {
          if (!a.name) return;
          const duration = a.duration || 0;
          totalCompanySeconds += duration;

          if (!appMap[a.name]) {
            appMap[a.name] = {
              name: a.name,
              totalSeconds: 0,
              userMap: {},
            };
          }

          appMap[a.name].totalSeconds += duration;

          if (log.user) {
            if (!appMap[a.name].userMap[log.user.id]) {
              appMap[a.name].userMap[log.user.id] = {
                user: log.user,
                seconds: 0,
              };
            }
            appMap[a.name].userMap[log.user.id].seconds += duration;
          }
        });
      }
    } catch (e) {}
  });

  const appList = Object.values(appMap)
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .map((app, idx) => ({
      ...app,
      color: colorPalette[idx % colorPalette.length],
      code: app.name.substring(0, 2).toUpperCase(),
      percentage: totalCompanySeconds > 0 ? ((app.totalSeconds / totalCompanySeconds) * 100).toFixed(1) : '0',
      users: Object.values(app.userMap).sort((a, b) => b.seconds - a.seconds),
    }));

  const topApp = appList[0] || null;

  return (
    <div>
      {/* Header with Preset Range Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Application & URL Usage</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            Real-time software usage analytics tracked across all team members
          </p>
        </div>

        {/* Date Range Tabs */}
        <div style={{ display: 'inline-flex', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.25rem', gap: '0.25rem' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
          ].map(tab => (
            <Link
              key={tab.id}
              href={`/company-admin/apps?range=${tab.id}`}
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

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Unique Apps Logged</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {appList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Active applications detected</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Most Used App</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topApp ? topApp.name : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {topApp ? `${formatDuration(topApp.totalSeconds)} (${topApp.percentage}%)` : 'No usage yet'}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Screen Time</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            {formatDuration(totalCompanySeconds)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Across all active sessions</div>
        </div>
      </div>

      {/* Applications Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            All Tracked Applications ({appList.length})
          </h2>
          <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Ranked by total duration
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '50px' }}>
                #
              </th>
              <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Application
              </th>
              <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', minWidth: '220px' }}>
                Share of Time
              </th>
              <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>
                Total Duration
              </th>
              <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Team Members
              </th>
            </tr>
          </thead>
          <tbody>
            {appList.map((app, index) => (
              <tr key={app.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {/* Rank */}
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#94a3b8' }}>
                  {index + 1}
                </td>

                {/* Application Name & Badge */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: app.color + '22',
                        color: app.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {app.code}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#0f172a' }}>
                      {app.name}
                    </span>
                  </div>
                </td>

                {/* Share Progress Bar */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${app.percentage}%`, height: '100%', backgroundColor: app.color, borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', minWidth: '42px', textAlign: 'right' }}>
                      {app.percentage}%
                    </span>
                  </div>
                </td>

                {/* Total Duration */}
                <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                  {formatDuration(app.totalSeconds)}
                </td>

                {/* Users Avatars */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {app.users.map(({ user, seconds }) => (
                      <span
                        key={user.id}
                        title={`${user.name || user.email}: ${formatDuration(seconds)}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.75rem',
                          color: '#334155',
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700 }}>
                          {(user.name || user.email).substring(0, 1).toUpperCase()}
                        </span>
                        <span>{user.name || user.email.split('@')[0]}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({formatDuration(seconds)})</span>
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}

            {appList.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No application usage data logged for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
