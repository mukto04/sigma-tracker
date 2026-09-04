import { getSession } from '@/lib/auth';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { DatePickerFilter } from '@/components/DatePickerFilter';

export const runtime = 'edge';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h === 0 && m === 0) return `${s}s`;
  if (h === 0) return `${m}m ${s}s`;
  return `${h}h ${m}m ${s}s`;
}

export default async function TimesheetsPage({ searchParams }: { searchParams: { date?: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return null;

  // Use selected date or default to today
  const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date();
  
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId: session.user.id,
      startTime: { gte: startOfDay, lte: endOfDay }
    },
    orderBy: { startTime: 'desc' }
  });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>My Timesheets</h2>
        <DatePickerFilter />
      </div>
      
      {timeEntries.length === 0 ? (
        <div style={{ padding: '3rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
          No timesheet records available for the selected date.
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Start Time</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>End Time</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{entry.startTime.toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{entry.startTime.toLocaleTimeString()}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {entry.endTime ? entry.endTime.toLocaleTimeString() : <span style={{ color: '#16a34a' }}>Active</span>}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: 500 }}>
                    {formatDuration(entry.duration || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
