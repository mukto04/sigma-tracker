import React from 'react';
import Link from 'next/link';
import styles from '../auth.module.css';
import { SignupForm } from './SignupForm';

export default function SignupPage() {
  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Start tracking time for your company.</p>
        </div>
        
        <SignupForm />
        <div className={styles.footer}>
          Already have an account?
          <Link href="/login" className={styles.link}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
