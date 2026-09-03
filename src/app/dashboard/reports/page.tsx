import React from 'react';
import { DatePickerFilter } from '@/components/DatePickerFilter';

export default function ReportsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>My Reports</h2>
        <DatePickerFilter />
      </div>
      <div style={{ padding: '3rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
        No reports available for the selected date.
      </div>
    </div>
  );
}
