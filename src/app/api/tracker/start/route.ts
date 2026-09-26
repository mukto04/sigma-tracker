import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseOfflineDate, requireTrackerUser } from '@/lib/tracker-api';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      userId?: string;
      projectId?: string | null;
      timeEntryId?: string;
      offlineStartTime?: string;
    };
    const { userId, projectId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const auth = await requireTrackerUser(userId, req);
    if ('error' in auth) return auth.error;
    const { user } = auth;

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, companyId: user.companyId },
        select: { id: true },
      });
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    // Close any previous orphaned sessions for this user
    const orphaned = await prisma.timeEntry.findMany({
      where: { userId: user.id, endTime: null }
    });
    
    for (const entry of orphaned) {
      // Find the latest activity log for this session to determine the real end time
      const latestLog = await prisma.activityLog.findFirst({
        where: { 
          userId: user.id, 
          createdAt: { gte: entry.startTime }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      let realEndTime = new Date();
      let duration = 0;
      
      if (latestLog) {
        realEndTime = new Date(latestLog.createdAt.getTime() + 10000); // 10s after last log
        duration = Math.floor((realEndTime.getTime() - entry.startTime.getTime()) / 1000);
        if (duration < 0) duration = 0;
      } else {
        realEndTime = entry.startTime;
      }

      await prisma.timeEntry.update({
        where: { id: entry.id },
        data: { endTime: realEndTime, duration }
      });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...(body.timeEntryId ? { id: body.timeEntryId } : {}),
        userId: user.id,
        projectId: projectId || null,
        startTime: parseOfflineDate(body.offlineStartTime),
      },
    });

    return NextResponse.json({ 
      success: true, 
      timeEntry,
      idleTimeoutMinutes: user.company?.idleTimeoutMinutes || 10
    });
  } catch (error) {
    console.error('Failed to start tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
