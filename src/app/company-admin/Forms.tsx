'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { addEmployee, addProject } from './actions';

export function AddEmployeeForm({ companyId }: { companyId: string }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addEmployee(companyId, form.name, form.email, form.password);
      if (res.success) {
        setForm({ name: '', email: '', password: '' });
        alert('Employee added successfully!');
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
      <Input label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
      <Input label="Temporary Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
      <Button type="submit" disabled={isPending}>{isPending ? 'Adding...' : 'Add Employee'}</Button>
    </form>
  );
}

export function AddProjectForm({ companyId }: { companyId: string }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addProject(companyId, form.name, form.description);
      if (res.success) {
        setForm({ name: '', description: '' });
        alert('Project created successfully!');
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input label="Project Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
      <Input label="Description (Optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      <Button type="submit" disabled={isPending} variant="secondary">{isPending ? 'Creating...' : 'Create Project'}</Button>
    </form>
  );
}
