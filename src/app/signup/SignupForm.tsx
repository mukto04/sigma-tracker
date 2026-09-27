'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../auth.module.css';

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json() as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      router.push(data.redirectTo || '/company-admin');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <Input
        label="Company Name"
        type="text"
        placeholder="Acme Corp"
        value={form.companyName}
        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
        required
      />
      <Input
        label="Your Name"
        type="text"
        placeholder="John Doe"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <Input
        label="Email address"
        type="email"
        placeholder="name@company.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="Create a strong password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        minLength={8}
        required
      />
      {error && <p className={styles.error}>{error}</p>}
      <Button type="submit" variant="primary" fullWidth size="lg" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
