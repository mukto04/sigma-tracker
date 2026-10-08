'use client';

import { useEffect } from 'react';

export default function DashboardError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('Dashboard failed to load:', error);
  }, [error]);

  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ maxWidth: '420px', textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '2rem', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}>
        <h1 style={{ margin: '0 0 0.75rem', color: '#0f172a', fontSize: '1.25rem' }}>Your session needs to be refreshed</h1>
        <p style={{ margin: '0 0 1.25rem', color: '#475569', lineHeight: 1.5 }}>Please sign in again to safely reload your workspace.</p>
        <a href="/api/auth/logout" style={{ display: 'inline-block', borderRadius: '6px', background: '#2563eb', color: 'white', textDecoration: 'none', fontWeight: 700, padding: '0.7rem 1rem' }}>Sign in again</a>
      </section>
    </main>
  );
}
