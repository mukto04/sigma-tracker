'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../auth.module.css';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error || 'Invalid email or password');
      } else {
        const data = await res.json() as { user?: { role?: string } };
        const callbackUrl = searchParams.get('callbackUrl');
        const role = data.user?.role;
        const roleHome = role === 'SUPERADMIN' ? '/superadmin' : role === 'ADMIN' ? '/company-admin' : '/dashboard';
        const allowedCallback =
          callbackUrl &&
          callbackUrl.startsWith('/') &&
          !callbackUrl.startsWith('//') &&
          (
            (role === 'SUPERADMIN' && callbackUrl.startsWith('/superadmin')) ||
            (role === 'ADMIN' && callbackUrl.startsWith('/company-admin')) ||
            (role === 'EMPLOYEE' && (callbackUrl.startsWith('/dashboard') || callbackUrl.startsWith('/desktop') || callbackUrl.startsWith('/employee')))
          );

        if (allowedCallback) {
          router.push(callbackUrl);
        } else {
          router.push(roleHome);
        }
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="Enter your email"
          className={error ? styles.invalidInput : undefined}
          required
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">Password</label>
        <div className={styles.passwordField}>
          <Input
            id="password"
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter your password"
            className={`${styles.passwordInput} ${error ? styles.invalidInput : ''}`}
            required
          />
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isPasswordVisible}
            title={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {isPasswordVisible ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.4 4.9 10 7.1a.9.9 0 0 1 0 .5 12 12 0 0 1-3 4.5M6.6 6.6A12 12 0 0 0 2 11.1a.9.9 0 0 0 0 .5C2.6 13.8 6.5 18 12 18c1 0 2-.2 2.9-.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
                <circle cx="12" cy="12" r="2.7" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <Link href="/forgot-password" className={styles.forgotPassword}>Forgot password?</Link>
      {error && (
        <p className={styles.error} role="alert">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      )}
      <Button type="submit" disabled={isLoading} className={styles.submitBtn}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
