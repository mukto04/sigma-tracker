'use client';

import { useEffect } from 'react';

export default function CompanyAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Company Admin error:', error);
  }, [error]);

  return (
    <div style={{
      padding: '3rem',
      textAlign: 'center',
      backgroundColor: 'white',
      borderRadius: '12px',
      margin: '2rem 0',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
        Unable to load section
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        A temporary server error occurred while retrieving data.
      </p>
      <button
        onClick={() => {
          reset();
          window.location.reload();
        }}
        style={{
          padding: '0.625rem 1.25rem',
          backgroundColor: '#2563eb',
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  );
}
