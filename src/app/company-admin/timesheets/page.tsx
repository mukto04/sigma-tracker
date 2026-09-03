import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ExportCsvButton } from './ExportCsvButton';

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return '0h 00m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function formatHourMin(seconds: number) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function getLocalDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default async function CompanyAdminTimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const query = await searchParams;
  const weekOffset = parseInt(query.week || '0', 10);

  const company = await prisma.company.findFirst({
    where: { name: { not: 'Superadmin HQ' } },
    include: { users: true },
  });

  if (!company) return null;

  const employees = company.users.filter(u => u.role !== 'SUPERADMIN');

  // Compute Monday of the selected week
  const now = new Date();
  const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDayOfWeek + weekOffset * 7, 0, 0, 0, 0);

  // Compute Sunday of the selected week
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

  // 7 days of this week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return {
      date: d,
      dateStr: getLocalDateStr(d),
      dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: getLocalDateStr(d) === getLocalDateStr(now),
    };
  });

  // Fetch all time entries in this week
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      user: { companyId: company.id },
      startTime: { gte: monday, lte: sunday },
    },
    include: { user: true, project: true },
    orderBy: { startTime: 'asc' },
  });

  // Map employee weekly breakdown
  let totalCompanyWeekSeconds = 0;
  const activeUserSet = new Set<string>();

  const employeeRows = employees.map(emp => {
    const userEntries = timeEntries.filter(e => e.userId === emp.id);
    const daySeconds: number[] = [0, 0, 0, 0, 0, 0, 0];

    userEntries.forEach(entry => {
      const entryDate = new Date(entry.startTime);
      const entryDateStr = getLocalDateStr(entryDate);
      const dayIndex = weekDays.findIndex(wd => wd.dateStr === entryDateStr);
      if (dayIndex >= 0) {
        if (entry.duration !== null) {
          daySeconds[dayIndex] += entry.duration;
        } else {
          let ongoing = Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000);
          if (ongoing > 24 * 3600) ongoing = 0;
          daySeconds[dayIndex] += ongoing;
        }
      }
    });

    const totalSeconds = daySeconds.reduce((a, b) => a + b, 0);
    if (totalSeconds > 0) {
      activeUserSet.add(emp.id);
      totalCompanyWeekSeconds += totalSeconds;
    }

    return {
      user: emp,
      daySeconds,
      totalSeconds,
    };
  });

  // Export CSV Data
  const exportData = timeEntries.map(e => ({
    employeeName: e.user.name || 'Unnamed',
    employeeEmail: e.user.email,
    date: getLocalDateStr(new Date(e.startTime)),
    startTime: new Date(e.startTime).toLocaleTimeString(),
    endTime: e.endTime ? new Date(e.endTime).toLocaleTimeString() : 'In Progress',
    durationSeconds: e.duration || 0,
    durationFormatted: formatDuration(e.duration || 0),
    projectName: e.project?.name || 'General',
  }));

  const weekRangeLabel = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div>
      {/* Header with Navigation and Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Team Timesheets</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            Weekly hours breakdown and automated payroll export for {company.name}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Week Selector */}
          <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.25rem' }}>
            <Link
              href={`/company-admin/timesheets?week=${weekOffset - 1}`}
              style={{ padding: '0.35rem 0.65rem', color: '#475569', textDecoration: 'none', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600 }}
              title="Previous Week"
            >
              ← Prev
            </Link>
            <span style={{ padding: '0.35rem 0.75rem', fontWeight: 700, fontSize: '0.8125rem', color: '#0f172a', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
              {weekRangeLabel}
            </span>
            <Link
              href={`/company-admin/timesheets?week=${weekOffset + 1}`}
              style={{ padding: '0.35rem 0.65rem', color: '#475569', textDecoration: 'none', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600 }}
              title="Next Week"
            >
              Next →
            </Link>
          </div>

          {weekOffset !== 0 && (
            <Link
              href="/company-admin/timesheets?week=0"
              style={{ padding: '0.5rem 0.85rem', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}
            >
              This Week
            </Link>
          )}

          {/* Real CSV Export */}
          <ExportCsvButton data={exportData} filename={`timesheet-${getLocalDateStr(monday)}-to-${getLocalDateStr(sunday)}.csv`} />
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Hours This Week</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {formatDuration(totalCompanyWeekSeconds)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Logged across all active members</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active Employees</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            {activeUserSet.size} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>/ {employees.length}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Logged at least 1 session this week</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Entries</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            {timeEntries.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Individual sessions tracked</div>
        </div>
      </div>

      {/* Timesheet Weekly Matrix Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', minWidth: '180px' }}>
                Employee
              </th>
              {weekDays.map(wd => (
                <th
                  key={wd.dateStr}
                  style={{
                    padding: '0.85rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: wd.isToday ? '#2563eb' : '#64748b',
                    textAlign: 'center',
                    borderLeft: '1px solid #f1f5f9',
                    backgroundColor: wd.isToday ? '#eff6ff' : 'transparent',
                  }}
                >
                  <div>{wd.dayName}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: wd.isToday ? 700 : 500, color: wd.isToday ? '#1d4ed8' : '#94a3b8' }}>
                    {wd.label}
                  </div>
                </th>
              ))}
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', textAlign: 'right', borderLeft: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {employeeRows.map(({ user, daySeconds, totalSeconds }) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {/* Employee Info */}
                <td style={{ padding: '0.85rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>
                      {(user.name || user.email).substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                        {user.name || 'Unnamed'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Day-by-Day Hours */}
                {daySeconds.map((secs, idx) => (
                  <td
                    key={idx}
                    style={{
                      padding: '0.85rem 0.5rem',
                      textAlign: 'center',
                      fontSize: '0.8125rem',
                      fontWeight: secs > 0 ? 600 : 400,
                      color: secs > 0 ? '#0f172a' : '#cbd5e1',
                      borderLeft: '1px solid #f1f5f9',
                      backgroundColor: weekDays[idx].isToday ? (secs > 0 ? '#f0fdf4' : '#fafafa') : (secs > 0 ? '#f8fafc' : 'transparent'),
                    }}
                  >
                    {formatHourMin(secs)}
                  </td>
                ))}

                {/* Employee Total */}
                <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 800, fontSize: '0.9375rem', color: totalSeconds > 0 ? '#2563eb' : '#94a3b8', borderLeft: '1px solid #e2e8f0' }}>
                  {formatDuration(totalSeconds)}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>
              <td style={{ padding: '0.85rem 1.25rem', color: '#0f172a', fontSize: '0.875rem' }}>
                Daily Total
              </td>
              {weekDays.map((_, dayIdx) => {
                const dayTotal = employeeRows.reduce((acc, row) => acc + row.daySeconds[dayIdx], 0);
                return (
                  <td
                    key={dayIdx}
                    style={{
                      padding: '0.85rem 0.5rem',
                      textAlign: 'center',
                      fontSize: '0.8125rem',
                      color: dayTotal > 0 ? '#0f172a' : '#94a3b8',
                      borderLeft: '1px solid #f1f5f9',
                    }}
                  >
                    {formatHourMin(dayTotal)}
                  </td>
                );
              })}
              <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', color: '#0f172a', fontSize: '1rem', borderLeft: '1px solid #e2e8f0' }}>
                {formatDuration(totalCompanyWeekSeconds)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
