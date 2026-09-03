'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}>
        Dashboard
      </Link>
      <Link href="/dashboard/timesheets" className={`${styles.navItem} ${pathname === '/dashboard/timesheets' ? styles.active : ''}`}>
        Timesheets
      </Link>
      <Link href="/dashboard/screenshots" className={`${styles.navItem} ${pathname === '/dashboard/screenshots' ? styles.active : ''}`}>
        Screenshots
      </Link>
      <Link href="/dashboard/reports" className={`${styles.navItem} ${pathname === '/dashboard/reports' ? styles.active : ''}`}>
        Reports
      </Link>
      <Link href="/dashboard/settings" className={`${styles.navItem} ${pathname === '/dashboard/settings' ? styles.active : ''}`}>
        Settings
      </Link>
      <Link href="/api/auth/signout" className={styles.navItem} style={{ color: '#ef4444', marginTop: 'auto', fontWeight: 'bold' }}>
        Log out
      </Link>
    </nav>
  );
}
