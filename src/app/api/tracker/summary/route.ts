import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    let targetDate = new Date();
    if (dateParam) {
      const parts = dateParam.split('-');
      targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0, 0);
    } else {
      targetDate.setHours(0, 0, 0, 0);
    }
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);
    const today = targetDate; // keeping variable name for compatibility

    // Fetch today's time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: { userId, startTime: { gte: targetDate, lte: targetDateEnd } }
    });

    // Fetch today's activity logs
    const rawActivityLogs = await prisma.activityLog.findMany({
      where: { userId, createdAt: { gte: targetDate, lte: targetDateEnd } }
    });

    // Filter activity logs so ONLY logs that fall inside valid timeEntries (duration > 0 or ongoing) are kept
    const activityLogs = rawActivityLogs.filter(log => {
      const logTime = new Date(log.createdAt).getTime();
      return timeEntries.some(entry => {
        if (entry.duration === 0) return false;
        const entryStart = new Date(entry.startTime).getTime();
        const entryEnd = entry.endTime ? new Date(entry.endTime).getTime() : Date.now();
        return logTime >= (entryStart - 5000) && logTime <= (entryEnd + 5000);
      });
    });

    // We'll generate an array of 24 hours (00:00 to 23:59)
    const startHour = 0;
    const endHour = 23;
    
    const hourlyTimeLogged = [];
    const hourlyProductivity = [];
    const hourlyApps = [];
    const hourlyDetails: any[] = [];
    const appColors: any = {};
    const globalAppTimes: any = {};

    const getRandomColor = (name: string) => {
      if (appColors[name]) return appColors[name];
      const colors = ['#3b82f6', '#f43f5e', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#f97316'];
      const c = colors[Object.keys(appColors).length % colors.length];
      appColors[name] = c;
      return c;
    };

    for (let h = startHour; h <= endHour; h++) {
      let secondsInHour = 0;
      timeEntries.forEach(entry => {
        const entryStart = new Date(entry.startTime).getTime();
        const entryEnd = entry.endTime ? new Date(entry.endTime).getTime() : Date.now();
        
        const hourStart = new Date(today);
        hourStart.setHours(h, 0, 0, 0);
        const hourStartMs = hourStart.getTime();
        
        const hourEnd = new Date(today);
        hourEnd.setHours(h, 59, 59, 999);
        const hourEndMs = hourEnd.getTime();

        const overlapStart = Math.max(entryStart, hourStartMs);
        const overlapEnd = Math.min(entryEnd, hourEndMs);

        if (overlapEnd > overlapStart) {
          secondsInHour += (overlapEnd - overlapStart) / 1000;
        }
      });
      let timePercent = Math.min(100, Math.floor((secondsInHour / 3600) * 100));
      hourlyTimeLogged.push(timePercent);

      const logsInHour = activityLogs.filter(log => {
        const logHour = new Date(log.createdAt).getHours();
        return logHour === h;
      });

      let avgProductivity = 0;
      const hourAppMap: any = {};
      
      if (logsInHour.length > 0) {
        const sum = logsInHour.reduce((acc, log) => acc + log.productivityScore, 0);
        avgProductivity = Math.floor(sum / logsInHour.length);

        logsInHour.forEach(log => {
          try {
            const apps = JSON.parse(log.activeApps || '[]');
            apps.forEach((a: any) => {
              hourAppMap[a.name] = (hourAppMap[a.name] || 0) + a.duration;
              globalAppTimes[a.name] = (globalAppTimes[a.name] || 0) + a.duration;
            });
          } catch(e) {}
        });
      }
      hourlyProductivity.push(avgProductivity);

      // Distribute hourAppMap to height percentages (relative to time logged)
      const hourTotalAppSeconds = Object.values(hourAppMap).reduce((a: any, b: any) => a + b, 0) as number;
      if (hourTotalAppSeconds > 0 && timePercent > 0) {
        const appsData = Object.keys(hourAppMap).map(name => ({
           p: Math.floor((hourAppMap[name] / hourTotalAppSeconds) * timePercent),
           color: getRandomColor(name)
        }));
        hourlyApps.push(appsData);
      } else {
        hourlyApps.push([]);
      }

      // Calculate active vs idle seconds for this hour
      const activeLogsInHour = logsInHour.filter(l => l.productivityScore > 0).length;
      const rawActiveSecs = activeLogsInHour * 10;
      const activeSecs = Math.min(Math.floor(secondsInHour), rawActiveSecs);
      const idleSecs = Math.max(0, Math.floor(secondsInHour) - activeSecs);

      const appsDetailedList = Object.keys(hourAppMap).map(name => ({
        name,
        duration: hourAppMap[name],
        color: getRandomColor(name)
      })).sort((a, b) => b.duration - a.duration);

      hourlyDetails.push({
        hour: h,
        hourLabel: `${String(h).padStart(2, '0')}:00`,
        loggedSeconds: Math.floor(secondsInHour),
        activeSeconds: activeSecs,
        idleSeconds: idleSecs,
        apps: appsDetailedList
      });
    }

    const totalAppSeconds = Object.values(globalAppTimes).reduce((a: any, b: any) => a + b, 0) as number;
    const topApps = Object.keys(globalAppTimes)
      .map(name => ({
        name: name.substring(0, 2).toUpperCase(),
        fullName: name,
        color: getRandomColor(name) + '33', // faded background
        textColor: getRandomColor(name),
        percent: Math.floor((globalAppTimes[name] / totalAppSeconds) * 100)
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);

    // Calculate total time logged today
    let totalSecondsToday = 0;
    
    // Sort by startTime descending (newest first)
    timeEntries.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    timeEntries.forEach((entry, index) => {
      if (entry.duration !== null) {
        totalSecondsToday += entry.duration;
      } else if (index === 0) {
        // Only the absolute latest entry can be ongoing.
        let ongoing = Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000);
        if (ongoing > 24 * 3600) ongoing = 0; // If it's over 24 hours, it's an orphaned crashed session
        totalSecondsToday += ongoing;
      }
    });

    // Calculate total activity & idle time today (strictly bounded by totalSecondsToday)
    const activeLogsCount = activityLogs.filter(log => log.productivityScore > 0).length;
    const rawActivitySeconds = activeLogsCount * 10;
    const totalActivitySecondsToday = Math.min(totalSecondsToday, rawActivitySeconds);
    const totalIdleSecondsToday = Math.max(0, totalSecondsToday - totalActivitySecondsToday);

    // Calculate average activity percentage score today
    const avgActivityScore = activityLogs.length > 0
      ? Math.round(activityLogs.reduce((acc, l) => acc + l.productivityScore, 0) / activityLogs.length)
      : 0;

    // Calculate daily totals for the past 7 days and future 7 days (15 days total)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weekEntries = await prisma.timeEntry.findMany({
      where: { userId, startTime: { gte: weekStart } }
    });

    const getLocalISODate = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const todayLocalStr = getLocalISODate(today);

    const weeklyTotals: { date: string; seconds: number }[] = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalISODate(d);
      
      let daySeconds = 0;
      weekEntries.forEach(entry => {
        const eStart = new Date(entry.startTime);
        if (getLocalISODate(eStart) === dateStr) {
          daySeconds += entry.duration || 0;
          // Add ongoing time if it's today and duration is null
          if (entry.duration === null && dateStr === todayLocalStr) {
             let ongoing = Math.floor((Date.now() - eStart.getTime()) / 1000);
             if (ongoing > 12 * 3600) ongoing = 0;
             daySeconds += ongoing;
          }
        }
      });
      weeklyTotals.push({ date: dateStr, seconds: daySeconds });
    }

    return NextResponse.json({
      success: true,
      data: {
        hourlyTimeLogged,
        hourlyProductivity,
        hourlyApps,
        hourlyDetails,
        topApps,
        totalSecondsToday,
        totalActivitySecondsToday,
        totalIdleSecondsToday,
        avgActivityScore,
        weeklyTotals,
        avatarUrl: user?.avatarUrl || null
      }
    });

  } catch (error) {
    console.error('Failed to fetch summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
