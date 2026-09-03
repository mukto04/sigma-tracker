'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function PricingForm() {
  const [employees, setEmployees] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees, companyName, email }),
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert(data.error || 'Failed to start checkout');
        setIsLoading(false);
      }
    } catch (err) {
      alert('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const totalPrice = employees * 1; // $1 per employee

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', maxWidth: '500px', margin: '0 auto' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', textAlign: 'center' }}>Start Your Subscription</h3>
      <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '2rem' }}>Only $1 per employee per month.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Input 
          label="Company Name" 
          type="text" 
          placeholder="Acme Corp" 
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required 
        />
        <Input 
          label="Admin Email" 
          type="email" 
          placeholder="admin@acmecorp.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
            Number of Employees
          </label>
          <input 
            type="number" 
            min="1" 
            value={employees}
            onChange={(e) => setEmployees(parseInt(e.target.value) || 1)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            required
          />
        </div>

        <div style={{ marginTop: '1rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Monthly Price</div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a' }}>${totalPrice}<span style={{ fontSize: '1rem', color: '#64748b' }}>.00</span></div>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading} style={{ marginTop: '0.5rem' }}>
          {isLoading ? 'Redirecting to Stripe...' : 'Pay with Stripe'}
        </Button>
      </form>
    </div>
  );
}
