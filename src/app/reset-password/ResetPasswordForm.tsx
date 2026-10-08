'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../auth.module.css';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const token = searchParams.get('token');
    if (!token) return setError('This reset link is invalid or has expired.');
    if (password.length < 8) return setError('Use a password with at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setError(''); setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to reset password.');
      setIsComplete(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to reset password.');
    } finally { setIsSubmitting(false); }
  };

  if (isComplete) return <div className={styles.form}><p className={styles.success} role="status">Your password has been updated. You can now sign in.</p><Link href="/login" className={styles.backLink}>Go to sign in</Link></div>;
  return <form className={styles.form} onSubmit={submit}><div className={styles.field}><label className={styles.label} htmlFor="password">New password</label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div><div className={styles.field}><label className={styles.label} htmlFor="confirmPassword">Confirm password</label><Input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required /></div>{error && <p className={styles.error} role="alert"><span aria-hidden="true">!</span>{error}</p>}<Button type="submit" disabled={isSubmitting} className={styles.submitBtn}>{isSubmitting ? 'Updating password...' : 'Update password'}</Button></form>;
}
