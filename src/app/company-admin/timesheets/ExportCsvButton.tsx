'use client';

import React from 'react';

interface ExportCsvButtonProps {
  data: Array<{
    employeeName: string;
    employeeEmail: string;
    date: string;
    startTime: string;
    endTime: string;
    durationSeconds: number;
    durationFormatted: string;
    projectName: string;
  }>;
  filename?: string;
}

export function ExportCsvButton({ data, filename = 'timesheet-export.csv' }: ExportCsvButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No timesheet records to export.');
      return;
    }

    const headers = ['Employee Name', 'Email', 'Date', 'Start Time', 'End Time', 'Duration (Seconds)', 'Duration', 'Project'];
    const rows = data.map(item => [
      `"${(item.employeeName || '').replace(/"/g, '""')}"`,
      `"${(item.employeeEmail || '').replace(/"/g, '""')}"`,
      `"${item.date}"`,
      `"${item.startTime}"`,
      `"${item.endTime}"`,
      item.durationSeconds,
      `"${item.durationFormatted}"`,
      `"${(item.projectName || 'General').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#16a34a',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export to CSV
    </button>
  );
}
