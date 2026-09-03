'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Preset = 'today' | 'yesterday' | 'last7' | 'custom';

interface DateFilterProps {
  currentFrom: string;
  currentTo: string;
}

function getLocalDateStr(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DateFilter({ currentFrom, currentTo }: DateFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [preset, setPreset] = useState<Preset>(() => {
    const todayStr = getLocalDateStr(new Date());
    if (currentFrom === todayStr && currentTo === todayStr) return 'today';
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = getLocalDateStr(yest);
    if (currentFrom === yestStr && currentTo === yestStr) return 'yesterday';
    const last7 = new Date();
    last7.setDate(last7.getDate() - 6);
    const last7Str = getLocalDateStr(last7);
    if (currentFrom === last7Str && currentTo === todayStr) return 'last7';
    return 'custom';
  });

  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    const todayStr = getLocalDateStr(new Date());

    let fromStr = todayStr;
    let toStr = todayStr;

    if (p === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      fromStr = getLocalDateStr(yesterday);
      toStr = fromStr;
    } else if (p === 'last7') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      fromStr = getLocalDateStr(sevenDaysAgo);
      toStr = todayStr;
    } else if (p === 'today') {
      fromStr = todayStr;
      toStr = todayStr;
    }

    setFrom(fromStr);
    setTo(toStr);

    if (p !== 'custom') {
      startTransition(() => {
        router.push(`/company-admin/reports?from=${fromStr}&to=${toStr}`);
      });
    }
  };

  const handleApplyCustom = () => {
    startTransition(() => {
      router.push(`/company-admin/reports?from=${from}&to=${to}`);
    });
  };

  const presetBtnStyle = (p: Preset) => ({
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: preset === p ? '#2563eb' : 'white',
    borderColor: preset === p ? '#2563eb' : '#e2e8f0',
    color: preset === p ? 'white' : '#64748b',
    transition: 'all 0.15s ease',
  });

  const inputStyle = {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.875rem',
    color: '#0f172a',
    backgroundColor: 'white',
    outline: 'none',
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap' as const,
    }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Filter by:</span>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button style={presetBtnStyle('today')} onClick={() => applyPreset('today')}>Today</button>
        <button style={presetBtnStyle('yesterday')} onClick={() => applyPreset('yesterday')}>Yesterday</button>
        <button style={presetBtnStyle('last7')} onClick={() => applyPreset('last7')}>Last 7 Days</button>
        <button style={presetBtnStyle('custom')} onClick={() => setPreset('custom')}>Custom</button>
      </div>

      {preset === 'custom' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            style={inputStyle}
          />
          <span style={{ color: '#94a3b8' }}>→</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={handleApplyCustom}
            disabled={isPending}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Loading...' : 'Apply'}
          </button>
        </div>
      )}

      {isPending && preset !== 'custom' && (
        <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Loading...</span>
      )}
    </div>
  );
}
