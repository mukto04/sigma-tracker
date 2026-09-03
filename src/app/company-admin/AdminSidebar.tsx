'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminSidebar({ companyName, adminName, logoUrl }: { companyName: string, adminName: string, logoUrl?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/company-admin', icon: '📊', label: 'Dashboard' },
    { href: '/company-admin/timesheets', icon: '⏱️', label: 'Timesheets' },
    { href: '/company-admin/screenshots', icon: '📸', label: 'Screenshots' },
    { href: '/company-admin/apps', icon: '💻', label: 'App Usage' },
    { href: '/company-admin/reports', icon: '📈', label: 'Reports' },
    { href: '/company-admin/employees', icon: '👥', label: 'Employees' },
    { href: '/company-admin/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <>
      <style>{`
        .admin-sidebar {
          width: 100%;
          background-color: #0f172a;
          color: white;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        @media (min-width: 768px) {
          .admin-sidebar {
            width: 260px;
            height: 100vh;
            position: sticky;
            top: 0;
          }
        }
        .admin-nav {
          display: none;
          padding: 1rem;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .admin-nav.open {
          display: flex;
        }
        @media (min-width: 768px) {
          .admin-nav {
            display: flex;
          }
        }
        .mobile-toggle {
          display: block;
          background: none;
          border: 1px solid #334155;
          color: white;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
        }
        @media (min-width: 768px) {
          .mobile-toggle {
            display: none;
          }
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: #cbd5e1;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .nav-link:hover {
          background-color: #1e293b;
          color: white;
        }
        .nav-link.active {
          background-color: #2563eb;
          color: white;
        }
      `}</style>
      <div className="admin-sidebar">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {logoUrl && (
              <img src={logoUrl} alt={companyName} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
            )}
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{companyName}</h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Workspace Admin</div>
            </div>
          </div>
          <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
        
        <nav className={`admin-nav ${isOpen ? 'open' : ''}`}>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1e293b', alignItems: 'center', gap: '0.75rem', display: isOpen ? 'flex' : 'none' }} className="admin-nav-profile">
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
            {adminName.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{adminName}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Administrator</div>
          </div>
        </div>
      </div>
      <style>{`
        @media (min-width: 768px) {
          .admin-nav-profile {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
