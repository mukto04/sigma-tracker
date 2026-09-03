import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

function renderActiveApps(activeAppsStr: string) {
  try {
    const apps = JSON.parse(activeAppsStr || '[]');
    if (!Array.isArray(apps) || apps.length === 0) {
      return <span style={{ color: '#94a3b8' }}>—</span>;
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {apps.map((app: any, idx: number) => (
          <span
            key={idx}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f8fafc',
              color: '#1e293b',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid #e2e8f0',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }}></span>
            <span>{app.name || 'App'}</span>
            {app.duration ? <span style={{ color: '#64748b', fontWeight: 400 }}>({app.duration}s)</span> : null}
          </span>
        ))}
      </div>
    );
  } catch (e) {
    return <span style={{ color: '#94a3b8' }}>{activeAppsStr || '—'}</span>;
  }
}

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

export default async function EmployeeReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string; to?: string; tab?: string }>;
}) {
  const { userId } = await params;
  const query = await searchParams;

  const todayStr = getLocalDateStr(new Date());
  const fromStr = query.from || todayStr;
  const toStr = query.to || todayStr;
  const activeTab = query.tab || 'time-entries';

  const [fy, fm, fd] = fromStr.split('-').map(Number);
  const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);

  const [ty, tm, td] = toStr.split('-').map(Number);
  const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      timeEntries: {
        where: { startTime: { gte: fromDate, lte: toDate } },
        orderBy: { startTime: 'desc' },
      },
      activities: {
        where: { createdAt: { gte: fromDate, lte: toDate } },
        orderBy: { createdAt: 'desc' },
      },
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

  let totalSeconds = 0;
  user.timeEntries.forEach(e => {
    if (e.duration !== null) {
      totalSeconds += e.duration;
    } else {
      let ongoing = Math.floor((Date.now() - new Date(e.startTime).getTime()) / 1000);
      if (ongoing > 24 * 3600) ongoing = 0;
      totalSeconds += ongoing;
    }
  });
  const avgActivity = user.activities.length > 0
    ? Math.round(user.activities.reduce((acc, a) => acc + a.productivityScore, 0) / user.activities.length)
    : 0;

  const statCard = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)',
  };

  const sectionCard = {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  };

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/company-admin/reports?from=${fromStr}&to=${toStr}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#2563eb', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', marginBottom: '1.5rem' }}
      >
        ← Back to Reports
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: '#eff6ff', color: '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '1.25rem',
        }}>
          {(user.name || user.email).substring(0,2).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{user.name || user.email}</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Report: <strong>{fromStr}</strong> → <strong>{toStr}</strong>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={statCard}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Time Logged</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{formatDuration(totalSeconds)}</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Average Activity</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: avgActivity >= 70 ? '#16a34a' : avgActivity >= 40 ? '#d97706' : '#dc2626' }}>
            {avgActivity}%
          </div>
        </div>
        <div style={statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Screenshots</span>
            <Link
              href={`/company-admin/reports/${user.id}/screenshots?from=${fromStr}&to=${toStr}`}
              style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
            >
              View Gallery →
            </Link>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{user.screenshots.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <Link
          href={`/company-admin/reports/${user.id}?from=${fromStr}&to=${toStr}&tab=time-entries`}
          style={{
            padding: '0.75rem 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'time-entries' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'time-entries' ? '2px solid #2563eb' : '2px solid transparent',
            textDecoration: 'none',
          }}
        >
          ⏱️ Time Entries
        </Link>
        <Link
          href={`/company-admin/reports/${user.id}?from=${fromStr}&to=${toStr}&tab=activities`}
          style={{
            padding: '0.75rem 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'activities' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'activities' ? '2px solid #2563eb' : '2px solid transparent',
            textDecoration: 'none',
          }}
        >
          📊 Activity Logs
        </Link>
        <Link
          href={`/company-admin/reports/${user.id}?from=${fromStr}&to=${toStr}&tab=screenshots`}
          style={{
            padding: '0.75rem 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'screenshots' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'screenshots' ? '2px solid #2563eb' : '2px solid transparent',
            textDecoration: 'none',
          }}
        >
          🖼️ Screenshots
        </Link>
      </div>

      {/* Time Entries */}
      {activeTab === 'time-entries' && (
      <div style={sectionCard}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>⏱️ Time Entries ({user.timeEntries.length})</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Start</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>End</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {user.timeEntries.map(e => (
              <tr key={e.id}>
                <td style={{ padding: '0.875rem 1.5rem', fontSize: '0.875rem', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>
                  {new Date(e.startTime).toLocaleString()}
                </td>
                <td style={{ padding: '0.875rem 1.5rem', fontSize: '0.875rem', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                  {e.endTime ? new Date(e.endTime).toLocaleString() : <span style={{ color: '#16a34a', fontWeight: 600 }}>Active</span>}
                </td>
                <td style={{ padding: '0.875rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>
                  {formatDuration(e.duration || 0)}
                </td>
              </tr>
            ))}
            {user.timeEntries.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No time entries in this range.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
      )}

      {/* Activity Logs */}
      {activeTab === 'activities' && (
      <div style={sectionCard}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>📊 Activity Logs ({user.activities.length})</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Timestamp</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Productivity</th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Active Apps</th>
            </tr>
          </thead>
          <tbody>
            {user.activities.map(a => (
              <tr key={a.id}>
                <td style={{ padding: '0.875rem 1.5rem', fontSize: '0.875rem', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                  {new Date(a.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '0.875rem 1.5rem', fontSize: '0.875rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: a.productivityScore >= 70 ? '#dcfce7' : a.productivityScore >= 40 ? '#fef3c7' : '#f1f5f9',
                    color: a.productivityScore >= 70 ? '#15803d' : a.productivityScore >= 40 ? '#b45309' : '#64748b',
                  }}>
                    {a.productivityScore}%
                  </span>
                </td>
                <td style={{ padding: '0.875rem 1.5rem', fontSize: '0.875rem', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                  {renderActiveApps(a.activeApps)}
                </td>
              </tr>
            ))}
            {user.activities.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No activity data in this range.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
      )}

      {/* Screenshots */}
      {activeTab === 'screenshots' && (
        user.screenshots.length > 0 ? (
        <div style={sectionCard}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>🖼️ Screenshots ({user.screenshots.length})</h2>
            <Link
              href={`/company-admin/reports/${user.id}/screenshots?from=${fromStr}&to=${toStr}`}
              style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
            >
              Open Full Gallery & Lightbox →
            </Link>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {user.screenshots.map(s => (
              <div key={s.id} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={s.imageUrl} alt="Screenshot" style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', fontSize: '0.65rem', color: '#64748b' }}>
                  {new Date(s.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
        ) : (
          <div style={{ ...sectionCard, padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No screenshots found in this range.
          </div>
        )
      )}
    </div>
  );
}
