import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { clampDateRange, requireAdminCompany } from '@/lib/company-admin';

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

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

export default async function EmployeeReportPage({
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
  const company = await requireAdminCompany(`/company-admin/reports/${userId}`);

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

  const [timeEntries, activities, screenshots] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { userId: user.id, startTime: { gte: fromDate, lte: toDate } },
      select: { id: true, startTime: true, endTime: true, duration: true },
      orderBy: { startTime: 'desc' },
      take: 300,
    }),
    prisma.activityLog.findMany({
      where: { userId: user.id, createdAt: { gte: fromDate, lte: toDate } },
      select: { id: true, createdAt: true, productivityScore: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    prisma.screenshot.findMany({
      where: { userId: user.id, createdAt: { gte: fromDate, lte: toDate } },
      select: { id: true, imageUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
  ]);

  const totalSeconds = timeEntries.reduce((total, entry) => {
    if (entry.duration !== null) return total + entry.duration;
    const ongoing = Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000);
    return total + (ongoing > 24 * 3600 ? 0 : Math.max(0, ongoing));
  }, 0);

  const avgActivity = activities.length
    ? Math.round(activities.reduce((sum, activity) => sum + activity.productivityScore, 0) / activities.length)
    : 0;

  return (
    <div>
      <Link href={`/company-admin/reports?from=${fromStr}&to=${toStr}`} style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
        Back to Reports
      </Link>

      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{user.name || user.email}</h1>
        <p style={{ color: '#64748b', marginTop: '0.35rem' }}>
          Report from <strong>{fromStr}</strong> to <strong>{toStr}</strong>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          ['Time Logged', formatDuration(totalSeconds)],
          ['Average Activity', `${avgActivity}%`],
          ['Screenshots', String(screenshots.length)],
        ].map(([label, value]) => (
          <div key={label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 800 }}>Time Entries ({timeEntries.length})</div>
        <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
          <tbody>
            {timeEntries.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.8rem 1rem' }}>{new Date(entry.startTime).toLocaleString()}</td>
                <td style={{ padding: '0.8rem 1rem' }}>{entry.endTime ? new Date(entry.endTime).toLocaleString() : 'Active'}</td>
                <td style={{ padding: '0.8rem 1rem', fontWeight: 700 }}>{formatDuration(entry.duration || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Activity Logs ({activities.length})</div>
        {activities.slice(0, 50).map((activity) => (
          <div key={activity.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '0.65rem 0' }}>
            <span>{new Date(activity.createdAt).toLocaleString()}</span>
            <strong>{activity.productivityScore}%</strong>
          </div>
        ))}
        {activities.length === 0 && <p style={{ color: '#94a3b8' }}>No activity data in this range.</p>}
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
          <strong>Screenshots ({screenshots.length})</strong>
          <Link href={`/company-admin/reports/${user.id}/screenshots?from=${fromStr}&to=${toStr}`} style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
            Open Gallery
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {screenshots.slice(0, 12).map((screenshot) => (
            <img key={screenshot.id} src={screenshot.imageUrl} alt="Screenshot" style={{ width: '100%', height: '96px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          ))}
        </div>
        {screenshots.length === 0 && <p style={{ color: '#94a3b8' }}>No screenshots found in this range.</p>}
      </div>
    </div>
  );
}
