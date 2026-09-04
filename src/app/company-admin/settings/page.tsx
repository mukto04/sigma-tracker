import { getSession } from '@/lib/auth';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { IdleTimeoutForm } from '../IdleTimeoutForm';
import { AddProjectForm } from '../Forms';

export const runtime = 'edge';

import { ImageUploadForm, ChangePasswordForm } from '@/components/SettingsForms';

export default async function SettingsPage() {
  const session = await getSession();
  
  const company = await prisma.company.findFirst({
    where: { name: { not: 'Superadmin HQ' } },
    include: {
      projects: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!company || !session?.user?.id) return null;

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Settings</h1>

      {/* Tracker Settings */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '0.5rem' }}>
          ⏱️ Idle Timeout
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Set the number of minutes before the tracker automatically marks a session as idle.
        </p>
        <IdleTimeoutForm companyId={company.id} initialValue={company.idleTimeoutMinutes} />
      </div>

      <div className="dashboard-columns">
        <style>{`
          .dashboard-columns { display: grid; grid-template-columns: 1fr; gap: 1.5rem; align-items: start; }
          @media (min-width: 1024px) { .dashboard-columns { grid-template-columns: 1fr 1fr; } }
        `}</style>

        {/* Company Logo */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '0.5rem' }}>
            🏢 Company Logo
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Upload a logo to display in the sidebar. Maximum 2MB.
          </p>
          <ImageUploadForm id={company.id} type="company" currentImage={company.logoUrl} />
        </div>

        {/* Security / Password */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '0.5rem' }}>
            🔒 Security
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Change your admin account password.
          </p>
          <ChangePasswordForm userId={session.user.id} />
        </div>
      </div>

      {/* Project Management */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '1rem' }}>
            📁 Projects ({company.projects.length})
          </h2>
          {company.projects.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
              No projects yet. Create your first project.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {company.projects.map(p => (
                <li key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 0',
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{p.description}</div>
                    )}
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    borderRadius: '99px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}>Active</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '1.25rem' }}>
            ➕ Create Project
          </h2>
          <AddProjectForm companyId={company.id} />
        </div>
      </div>

      {/* Company Info */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '1rem' }}>
          🏢 Subscription Info
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Plan', value: company.plan },
            { label: 'Seats Purchased', value: String(company.paidSeats) },
            { label: 'Status', value: company.subscriptionStatus },
          ].map(item => (
            <div key={item.label} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{item.label}</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
