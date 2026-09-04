import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import CreateCompanyForm from './CreateCompanyForm';
import CompanyActionButtons from './CompanyActionButtons';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const styles = {
  container: {
    backgroundColor: '#0a0f1c',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: '"Inter", sans-serif',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  iconBox: {
    backgroundColor: '#3b82f6',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
  },
  searchBox: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    width: '280px',
    outline: 'none',
    fontSize: '0.875rem',
  },
  tabsContainer: {
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: '#1e293b',
    padding: '0.5rem',
    borderRadius: '12px',
    width: 'fit-content',
    marginBottom: '2rem',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none'
  },
  tabInactive: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    textDecoration: 'none'
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '2px 6px',
    borderRadius: '12px',
    fontSize: '0.65rem'
  },
  tableCard: {
    backgroundColor: '#111827',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid #1f2937',
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '1rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94a3b8',
    borderBottom: '1px solid #1f2937',
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: '1.25rem 1rem',
    borderBottom: '1px solid #1f2937',
    verticalAlign: 'middle' as const,
  },
  subscriberCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 700,
    fontSize: '0.875rem'
  },
  pillEnterprise: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    color: '#c084fc',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'inline-block',
    marginBottom: '4px',
  },
  pillActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  pillExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  actionBtn: {
    backgroundColor: '#1e293b',
    border: 'none',
    color: '#94a3b8',
    padding: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '0.5rem',
  }
};

export default async function SuperadminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams?.tab || 'all';

  const allCompanies = await prisma.company.findMany({
    where: {
      name: {
        not: 'Superadmin HQ'
      }
    },
    include: {
      users: { where: { role: 'ADMIN' } },
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate stats
  const activeCount = allCompanies.filter(c => c.subscriptionStatus === 'Active').length;
  const terminatedCount = allCompanies.filter(c => c.subscriptionStatus === 'Terminated' || c.subscriptionStatus === 'Expired').length;
  const deletedCount = allCompanies.filter(c => c.subscriptionStatus === 'Deleted').length;
  const total = activeCount + terminatedCount;

  // Filter based on tab
  let visibleCompanies = allCompanies.filter(c => c.subscriptionStatus !== 'Deleted');
  if (currentTab === 'active') {
    visibleCompanies = allCompanies.filter(c => c.subscriptionStatus === 'Active');
  } else if (currentTab === 'terminated') {
    visibleCompanies = allCompanies.filter(c => c.subscriptionStatus === 'Terminated' || c.subscriptionStatus === 'Expired');
  } else if (currentTab === 'trash') {
    visibleCompanies = allCompanies.filter(c => c.subscriptionStatus === 'Deleted');
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.headerLeft}>
          <div style={styles.iconBox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
          </div>
          <div>
            <h1 style={styles.title}>Manage Subscriptions</h1>
            <p style={styles.subtitle}>View Active & Cancelled Subscribers</p>
          </div>
        </div>
        <div>
          <input type="text" placeholder="🔍 Search subscriptions..." style={styles.searchBox} />
        </div>
      </div>

      {/* TABS */}
      <div style={styles.tabsContainer}>
        <Link href="/superadmin?tab=all" style={currentTab === 'all' ? styles.tabActive : styles.tabInactive}>ALL <span style={styles.badge}>{total}</span></Link>
        <Link href="/superadmin?tab=active" style={currentTab === 'active' ? styles.tabActive : styles.tabInactive}>ACTIVE <span style={styles.badge}>{activeCount}</span></Link>
        <Link href="/superadmin?tab=terminated" style={currentTab === 'terminated' ? styles.tabActive : styles.tabInactive}>TERMINATED <span style={styles.badge}>{terminatedCount}</span></Link>
        <Link href="/superadmin?tab=trash" style={currentTab === 'trash' ? styles.tabActive : styles.tabInactive}>TRASH BIN <span style={styles.badge}>{deletedCount}</span></Link>
      </div>

      {/* For MVP manually onboarding, we still include the form but styled dark */}
      <div style={{ marginBottom: '2rem' }}>
        <CreateCompanyForm />
      </div>

      {/* TABLE */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Subscriber</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Plan</th>
              <th style={styles.th}>Purchase Date</th>
              <th style={styles.th}>Renewal Date</th>
              <th style={styles.th}>End Date</th>
              <th style={styles.th}>Remaining</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleCompanies.map((company, index) => {
              const adminUser = company.users[0];
              const isExpired = company.subscriptionStatus === 'Expired' || (company.endDate && new Date(company.endDate).getTime() < Date.now());
              
              const pDate = company.purchaseDate ? new Date(company.purchaseDate).toLocaleDateString() : 'Jun 10, 2026';
              const rDate = company.renewalDate ? new Date(company.renewalDate).toLocaleDateString() : 'Jun 16, 2026';
              const eDate = company.endDate ? new Date(company.endDate).toLocaleDateString() : 'Jul 1, 2026';
              
              let remainingDays = 30;
              if (company.endDate) {
                const diffTime = new Date(company.endDate).getTime() - Date.now();
                remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (remainingDays < 0) remainingDays = 0;
              }

              let statusLabel = '✓ Active';
              let statusStyle = styles.pillActive;
              if (company.subscriptionStatus === 'Deleted') {
                statusLabel = '🗑️ Deleted';
                statusStyle = styles.pillExpired;
              } else if (isExpired) {
                statusLabel = 'ⓧ Expired';
                statusStyle = styles.pillExpired;
              } else if (company.subscriptionStatus === 'Terminated') {
                statusLabel = 'ⓧ Terminated';
                statusStyle = styles.pillExpired;
              }

              return (
                <tr key={company.id}>
                  <td style={styles.td}>{(index + 1).toString().padStart(2, '0')}</td>
                  
                  <td style={styles.td}>
                    <div style={styles.subscriberCell}>
                      <div style={styles.avatar}>
                        {company.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white', marginBottom: '2px' }}>{company.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🏢 / {company.name.toLowerCase().replace(/\s/g, '')}-hr</div>
                      </div>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
                      ✉️ {adminUser?.email || 'N/A'}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span style={styles.pillEnterprise}>Enterprise</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{company.paidSeats} Seats - Monthly</div>
                  </td>

                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: 'white' }}>{pDate}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📅 Purchase</div>
                  </td>

                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: 'white' }}>{rDate}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🔄 Renewed</div>
                  </td>

                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: isExpired ? '#ef4444' : '#f87171' }}>{eDate}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>⏱️ Expires</div>
                  </td>

                  <td style={styles.td}>
                    <div style={{ fontWeight: 700, fontSize: '1.25rem', color: isExpired ? '#ef4444' : 'white' }}>
                      {remainingDays}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isExpired ? '#ef4444' : '#64748b' }}>
                      {isExpired ? 'Expired' : 'Days'}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span style={statusStyle}>
                      {statusLabel}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <CompanyActionButtons company={company} />
                  </td>
                </tr>
              )
            })}
            
            {visibleCompanies.length === 0 && (
              <tr>
                <td colSpan={10} style={{ ...styles.td, textAlign: 'center', padding: '3rem' }}>
                  No subscriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
