'use client';

import { useState } from 'react';

type Props = { hasOutstandingPayment: boolean; hasCustomer: boolean };

export default function BillingActions({ hasOutstandingPayment, hasCustomer }: Props) {
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null);
  const [error, setError] = useState('');

  async function openBilling(flow: 'checkout' | 'portal') {
    setLoading(flow);
    setError('');
    try {
      const response = await fetch(`/api/billing/${flow}`, { method: 'POST' });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || 'Unable to open secure billing.');
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open secure billing.');
      setLoading(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
      {hasOutstandingPayment && <button type="button" onClick={() => openBilling('checkout')} disabled={loading !== null} style={{ border: 0, borderRadius: '6px', background: '#2563eb', color: 'white', fontWeight: 700, padding: '0.7rem 1rem', cursor: 'pointer' }}>{loading === 'checkout' ? 'Opening secure checkout...' : 'Add Card & Pay Due'}</button>}
      {hasCustomer && <button type="button" onClick={() => openBilling('portal')} disabled={loading !== null} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', color: '#1e293b', fontWeight: 700, padding: '0.65rem 1rem', cursor: 'pointer' }}>{loading === 'portal' ? 'Opening billing portal...' : 'Update Card'}</button>}
      {error && <span role="alert" style={{ color: '#b91c1c', fontSize: '0.8rem', maxWidth: '280px', textAlign: 'right' }}>{error}</span>}
    </div>
  );
}
