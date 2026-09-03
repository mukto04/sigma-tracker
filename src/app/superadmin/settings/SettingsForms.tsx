'use client'; // HMR trigger

import React, { useState, useTransition } from 'react';
import { updateSetting, updateMasterSecret } from './actions';

// Custom reusable inputs to match the sleek dark theme
const DarkInput = ({ label, type = 'text', value, onChange, placeholder }: any) => (
  <div style={{ flex: 1 }}>
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
      {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        color: 'white',
        padding: '0.75rem',
        borderRadius: '8px',
        fontSize: '0.875rem'
      }}
    />
  </div>
);

const SaveButton = ({ label, isPending, variant = 'primary' }: any) => {
  const bg = variant === 'danger' ? '#ef4444' : variant === 'purple' ? '#a855f7' : '#ffffff';
  const color = variant === 'danger' || variant === 'purple' ? 'white' : '#0f172a';

  return (
    <button 
      type="submit" 
      disabled={isPending}
      style={{
        backgroundColor: bg,
        color: color,
        fontWeight: 700,
        padding: '0.75rem 2rem',
        borderRadius: '8px',
        border: 'none',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.7 : 1,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem'
      }}
    >
      {isPending ? 'Saving...' : label}
    </button>
  );
};

export function BrandingForm({ initialSettings }: { initialSettings: any }) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialSettings.login_title || 'AppDevs HR Master Access');
  const [subtitle, setSubtitle] = useState(initialSettings.login_subtitle || 'Restricted to AppDevs Administrators only.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateSetting('login_title', title);
      await updateSetting('login_subtitle', subtitle);
      alert('Branding updated successfully!');
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <DarkInput label="Login Page Title" value={title} onChange={(e:any) => setTitle(e.target.value)} />
        <DarkInput label="Login Page Subtitle" value={subtitle} onChange={(e:any) => setSubtitle(e.target.value)} />
      </div>
      <SaveButton label="💾 Save System Configurations" isPending={isPending} />
    </form>
  );
}

export function SecurityForm() {
  const [isPending, startTransition] = useTransition();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) return alert("Passwords don't match!");
    
    startTransition(async () => {
      const res = await updateMasterSecret(newPass);
      if (res.success) {
        setNewPass('');
        setConfirmPass('');
        alert('Master secret updated!');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DarkInput label="Current Password" type="password" placeholder="••••••••" />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <DarkInput label="New Password" type="password" value={newPass} onChange={(e:any) => setNewPass(e.target.value)} />
        <DarkInput label="Confirm New" type="password" value={confirmPass} onChange={(e:any) => setConfirmPass(e.target.value)} />
      </div>
      <SaveButton label="🛡️ Update Master Secret" variant="danger" isPending={isPending} />
    </form>
  );
}

export function StripeForm({ initialSettings }: { initialSettings: any }) {
  const [isPending, startTransition] = useTransition();
  const [pub, setPub] = useState(initialSettings.stripe_public_key || '');
  const [sec, setSec] = useState(initialSettings.stripe_secret_key || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateSetting('stripe_public_key', pub);
      await updateSetting('stripe_secret_key', sec);
      alert('Payment gateway saved!');
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DarkInput label="Publishable Key" value={pub} onChange={(e:any) => setPub(e.target.value)} />
      <DarkInput label="Secret Key" type="password" value={sec} onChange={(e:any) => setSec(e.target.value)} />
      <DarkInput label="Webhook Secret (optional)" type="password" placeholder="whsec_..." />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <SaveButton label="💾 Save Stripe Configuration" variant="purple" isPending={isPending} />
      </div>
    </form>
  );
}

export function EmailGatewayForm({ initialSettings }: { initialSettings: any }) {
  const [isPending, startTransition] = useTransition();
  const [host, setHost] = useState(initialSettings.smtp_host || '');
  const [port, setPort] = useState(initialSettings.smtp_port || '');
  const [user, setUser] = useState(initialSettings.smtp_user || '');
  const [pass, setPass] = useState(initialSettings.smtp_pass || '');
  const [fromName, setFromName] = useState(initialSettings.smtp_from_name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateSetting('smtp_host', host);
      await updateSetting('smtp_port', port);
      await updateSetting('smtp_user', user);
      await updateSetting('smtp_pass', pass);
      await updateSetting('smtp_from_name', fromName);
      alert('Email Gateway settings saved successfully!');
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <DarkInput label="SMTP Host" value={host} onChange={(e:any) => setHost(e.target.value)} placeholder="smtp.gmail.com" />
        <DarkInput label="SMTP Port" value={port} onChange={(e:any) => setPort(e.target.value)} placeholder="587" />
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <DarkInput label="SMTP User / Email" value={user} onChange={(e:any) => setUser(e.target.value)} placeholder="hello@sigma.com" />
        <DarkInput label="SMTP Password" type="password" value={pass} onChange={(e:any) => setPass(e.target.value)} placeholder="••••••••" />
      </div>
      <DarkInput label="From Name (e.g. Sigma Tracker Support)" value={fromName} onChange={(e:any) => setFromName(e.target.value)} placeholder="Sigma Tracker Support" />
      <SaveButton label="📧 Save Email Settings" isPending={isPending} />
    </form>
  );
}
