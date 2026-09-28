'use client';

import dynamic from 'next/dynamic';

const DesktopTrackerClient = dynamic(() => import('./DesktopTrackerClient'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#e5e7eb',
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.9rem',
    }}>
      Loading SigmaTracker...
    </div>
  ),
});

export default function DesktopClientLoader() {
  return <DesktopTrackerClient />;
}
