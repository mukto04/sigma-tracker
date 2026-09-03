import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import CompanyActionButtons from '../CompanyActionButtons';

const styles = {
  container: {
    backgroundColor: '#0a0f1c',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: '"Inter", sans-serif',
  },
  headerSection: {
    backgroundColor: '#111827',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    border: '1px solid #1f2937',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
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
  headerRight: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
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
  deployBtn: {
    backgroundColor: 'white',
    color: '#0f172a',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  headerBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #1f2937',
    paddingTop: '1.5rem',
  },
  tabsLeft: {
    display: 'flex',
    gap: '0.5rem',
  },
  tabBlue: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none'
  },
  tabDark: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    border: '1px solid transparent',
    textDecoration: 'none'
  },
  tabBadgeWhite: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.7rem'
  },
  tabBadgeDark: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.7rem'
  },
  tabsCenter: {
    display: 'flex',
    gap: '1rem',
    backgroundColor: '#0a0f1c',
    padding: '0.25rem',
    borderRadius: '99px',
    border: '1px solid #1f2937'
  },
  pillTabActive: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: '0.4rem 1.25rem',
    borderRadius: '99px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  pillTabInactive: {
    color: '#64748b',
    padding: '0.4rem 1.25rem',
    borderRadius: '99px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  healthIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  healthIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: '1.25rem 1rem',
    color: '#94a3b8',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    borderBottom: '1px solid #1f2937',
    fontWeight: 700,
  },
  td: {
    padding: '1.5rem 1rem',
    borderBottom: '1px solid #1f2937',
    verticalAlign: 'middle',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#cbd5e1',
    fontSize: '0.875rem',
    flexShrink: 0
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    display: 'inline-block',
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    color: '#10b981',
    padding: '0.25rem 0.75rem',
    borderRadius: '99px',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid rgba(16, 185, 129, 0.1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  tierPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
    color: '#c084fc',
    padding: '0.35rem 1rem',
    borderRadius: '99px',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid rgba(168, 85, 247, 0.1)',
  },
  tierPillStartup: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    color: '#94a3b8',
    padding: '0.35rem 1rem',
    borderRadius: '99px',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid rgba(59, 130, 246, 0.1)',
  },
  actionBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #1f2937',
    color: '#64748b',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '0.5rem',
  }
};

export default async function ServiceControllerPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams?.tab || 'live';

  const allCompanies = await prisma.company.findMany({
    where: {
      name: {
        not: 'Superadmin HQ'
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const activeCount = allCompanies.filter(c => c.subscriptionStatus === 'Active').length;
  const deletedCount = allCompanies.filter(c => c.subscriptionStatus === 'Deleted').length;
  
  let visibleCompanies = allCompanies.filter(c => c.subscriptionStatus !== 'Deleted');
  if (currentTab === 'trash') {
    visibleCompanies = allCompanies.filter(c => c.subscriptionStatus === 'Deleted');
  }

  return (
    <div style={styles.container}>
      
      {/* HEADER CARD */}
      <div style={styles.headerSection}>
        <div style={styles.headerTop}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBox}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Service Controller</h1>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '9999px' }}>⚡ {activeCount} Active Nodes</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '9999px' }}>🗄️ Multi-Tenant Grid</span>
              </div>
            </div>
          </div>
          
          <div style={styles.headerRight}>
            <input type="text" placeholder="🔍 Filter instances by name or slug..." style={styles.searchBox} />
            <Link href="/superadmin">
              <button style={styles.deployBtn}>+ Deploy Instance</button>
            </Link>
          </div>
        </div>

        <div style={styles.headerBottom}>
          <div style={styles.tabsLeft}>
            <Link href="/superadmin/tenants?tab=live" style={currentTab === 'live' ? styles.tabBlue : styles.tabDark}>Live Protocol <span style={currentTab === 'live' ? styles.tabBadgeWhite : styles.tabBadgeDark}>{activeCount}</span></Link>
            <Link href="/superadmin/tenants?tab=trash" style={currentTab === 'trash' ? styles.tabBlue : styles.tabDark}>Trash Bin <span style={currentTab === 'trash' ? styles.tabBadgeWhite : styles.tabBadgeDark}>{deletedCount}</span></Link>
          </div>

          <div style={styles.tabsCenter}>
            <div style={styles.pillTabActive}>All Live <span style={{color: '#94a3b8', marginLeft: '4px'}}>{activeCount}</span></div>
            <div style={styles.pillTabInactive}>Active <span style={{marginLeft: '4px'}}>{activeCount}</span></div>
            <div style={styles.pillTabInactive}>Frozen <span style={{marginLeft: '4px'}}>0</span></div>
          </div>

          <div style={styles.healthIndicator}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>System Health</div>
              <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 700 }}>All Nodes Operational</div>
            </div>
            <div style={styles.healthIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Instance Identity</th>
              <th style={styles.th}>Status Protocol</th>
              <th style={styles.th}>Plan Tier</th>
              <th style={styles.th}>Service Validity</th>
              <th style={styles.th}>Operational Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleCompanies.map((company, index) => {
              const slug = '/' + company.name.toLowerCase().replace(/\s+/g, '') + '-hr';
              const isEnterprise = company.paidSeats > 10 || company.name.includes('Themes') || company.name.includes('Devs');
              
              let remainingDays = 30;
              if (company.endDate) {
                const diffTime = new Date(company.endDate).getTime() - Date.now();
                remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (remainingDays < 0) remainingDays = 0;
              } else if (company.subscriptionStatus === 'Expired') {
                remainingDays = 0;
              }

              const endDateStr = company.endDate ? new Date(company.endDate).toLocaleDateString() : '6/16/2027';
              
              let statusLabel = 'Operational';
              let statusColor = '#10b981';
              let bg = 'rgba(16, 185, 129, 0.05)';
              let border = 'rgba(16, 185, 129, 0.1)';
              
              if (company.subscriptionStatus === 'Deleted') {
                statusLabel = 'Deleted';
                statusColor = '#ef4444';
                bg = 'rgba(239, 68, 68, 0.05)';
                border = 'rgba(239, 68, 68, 0.1)';
              } else if (company.subscriptionStatus === 'Expired' || remainingDays === 0) {
                statusLabel = 'Frozen';
                statusColor = '#ef4444';
                bg = 'rgba(239, 68, 68, 0.05)';
                border = 'rgba(239, 68, 68, 0.1)';
              } else if (company.subscriptionStatus === 'Terminated') {
                statusLabel = 'Terminated';
                statusColor = '#ef4444';
                bg = 'rgba(239, 68, 68, 0.05)';
                border = 'rgba(239, 68, 68, 0.1)';
              }

              return (
                <tr key={company.id}>
                  <td style={{...styles.td, color: '#94a3b8', fontWeight: 600}}>
                    {(index + 1).toString().padStart(2, '0')}
                  </td>
                  
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={styles.avatar}>
                        {company.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'white', marginBottom: '2px', fontSize: '0.875rem' }}>
                          {company.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{color: '#94a3b8'}}>ID:</span> {company.id.split('-')[0]}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div style={{ color: '#e2e8f0', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {slug}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '2px', cursor: 'pointer' }}>
                      Open Gateway ↗
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span style={isEnterprise ? styles.tierPill : styles.tierPillStartup}>
                      {isEnterprise ? 'Enterprise Cluster' : 'Startup Node'}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <div style={{...styles.statusPill, color: statusColor, backgroundColor: bg, borderColor: border}}>
                      <span style={{...styles.statusDot, backgroundColor: statusColor}}></span> {statusLabel}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Remaining</div>
                        <div style={{ color: statusColor === '#ef4444' ? '#ef4444' : 'white', fontWeight: 700, fontSize: '0.875rem' }}>{remainingDays} Days</div>
                      </div>
                      <div style={{ width: '1px', height: '24px', backgroundColor: '#1f2937' }}></div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Until</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{endDateStr}</div>
                      </div>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <CompanyActionButtons company={company} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
