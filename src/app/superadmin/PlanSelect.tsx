'use client';

import React, { useTransition } from 'react';
import { updateCompanyPlan } from './actions';

export default function PlanSelect({ companyId, currentPlan }: { companyId: string, currentPlan: string }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlan = e.target.value;
    startTransition(() => {
      updateCompanyPlan(companyId, newPlan);
    });
  };

  return (
    <select 
      value={currentPlan}
      onChange={handleChange}
      disabled={isPending}
      style={{
        padding: '0.5rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: '0.875rem',
        cursor: 'pointer',
        opacity: isPending ? 0.7 : 1
      }}
    >
      <option value="FREE">Free</option>
      <option value="PRO">Pro</option>
      <option value="ENTERPRISE">Enterprise</option>
    </select>
  );
}
