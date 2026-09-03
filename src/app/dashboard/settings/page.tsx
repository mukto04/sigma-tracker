import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ImageUploadForm, ChangePasswordForm } from '@/components/SettingsForms';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) return null;

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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>My Settings</h2>
      
      <div className="dashboard-columns">
        <style>{`
          .dashboard-columns { display: grid; grid-template-columns: 1fr; gap: 1.5rem; align-items: start; }
          @media (min-width: 1024px) { .dashboard-columns { grid-template-columns: 1fr 1fr; } }
        `}</style>

        {/* Profile Avatar */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '0.5rem' }}>
            👤 Profile Picture
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Upload an avatar for your profile. Maximum 2MB.
          </p>
          <ImageUploadForm id={user.id} type="user" currentImage={user.avatarUrl} />
        </div>

        {/* Security / Password */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '0.5rem' }}>
            🔒 Security
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Change your account password.
          </p>
          <ChangePasswordForm userId={user.id} />
        </div>
      </div>
    </div>
  );
}
