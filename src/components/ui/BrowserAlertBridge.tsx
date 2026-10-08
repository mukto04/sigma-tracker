'use client';

import { useEffect, useRef, useState } from 'react';

export function BrowserAlertBridge() {
  const [message, setMessage] = useState<string | null>(null);
  const nativeAlert = useRef<typeof window.alert | null>(null);

  useEffect(() => {
    nativeAlert.current = window.alert;
    window.alert = (nextMessage?: string) => setMessage(String(nextMessage ?? 'Something needs your attention.'));
    return () => {
      if (nativeAlert.current) window.alert = nativeAlert.current;
    };
  }, []);

  if (!message) return null;
  return <div onMouseDown={() => setMessage(null)} style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'grid', placeItems: 'center', padding: '1.25rem', background: 'rgba(2, 6, 23, 0.68)', backdropFilter: 'blur(6px)' }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="notice-title" onMouseDown={(event) => event.stopPropagation()} style={{ width: 'min(100%, 440px)', padding: '1.5rem', border: '1px solid #334155', borderRadius: '10px', background: '#111827', color: '#f8fafc', boxShadow: '0 24px 48px rgba(0,0,0,.38)' }}>
      <div style={{ width: '40px', height: '40px', display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#1d4ed8', fontWeight: 800, fontSize: '1.2rem' }}>i</div>
      <h2 id="notice-title" style={{ margin: '1rem 0 .45rem', fontSize: '1.125rem' }}>SigmaTracker update</h2>
      <p style={{ margin: 0, color: '#cbd5e1', fontSize: '.925rem', lineHeight: 1.55 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}><button autoFocus onClick={() => setMessage(null)} style={{ minHeight: '40px', padding: '0 .95rem', borderRadius: '6px', background: '#2563eb', color: 'white', fontWeight: 700 }}>Got it</button></div>
    </section>
  </div>;
}
