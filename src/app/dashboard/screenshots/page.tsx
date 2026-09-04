import { getSession } from '@/lib/auth';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { DatePickerFilter } from '@/components/DatePickerFilter';

export const runtime = 'edge';

import { ScreenshotGrid } from '@/components/ScreenshotGrid';

export default async function ScreenshotsPage({ searchParams }: { searchParams: { date?: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return null;

  // Use selected date or default to today
  const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date();
  
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const screenshots = await prisma.screenshot.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: startOfDay, lte: endOfDay }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>My Screenshots</h2>
        <DatePickerFilter />
      </div>
      
      <ScreenshotGrid screenshots={screenshots} />
    </div>
  );
}
