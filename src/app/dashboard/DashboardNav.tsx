'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

export function DashboardNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <Link href="/dashboard" prefetch={false} className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}>
        Dashboard
      </Link>
      <Link href="/dashboard/timesheets" prefetch={false} className={`${styles.navItem} ${pathname === '/dashboard/timesheets' ? styles.active : ''}`}>
        Timesheets
      </Link>
      <Link href="/dashboard/screenshots" prefetch={false} className={`${styles.navItem} ${pathname === '/dashboard/screenshots' ? styles.active : ''}`}>
        Screenshots
      </Link>
      <Link href="/dashboard/reports" prefetch={false} className={`${styles.navItem} ${pathname === '/dashboard/reports' ? styles.active : ''}`}>
        Reports
      </Link>
      <Link href="/dashboard/settings" prefetch={false} className={`${styles.navItem} ${pathname === '/dashboard/settings' ? styles.active : ''}`}>
        Settings
      </Link>
      <div className={styles.userSection}>
        <div className={styles.avatar}>{(name || email || 'EM').substring(0, 2).toUpperCase()}</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{name}</div>
          <div className={styles.userRole} title={email}>{email}</div>
        </div>
      </div>
      <button 
        onClick={async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/login';
        }}
        className={styles.navItem} 
        style={{ color: '#ef4444', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
      >
        Log out
      </button>
    </nav>
  );
}
