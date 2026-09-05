import { getSession } from '@/lib/auth';
import React from 'react';
import styles from './layout.module.css';
import { Button } from '@/components/ui/Button';

export const runtime = 'edge';

import { prisma } from '@/lib/prisma';
import { DashboardNav } from './DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  let companyName = "SigmaTrack";
  let logoUrl = null;
  
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    });
    if (user?.company) {
      companyName = user.company.name;
      logoUrl = user.company.logoUrl;
    }
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.brand} style={{ padding: logoUrl ? '1rem' : undefined, display: 'flex', alignItems: 'center' }}>
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} style={{ maxHeight: '40px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
          ) : (
            <>
              <div className={styles.brandIcon}></div>
              <span className={styles.brandName}>{companyName}</span>
            </>
          )}
        </div>
        <DashboardNav />
      </aside>
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>Overview</h1>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
