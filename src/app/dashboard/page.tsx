import React from 'react';
import { Card } from '@/components/ui/Card';
import styles from './dashboard.module.css';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { company: true }
  });

  if (!user) {
    redirect('/login');
  }

  const timeEntries = await prisma.timeEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: true
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEntries = await prisma.timeEntry.findMany({
    where: { 
      userId: user.id,
      startTime: { gte: today }
    }
  });

  let totalSecondsToday = 0;
  todayEntries.forEach(entry => {
    if (entry.duration !== null) {
      totalSecondsToday += entry.duration;
    } else {
      let ongoing = Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000);
      if (ongoing > 24 * 3600) ongoing = 0;
      totalSecondsToday += ongoing;
    }
  });
  const hours = Math.floor(totalSecondsToday / 3600);
  const minutes = Math.floor((totalSecondsToday % 3600) / 60);

  const activitiesToday = await prisma.activityLog.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: today }
    }
  });

  const avgActivity = activitiesToday.length > 0 
    ? Math.round(activitiesToday.reduce((acc, a) => acc + a.productivityScore, 0) / activitiesToday.length)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Welcome back{user.name ? `, ${user.name}` : ''}</h2>
          <p className={styles.subtitle}>Here is your activity overview for today.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statTitle}>Total Time Logged Today</div>
          <div className={styles.statValue}>{hours}h {minutes}m {totalSecondsToday % 60}s</div>
          <div className={styles.statChange}>
            <span className={styles.positive}>Real-time data</span> from tracker
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statTitle}>Average Activity Level (Today)</div>
          <div className={styles.statValue}>{avgActivity}%</div>
          <div className={styles.statChange}>
            <span className={styles.positive}>Based on activity logs</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statTitle}>Company</div>
          <div className={styles.statValue}>{user.company?.name || 'N/A'}</div>
          <div className={styles.statChange}>
            <span className={styles.neutral}>Your Workspace</span>
          </div>
        </Card>
      </div>

      <div className={styles.mainGrid}>
        <Card className={styles.listCard} padding="lg">
          <h3 className={styles.cardTitle}>Recent Time Logs</h3>
          <div className={styles.screenshotList}>
            {timeEntries.map((entry) => (
              <div key={entry.id} className={styles.screenshotItem}>
                <div className={styles.imagePlaceholder} style={{ background: 'var(--brand-light)', color: 'var(--brand-default)' }}>
                  LOG
                </div>
                <div className={styles.screenshotInfo}>
                  <div className={styles.screenshotUser}>{entry.user.name || entry.user.email}</div>
                  <div className={styles.screenshotTime}>
                    {entry.endTime 
                      ? `${Math.floor((entry.duration || 0) / 60)}m ${(entry.duration || 0) % 60}s logged` 
                      : 'Currently Tracking...'}
                  </div>
                </div>
              </div>
            ))}
            {timeEntries.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>No time entries found. Open the Desktop App and click Start Tracking!</p>
            )}
          </div>
        </Card>

        <Card className={styles.chartCard} padding="lg">
          <h3 className={styles.cardTitle}>Desktop App</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem 1rem', height: '100%', gap: '1rem' }}>
            <div style={{ fontSize: '3rem', color: 'var(--brand-default)', marginBottom: '0.5rem' }}>
              💻
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Track Time & Activity
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '250px', margin: 0 }}>
              Download our desktop application to start logging your time, activity, and screenshots automatically.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '260px', marginTop: '0.75rem' }}>
              <a href="/SigmaTracker.exe" download="SigmaTracker.exe" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: 'var(--brand-default)',
                color: 'white',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)',
                transition: 'background-color 0.2s ease'
              }}>
                🪟 Windows (.exe) • 8 MB
              </a>
              <a href="/SigmaTracker-mac.dmg" download="SigmaTracker-mac.dmg" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#1e293b',
                color: 'white',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease'
              }}>
                🍏 macOS (.dmg)
              </a>
              <a href="/SigmaTracker-linux.AppImage" download="SigmaTracker-linux.AppImage" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#0f172a',
                color: 'white',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease'
              }}>
                🐧 Linux (.AppImage)
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
