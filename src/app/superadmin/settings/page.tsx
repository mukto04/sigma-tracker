import React from 'react'; // HMR trigger
import { getSettings } from './actions';
import { BrandingForm, SecurityForm, StripeForm, EmailGatewayForm } from './SettingsForms';

const styles = {
  container: {
    backgroundColor: '#0a0f1c',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: '"Inter", sans-serif',
    color: '#e2e8f0',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '3rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #1f2937'
  },
  iconBox: {
    backgroundColor: '#3b82f6',
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
  },
  title: {
    fontSize: '1.75rem',
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
  section: {
    marginBottom: '2rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.125rem',
    fontWeight: 700,
    color: 'white',
    marginBottom: '1rem',
  },
  cardRow: {
    display: 'flex',
    gap: '2rem',
  },
  cardMain: {
    flex: '1 1 auto',
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '16px',
    padding: '2rem',
  },
  cardSide: {
    width: '350px',
    flexShrink: 0,
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '16px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem'
  }
};

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div style={styles.container}>
      
      <div style={styles.titleContainer}>
        <div style={styles.iconBox}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
        <div>
          <h1 style={styles.title}>System Settings</h1>
          <p style={styles.subtitle}>Master configurations & security</p>
        </div>
      </div>

      {/* PORTAL BRANDING */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={{ color: '#22c55e' }}>🖥️</span> Portal Branding
        </div>
        <div style={styles.cardRow}>
          <div style={styles.cardMain}>
            <BrandingForm initialSettings={settings} />
          </div>
          <div style={styles.cardSide}>
            <div style={{ color: '#3b82f6' }}>⚡ Instant Sync</div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Changes propagate instantly to the login gateway. Keep branding consistent with your company guidelines.
            </div>
          </div>
        </div>
      </div>

      {/* MASTER SECURITY */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={{ color: '#3b82f6' }}>🔒</span> Master Security
        </div>
        <div style={styles.cardRow}>
          <div style={styles.cardMain}>
            <SecurityForm />
          </div>
          <div style={styles.cardSide}>
            <div style={{ color: '#f59e0b' }}>⚠️ Level 1 Protocol</div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Updating the Master Key will invalidate all active sessions. Keep your new password documented securely.
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT GATEWAY */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={{ color: '#a855f7' }}>💳</span> Payment Gateway
        </div>
        <div style={styles.cardRow}>
          <div style={styles.cardMain}>
            <StripeForm initialSettings={settings} />
          </div>
          <div style={styles.cardSide}>
            <div style={{ color: '#3b82f6' }}>📘 How it Works</div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Customers click <strong>Buy Now</strong> on the pricing page and pay via Stripe Checkout. Payments go directly to your connected Stripe account.
            </div>
          </div>
        </div>
      </div>
      {/* EMAIL GATEWAY */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={{ color: '#0ea5e9' }}>📧</span> Email Gateway
        </div>
        <div style={styles.cardRow}>
          <div style={styles.cardMain}>
            <EmailGatewayForm initialSettings={settings} />
          </div>
          <div style={styles.cardSide}>
            <div style={{ color: '#0ea5e9' }}>📘 SMTP Setup</div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Configure your SMTP provider (e.g. Amazon SES, SendGrid, Mailgun, or standard Gmail/Hostinger SMTP) to enable system-generated emails like invites and password resets.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
