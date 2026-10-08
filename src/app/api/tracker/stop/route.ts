import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseOfflineDate, requireTrackerUser } from '@/lib/tracker-api';


export async function POST(req: Request) {
  try {
    const body = await req.json() as { timeEntryId?: string; offlineEndTime?: string };
    const { timeEntryId } = body;

    if (!timeEntryId) {
      return NextResponse.json({ error: 'Missing timeEntryId' }, { status: 400 });
    }

    const auth = await requireTrackerUser(undefined, req);
    if ('error' in auth) return auth.error;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: timeEntryId }
    });

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    if (timeEntry.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const endTime = parseOfflineDate(body.offlineEndTime);
    const durationInSeconds = Math.floor((endTime.getTime() - timeEntry.startTime.getTime()) / 1000);

    if (durationInSeconds <= 0) {
      await prisma.timeEntry.delete({ where: { id: timeEntryId } });
      return NextResponse.json({ success: true, timeEntry: { ...timeEntry, endTime, duration: 0 } });
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        endTime,
        duration: durationInSeconds
      },
    });

    return NextResponse.json({ success: true, timeEntry: updatedEntry });
  } catch (error) {
    console.error('Failed to stop tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
