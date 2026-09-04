'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0a0f1c', // Main dark background
    fontFamily: '"Inter", sans-serif',
    color: '#e2e8f0',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#0f172a', // Slightly lighter dark for sidebar
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '1.5rem',
    flexShrink: 0,
    position: 'sticky' as const,
    top: 0,
    height: '100vh',
    overflowY: 'auto' as const,
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    backgroundColor: '#0a0f1c',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '3rem',
  },
  brandIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#3b82f6',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '0.5rem',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  navItemActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  navItemInactive: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
  },
  navTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    marginBottom: '0.2rem',
  },
  navSubtitle: {
    fontSize: '0.7rem',
    opacity: 0.7,
  },
  logout: {
    marginTop: 'auto',
    paddingTop: '2rem',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#3b82f6',
    fontWeight: 600,
    fontSize: '0.875rem',
    textDecoration: 'none',
    cursor: 'pointer',
  }
};

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    {
      href: '/superadmin/purchases',
      title: 'New Purchases',
      subtitle: 'View recent orders',
      isActive: pathname === '/superadmin/purchases'
    },
    {
      href: '/superadmin',
      title: 'Manage Subscriptions',
      subtitle: 'View active & cancelled',
      isActive: pathname === '/superadmin'
    },
    {
      href: '/superadmin/tenants',
      title: 'Service Controller',
      subtitle: 'Manage Instances & DBs',
      isActive: pathname.startsWith('/superadmin/tenants')
    },
    {
      href: '/superadmin/settings',
      title: 'System Settings',
      subtitle: 'Change admin password',
      isActive: pathname.startsWith('/superadmin/settings')
    }
  ];

  return (
    <div style={styles.layout}>
      
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        
        {/* Brand/Profile */}
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>Master</div>
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>Root Access</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              style={{
                ...styles.navItem,
                ...(link.isActive ? styles.navItemActive : styles.navItemInactive)
              }}
            >
              <span style={styles.navTitle}>{link.title}</span>
              <span style={styles.navSubtitle}>{link.subtitle}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <button 
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          style={{ ...styles.logout, background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Secure Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.content}>
        {children}
      </main>

    </div>
  );
}
