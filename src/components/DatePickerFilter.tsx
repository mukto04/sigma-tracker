'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function DatePickerFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    // Set default date on mount to avoid hydration mismatch
    const queryDate = searchParams.get('date');
    if (queryDate) {
      setDateStr(queryDate);
    } else {
      setDateStr(new Date().toLocaleDateString('en-CA'));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateStr(newDate); // Update UI immediately
    const params = new URLSearchParams(searchParams.toString());
    if (newDate) {
      params.set('date', newDate);
    } else {
      params.delete('date');
    }
    router.push(`?${params.toString()}`);
  };

  // Prevent rendering the input with empty value which shows mm/dd/yyyy initially
  if (!dateStr) return <div style={{ height: '38px', width: '200px' }}></div>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <label htmlFor="dateFilter" style={{ fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>Select Date:</label>
      <input 
        id="dateFilter"
        type="date" 
        value={dateStr}
        onChange={handleChange}
        style={{ 
          padding: '0.5rem 1rem', 
          borderRadius: '8px', 
          border: '1px solid #cbd5e1', 
          fontSize: '0.875rem',
          color: '#334155',
          outline: 'none',
          cursor: 'pointer'
        }}
      />
    </div>
  );
}
