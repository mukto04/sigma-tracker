'use client';

import React, { useState, useTransition } from 'react';
import { updateIdleTimeout } from './actions';

export function IdleTimeoutForm({ companyId, initialValue }: { companyId: string, initialValue: number }) {
  const [isPending, startTransition] = useTransition();
  const [minutes, setMinutes] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateIdleTimeout(companyId, minutes);
      if (res.success) {
        alert('Idle Timeout updated successfully!');
      } else {
        alert('Failed to update idle timeout.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
          Auto-Stop Tracker Timeout (Minutes)
        </label>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
          Set to 0 to disable auto-stop. If set to 10, the tracker will automatically stop if the employee is inactive (no mouse/keyboard) for 10 minutes.
        </p>
        <input 
          type="number" 
          value={minutes} 
          onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
          min="0"
          max="120"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
        />
      </div>
      <button 
        type="submit" 
        disabled={isPending}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '6px',
          fontWeight: 600,
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer'
        }}
      >
        {isPending ? 'Saving...' : 'Save Timeout Setting'}
      </button>
    </form>
  );
}
