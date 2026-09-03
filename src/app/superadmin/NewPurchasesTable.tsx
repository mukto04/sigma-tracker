import React from 'react';
import { prisma } from '@/lib/prisma';

const styles = {
  card: {
    backgroundColor: '#0a0f1c', // Same deep dark background
    border: '1px solid #1f2937',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '3rem', // Spacing before the next section
  },
  header: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    borderBottom: '1px solid #1f2937',
  },
  iconBox: {
    backgroundColor: '#3b82f6', // Blue background for the card icon
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  awaitingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    width: 'fit-content'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '1.25rem 1.5rem',
    color: '#94a3b8',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    borderBottom: '1px solid #1f2937',
    fontWeight: 700,
  },
  td: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #1f2937',
    fontSize: '0.875rem',
    color: '#e2e8f0',
    verticalAlign: 'middle',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  pillStartup: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#94a3b8',
    padding: '0.35rem 0.75rem',
    borderRadius: '99px',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid rgba(59, 130, 246, 0.2)',
    display: 'inline-block',
    marginBottom: '0.25rem',
  }
};

export default async function NewPurchasesTable() {
  // Fetch companies created in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newCompanies = await prisma.company.findMany({
    where: {
      createdAt: {
        gte: sevenDaysAgo
      },
      name: {
        not: 'Superadmin HQ'
      }
    },
    include: {
      users: { where: { role: 'ADMIN' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.iconBox}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
        </div>
        <div style={styles.titleContainer}>
          <h2 style={styles.title}>New Purchases</h2>
          <div style={styles.awaitingBadge}>⚡ {newCompanies.length} Orders Awaiting</div>
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Client Identity</th>
            <th style={styles.th}>Contact Vector</th>
            <th style={styles.th}>Service Tier</th>
            <th style={styles.th}>Revenue</th>
            <th style={styles.th}>Purchase Date</th>
          </tr>
        </thead>
        <tbody>
          {newCompanies.map((company, index) => {
            const adminUser = company.users[0];
            const pDate = new Date(company.createdAt);
            const revenue = company.paidSeats * 1; // Assuming $1 per seat as per requirements

            return (
              <tr key={company.id}>
                <td style={styles.td}>{(index + 1).toString().padStart(2, '0')}</td>
                
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={styles.avatar}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>{company.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🖨️ N/A</div>
                    </div>
                  </div>
                </td>

                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', fontWeight: 500 }}>
                    ✉️ {adminUser?.email || 'No email provided'}
                  </div>
                </td>

                <td style={styles.td}>
                  <span style={styles.pillStartup}>Startup Tier</span>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 500 }}>
                    {company.paidSeats} Seats · monthly
                  </div>
                </td>

                <td style={styles.td}>
                  <div style={{ fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>${revenue.toFixed(1)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Stripe Engine</div>
                </td>

                <td style={styles.td}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    📅 {pDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '1.25rem', marginTop: '0.1rem' }}>
                    {pDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
              </tr>
            )
          })}
          {newCompanies.length === 0 && (
            <tr>
              <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                No new purchases in the last 7 days.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
