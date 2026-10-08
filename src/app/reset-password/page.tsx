import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';
import styles from '../auth.module.css';

export default function ResetPasswordPage() {
  return <main className={styles.container}><section className={styles.authCard}><div className={styles.header}><img src="/logo.png" alt="SigmaTracker Logo" style={{ height: '48px', objectFit: 'contain', marginBottom: '1.5rem' }} /><h1 className={styles.title}>Choose a new password</h1><p className={styles.subtitle}>Use at least 8 characters for your new password.</p></div><Suspense fallback={null}><ResetPasswordForm /></Suspense></section></main>;
}
