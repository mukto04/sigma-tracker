import { ForgotPasswordForm } from './ForgotPasswordForm';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  return <main className={styles.container}><section className={styles.authCard}><div className={styles.header}><img src="/logo.png" alt="SigmaTracker Logo" style={{ height: '48px', objectFit: 'contain', marginBottom: '1.5rem' }} /><h1 className={styles.title}>Reset your password</h1><p className={styles.subtitle}>Enter your email and we will send a secure reset link.</p></div><ForgotPasswordForm /></section></main>;
}
