import React from 'react';
import { prisma } from '@/lib/prisma';
import { AddEmployeeForm } from '../Forms';
import ResetPasswordButton from './ResetPasswordButton';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const company = await prisma.company.findFirst({
    where: { name: { not: 'Superadmin HQ' } },
    include: {
      users: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!company) return null;

  const employees = company.users.filter(u => u.role !== 'SUPERADMIN');

  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08)',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      padding: '1rem 1.5rem',
      textAlign: 'left' as const,
      fontSize: '0.75rem',
      fontWeight: 700,
      color: '#64748b',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
    },
    td: {
      padding: '1rem 1.5rem',
      fontSize: '0.875rem',
      color: '#0f172a',
      borderBottom: '1px solid #f1f5f9',
      verticalAlign: 'middle' as const,
    },
    avatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: '#eff6ff',
      color: '#2563eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '0.875rem',
      flexShrink: 0,
    },
    roleBadge: (role: string) => ({
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '99px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: role === 'ADMIN' ? '#eff6ff' : '#f0fdf4',
      color: role === 'ADMIN' ? '#2563eb' : '#16a34a',
    }),
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Employees</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            {employees.length} total — {company.paidSeats} seats purchased
          </p>
        </div>
      </div>

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
        `}</style>
        {/* Employee Table */}
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ ...styles.table, minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Joined</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(user => (
                <tr key={user.id}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={styles.avatar}>
                        {(user.name || user.email).substring(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{user.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, color: '#64748b' }}>{user.email}</td>
                  <td style={styles.td}>
                    <span style={styles.roleBadge(user.role)}>{user.role}</span>
                  </td>
                  <td style={{ ...styles.td, color: '#64748b' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={styles.td}>
                    <ResetPasswordButton userId={user.id} employeeName={user.name || user.email} />
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No employees yet. Add your first employee.
                  </td>
                </tr>
              )}
          </tbody>
          </table>
          </div>
        </div>

        {/* Add Employee Form */}
        <div style={{ ...styles.card, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', marginTop: 0 }}>
            ➕ Add New Employee
          </h2>
          <AddEmployeeForm companyId={company.id} />
        </div>
      </div>
    </div>
  );
}
