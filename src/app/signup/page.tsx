import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../auth.module.css';

export default function SignupPage() {
  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Start tracking time for your company.</p>
        </div>
        
        <form className={styles.form}>
          <Input 
            label="Company Name" 
            type="text" 
            placeholder="Acme Corp" 
            required 
          />
          <Input 
            label="Your Name" 
            type="text" 
            placeholder="John Doe" 
            required 
          />
          <Input 
            label="Email address" 
            type="email" 
            placeholder="name@company.com" 
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Create a strong password" 
            required 
          />
          
          <Button type="button" variant="primary" fullWidth size="lg" className={styles.submitBtn}>
            Create Account
          </Button>

          <div className={styles.divider}>OR</div>

          <Button type="button" variant="outline" fullWidth>
            Sign up with Google
          </Button>

          <div className={styles.footer}>
            Already have an account? 
            <Link href="/login" className={styles.link}>Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
