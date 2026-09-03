import React, { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from './LoginForm';
import styles from '../auth.module.css';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img src="/logo.png" alt="SigmaTracker Logo" style={{ height: '48px', objectFit: 'contain' }} />
          </div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Log in to manage your team's time.</p>
        </div>
        
        <Suspense fallback={<div>Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
