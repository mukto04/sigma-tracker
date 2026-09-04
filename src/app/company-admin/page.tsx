import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function formatDuration(seconds: number) {
  if (seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatClockTime(date: Date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default async function CompanyAdminDashboard() {
  const company = await prisma.company.findFirst({
    where: { name: { not: 'Superadmin HQ' } },
    include: {
      users: true,
      projects: true
    }
  });

  if (!company) return null;

  const employees = company.users.filter(u => u.role !== 'SUPERADMIN');

  // Calculate Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeEntriesToday = await prisma.timeEntry.findMany({
    where: {
      user: { companyId: company.id },
      createdAt: { gte: today }
    },
    include: { user: true, project: true },
    orderBy: { createdAt: 'desc' }
  });
  
  let totalSecondsToday = 0;
  timeEntriesToday.forEach(entry => {
    if (entry.duration !== null) {
      totalSecondsToday += entry.duration;
    } else {
      let ongoing = Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000);
      if (ongoing > 24 * 3600) ongoing = 0;
      totalSecondsToday += ongoing;
    }
  });
  
  const activitiesToday = await prisma.activityLog.findMany({
    where: {
      user: { companyId: company.id },
      createdAt: { gte: today }
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const screenshotsToday = await prisma.screenshot.findMany({
    where: {
      user: { companyId: company.id },
      createdAt: { gte: today }
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 4
  });

  const avgActivity = activitiesToday.length > 0 
    ? Math.round(activitiesToday.reduce((acc, a) => acc + a.productivityScore, 0) / activitiesToday.length)
    : 0;

  // Aggregate Company-wide Top Active Apps
  const globalAppTimes: Record<string, number> = {};
  activitiesToday.forEach(log => {
    try {
      const apps = JSON.parse(log.activeApps || '[]');
      apps.forEach((a: { name: string; duration: number }) => {
        if (a.name) {
          globalAppTimes[a.name] = (globalAppTimes[a.name] || 0) + (a.duration || 0);
        }
      });
    } catch (e) {}
  });

  const totalAppSeconds = Object.values(globalAppTimes).reduce((a, b) => a + b, 0);
  const colorPalette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const topApps = Object.keys(globalAppTimes)
    .map((name, idx) => ({
      name,
      code: name.substring(0, 2).toUpperCase(),
      color: colorPalette[idx % colorPalette.length],
      seconds: globalAppTimes[name],
      percent: totalAppSeconds > 0 ? Math.round((globalAppTimes[name] / totalAppSeconds) * 100) : 0
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 5);

  // Calculate per-employee stats for today
  const employeeStats = employees.map(emp => {
    const empEntries = timeEntriesToday.filter(e => e.userId === emp.id);
    let empSeconds = 0;
    empEntries.forEach(e => {
      if (e.duration !== null) {
        empSeconds += e.duration;
      } else {
        let ongoing = Math.floor((Date.now() - new Date(e.startTime).getTime()) / 1000);
        if (ongoing > 24 * 3600) ongoing = 0;
        empSeconds += ongoing;
      }
    });
    const empLatestActivity = activitiesToday.find(a => a.userId === emp.id);
    
    // Check if active in the last 10 minutes
    const isRecentlyActive = empLatestActivity && 
      (new Date().getTime() - new Date(empLatestActivity.createdAt).getTime()) < 10 * 60 * 1000;

    return {
      user: emp,
      secondsToday: empSeconds,
      isRecentlyActive,
      latestActivity: empLatestActivity
    };
  });

  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.25rem',
      marginBottom: '1.75rem'
    },
    statCard: {
      backgroundColor: 'white',
      padding: '1.25rem 1.5rem',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between'
    },
    statTitle: {
      fontSize: '0.75rem',
      color: '#64748b',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginBottom: '0.5rem'
    },
    statValue: {
      fontSize: '1.875rem',
      fontWeight: 800,
      color: '#0f172a',
      lineHeight: 1.2
    },
    statSubtitle: {
      fontSize: '0.75rem',
      color: '#94a3b8',
      marginTop: '0.35rem'
    },
    card: {
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
      marginBottom: '1.5rem'
    },
    cardTitle: {
      fontSize: '1rem',
      fontWeight: 700,
      color: '#0f172a',
      marginBottom: '1.25rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    badge: (bg: string, fg: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.2rem 0.6rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: bg,
      color: fg
    })
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Company Dashboard</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            Real-time overview for {company.name}
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={styles.grid}>
        <div style={styles.statCard}>
          <div>
            <div style={styles.statTitle}>Total Employees</div>
            <div style={styles.statValue}>{employees.length}</div>
          </div>
          <div style={styles.statSubtitle}>{company.paidSeats} seats purchased</div>
        </div>

        <div style={styles.statCard}>
          <div>
            <div style={styles.statTitle}>Active Projects</div>
            <div style={styles.statValue}>{company.projects.length}</div>
          </div>
          <div style={styles.statSubtitle}>Workspace projects</div>
        </div>

        <div style={styles.statCard}>
          <div>
            <div style={styles.statTitle}>Time Logged Today</div>
            <div style={styles.statValue}>{formatDuration(totalSecondsToday)}</div>
          </div>
          <div style={styles.statSubtitle}>Across all team members</div>
        </div>

        <div style={styles.statCard}>
          <div>
            <div style={styles.statTitle}>Average Activity</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <div style={styles.statValue}>{avgActivity}%</div>
              <span style={styles.badge(avgActivity >= 50 ? '#dcfce7' : '#fef3c7', avgActivity >= 50 ? '#166534' : '#92400e')}>
                {avgActivity >= 50 ? 'Healthy' : 'Low'}
              </span>
            </div>
          </div>
          <div style={styles.statSubtitle}>Based on keyboard & mouse logs</div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="dashboard-columns">
        <style>{`
          .dashboard-columns {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
            align-items: start;
          }
          @media (min-width: 1024px) {
            .dashboard-columns {
              grid-template-columns: 1fr 380px;
            }
          }
          .table-responsive {
            width: 100%;
            overflow-x: auto;
          }
        `}</style>
        
        {/* Left Column */}
        <div style={{ minWidth: 0 }}>
          {/* Recent Time Entries */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>Recent Time Entries (Today)</span>
              <Link href="/company-admin/reports" style={{ fontSize: '0.8125rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                View All Reports →
              </Link>
            </div>
            
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.6rem 0', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Employee</th>
                  <th style={{ textAlign: 'left', padding: '0.6rem 0', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Time Span</th>
                  <th style={{ textAlign: 'right', padding: '0.6rem 0', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {timeEntriesToday.slice(0, 6).map(entry => (
                  <tr key={entry.id}>
                    <td style={{ padding: '0.85rem 0', color: '#0f172a', fontSize: '0.875rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                          {(entry.user.name || entry.user.email).substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{entry.user.name || entry.user.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0', color: '#64748b', fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9' }}>
                      {formatClockTime(entry.startTime)} {entry.endTime ? `- ${formatClockTime(entry.endTime)}` : '(Tracking)'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.85rem 0', color: '#0f172a', fontSize: '0.875rem', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
                      {entry.endTime ? formatDuration(entry.duration || 0) : <span style={styles.badge('#dbeafe', '#1e40af')}>Active</span>}
                    </td>
                  </tr>
                ))}
                {timeEntriesToday.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                      No time entries logged today yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Top Applications */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>Top Active Applications Today</span>
            </div>

            {topApps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                No application usage logged today yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topApps.map(app => (
                  <div key={app.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, color: '#0f172a' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: app.color + '22', color: app.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {app.code}
                        </span>
                        {app.name}
                      </div>
                      <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.8125rem' }}>
                        {formatDuration(app.seconds)} ({app.percent}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${app.percent}%`, height: '100%', backgroundColor: app.color, borderRadius: '999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Employee Status Roster */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>Team Members ({employees.length})</span>
              <Link href="/company-admin/employees" style={{ fontSize: '0.8125rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                Manage →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {employeeStats.map(({ user, secondsToday, isRecentlyActive }) => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                        {(user.name || user.email).substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: isRecentlyActive ? '#22c55e' : '#94a3b8',
                        border: '2px solid white'
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                        {user.name || 'Unnamed'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                      {formatDuration(secondsToday)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isRecentlyActive ? '#16a34a' : '#94a3b8', fontWeight: 500 }}>
                      {isRecentlyActive ? 'Active now' : 'Offline'}
                    </div>
                  </div>
                </div>
              ))}

              {employees.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  No employees added yet.
                </div>
              )}
            </div>
          </div>

          {/* Recent Screenshots Feed */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>Recent Screenshots</span>
            </div>

            {screenshotsToday.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                No screenshots captured today yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {screenshotsToday.map(s => (
                  <div key={s.id} style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                    <img src={s.imageUrl} alt="Screenshot" style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '0.4rem 0.5rem', fontSize: '0.7rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{s.user.name || s.user.email}</span>
                      <span>{formatClockTime(s.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
