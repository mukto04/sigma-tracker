'use client';

import React, { useState, useTransition } from 'react';
import { resetEmployeePassword } from '../actions';

export default function ResetPasswordButton({ userId, employeeName }: { userId: string; employeeName: string }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const res = await resetEmployeePassword(userId, newPassword);
      if (res.success) {
        setSuccess(true);
        setNewPassword('');
        setConfirm('');
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1500);
      } else {
        setError(res.error || 'An error occurred.');
      }
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.875rem',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '0.35rem 0.75rem',
          backgroundColor: '#fef3c7',
          color: '#d97706',
          borderRadius: '8px',
          border: '1px solid #fde68a',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        🔑 Reset Password
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '400px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
              Reset Password
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              Setting a new password for <strong>{employeeName}</strong>.
            </p>

            {success ? (
              <div style={{
                textAlign: 'center', padding: '1.5rem',
                backgroundColor: '#f0fdf4', borderRadius: '8px',
                color: '#16a34a', fontWeight: 700, fontSize: '0.875rem',
              }}>
                ✅ Password reset successfully!
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    style={inputStyle}
                    required
                  />
                </div>

                {error && (
                  <div style={{
                    padding: '0.625rem 0.875rem', borderRadius: '8px',
                    backgroundColor: '#fef2f2', color: '#dc2626',
                    fontSize: '0.875rem', fontWeight: 500,
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setError(''); setNewPassword(''); setConfirm(''); }}
                    style={{
                      flex: 1, padding: '0.625rem',
                      borderRadius: '8px', border: '1px solid #e2e8f0',
                      backgroundColor: 'white', color: '#64748b',
                      fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    style={{
                      flex: 1, padding: '0.625rem',
                      borderRadius: '8px', border: 'none',
                      backgroundColor: isPending ? '#93c5fd' : '#2563eb',
                      color: 'white', fontWeight: 700,
                      fontSize: '0.875rem', cursor: isPending ? 'default' : 'pointer',
                    }}
                  >
                    {isPending ? 'Saving...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
