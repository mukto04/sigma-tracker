'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function PricingCalculator() {
  const [employees, setEmployees] = useState<number>(5);
  const pricePerEmployee = 1;

  const total = employees * pricePerEmployee;

  const handleCheckout = async () => {
    // In a real app with Stripe, we would call an API route here
    // e.g., fetch('/api/checkout', { method: 'POST', body: JSON.stringify({ quantity: employees }) })
    alert(`Mock Checkout: Redirecting to Stripe to pay $${total}/month for ${employees} seats.`);
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '4rem auto',
      padding: '2rem',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-light)',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
        Simple, Transparent Pricing
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Just $1 per employee, per month. No hidden fees.
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          How many employees do you have?
        </label>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={employees} 
            onChange={(e) => setEmployees(parseInt(e.target.value))}
            style={{ width: '100%', maxWidth: '300px', accentColor: 'var(--brand-default)' }}
          />
          <input 
            type="number"
            min="1"
            value={employees}
            onChange={(e) => setEmployees(parseInt(e.target.value) || 1)}
            style={{ 
              width: '80px', 
              padding: '0.5rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-light)',
              textAlign: 'center',
              fontSize: '1.125rem',
              fontWeight: 600
            }}
          />
        </div>
      </div>

      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: 'var(--bg-primary)', 
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
          Estimated Total
        </div>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          ${total}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/mo</span>
        </div>
      </div>

      <Button size="lg" fullWidth onClick={handleCheckout}>
        Subscribe with Stripe
      </Button>
    </div>
  );
}
