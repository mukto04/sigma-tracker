'use client';

import React, { useState } from 'react';
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
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">Password</label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <Button type="submit" disabled={isLoading} className={styles.submitBtn}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
