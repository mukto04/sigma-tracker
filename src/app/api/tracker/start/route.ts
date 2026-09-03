import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, projectId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // For demo purposes, ensure the dummy company and user exist
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({ data: { name: 'Demo Company' } });
    }

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: 'demo@company.com',
          name: 'Demo User',
          password: 'password123',
          companyId: company.id
        }
      });
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
        startTime: body.offlineStartTime ? new Date(body.offlineStartTime) : new Date(),
      },
    });

    // In a real app, we'd fetch the company related to the user properly.
    const userCompany = await prisma.company.findUnique({ where: { id: user.companyId } });

    return NextResponse.json({ 
      success: true, 
      timeEntry,
      idleTimeoutMinutes: userCompany?.idleTimeoutMinutes || 10
    });
  } catch (error) {
    console.error('Failed to start tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
