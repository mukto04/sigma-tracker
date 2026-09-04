import React from 'react';
import { prisma } from '@/lib/prisma';
import { AdminSidebar } from './AdminSidebar';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function CompanyAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch company data
  const company = await prisma.company.findFirst({
    where: {
      name: { not: 'Superadmin HQ' }
    },
    include: {
      users: true
    }
  });

  if (!company) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>No Company Found</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Please start tracking to generate a demo company.</p>
        </div>
      </div>
    );
  }

  const adminName = company.users.find(u => u.role === 'ADMIN')?.name || 'Admin';

  return (
    <>
      <style>{`
        .admin-layout-wrapper {
          display: flex;
          min-height: 100vh;
          background-color: #f1f5f9;
          font-family: 'Inter', sans-serif;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .admin-layout-wrapper {
            flex-direction: row;
          }
        }
        .admin-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          width: 100%;
        }
        .admin-header-row {
          min-height: 72px;
          background-color: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .admin-header-row {
            padding: 0 2rem;
          }
        }
        .admin-content-area {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          overflow-x: hidden;
          max-width: 100vw;
        }
        @media (min-width: 768px) {
          .admin-content-area {
            padding: 2rem;
          }
        }
      `}</style>
      <div className="admin-layout-wrapper">
        <AdminSidebar companyName={company.name} adminName={adminName} logoUrl={company.logoUrl} />

        <div className="admin-main-content">
          <div className="admin-header-row">
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Management Console</div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ padding: '0.5rem 1rem', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                {company.plan} Plan
              </div>
            </div>
          </div>
          <div className="admin-content-area">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
