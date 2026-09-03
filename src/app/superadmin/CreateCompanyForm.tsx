'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createCompanyManually } from './actions';

export default function CreateCompanyForm() {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ 
    companyName: '', 
    adminName: '', 
    adminEmail: '', 
    adminPassword: '',
    employeeCount: 1,
    validityDays: 30
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createCompanyManually(
        form.companyName, 
        form.adminEmail, 
        form.adminName, 
        form.adminPassword,
        form.employeeCount,
        form.validityDays
      );
      if (res.success) {
        setForm({ companyName: '', adminName: '', adminEmail: '', adminPassword: '', employeeCount: 1, validityDays: 30 });
        alert('Company & Admin created successfully!');
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #1f2937' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: '#f8fafc' }}>Manually Onboard a Client</h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', alignItems: 'end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>Company Name</label>
          <input 
            type="text"
            value={form.companyName} 
            onChange={e => setForm({...form, companyName: e.target.value})} 
            required 
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>Admin Name</label>
          <input 
            type="text"
            value={form.adminName} 
            onChange={e => setForm({...form, adminName: e.target.value})} 
            required 
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>Admin Email</label>
          <input 
            type="email"
            value={form.adminEmail} 
            onChange={e => setForm({...form, adminEmail: e.target.value})} 
            required 
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>Password</label>
          <input 
            type="password"
            value={form.adminPassword} 
            onChange={e => setForm({...form, adminPassword: e.target.value})} 
            required 
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>Employee Count (Seats)</label>
          <input 
            type="number"
            min="1"
            value={form.employeeCount} 
            onChange={e => setForm({...form, employeeCount: parseInt(e.target.value) || 1})} 
            required 
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>Validity (Days)</label>
          <input 
            type="number"
            min="1"
            value={form.validityDays} 
            onChange={e => setForm({...form, validityDays: parseInt(e.target.value) || 30})} 
            required 
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none' }}
          />
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <Button type="submit" disabled={isPending} style={{ backgroundColor: '#3b82f6', padding: '0.75rem 2rem' }}>{isPending ? 'Creating...' : 'Create Company'}</Button>
        </div>
      </form>
    </div>
  );
}
