'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../auth.module.css';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Request failed');
      setIsSubmitted(true);
    } catch {
      setError('We could not send a reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <form className={styles.form} onSubmit={submit}>
    {isSubmitted ? <p className={styles.success} role="status">If an account exists for that email, a reset link has been sent.</p> : <div className={styles.field}><label className={styles.label} htmlFor="email">Email</label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required /></div>}
    {error && <p className={styles.error} role="alert"><span aria-hidden="true">!</span>{error}</p>}
    {!isSubmitted && <Button type="submit" disabled={isSubmitting} className={styles.submitBtn}>{isSubmitting ? 'Sending link...' : 'Send reset link'}</Button>}
    <Link href="/login" className={styles.backLink}>Back to sign in</Link>
  </form>;
}
