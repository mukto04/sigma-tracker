import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { activityMetrics, aggregateAppUsage, totalTrackedSeconds } from '@/lib/tracker-metrics';

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
    const rawOffset = Number(searchParams.get('tzOffset'));
    const timezoneOffsetMinutes = Number.isFinite(rawOffset) && Math.abs(rawOffset) <= 14 * 60
      ? rawOffset
      : 0;
    let targetDate = new Date();
    if (dateParam) {
      const parts = dateParam.split('-');
      if (parts.length !== 3) {
        return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
      }
      // The client sends its Date#getTimezoneOffset(). Convert its local
      // midnight to UTC so tracker days are not split by the Worker timezone.
      targetDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) + timezoneOffsetMinutes * 60_000);
    } else {
      targetDate.setHours(0, 0, 0, 0);
    }
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setTime(targetDate.getTime() + 24 * 60 * 60 * 1000 - 1);
    const today = targetDate; // keeping variable name for compatibility

    // Fetch today's time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: { userId, startTime: { lte: targetDateEnd }, OR: [{ endTime: null }, { endTime: { gte: targetDate } }] }
    });

    // Fetch today's activity logs
    const rawActivityLogs = await prisma.activityLog.findMany({
      where: { userId, createdAt: { gte: targetDate, lte: targetDateEnd } },
      // A tracker sends a sample every few seconds. Keep summary work bounded
      // even for unusually long days or clients that retry offline payloads.
      orderBy: { createdAt: 'desc' },
      take: 1500,
    });
    rawActivityLogs.reverse();

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

    // Bucket once instead of scanning every log 24 times below. This route is
    // polled by each running desktop tracker, so avoiding the O(24 * logs)
    // pass keeps Worker CPU predictable as a company grows.
    const activityLogsByHour = Array.from({ length: 24 }, () => [] as typeof activityLogs);
    for (const log of activityLogs) {
      const localHour = new Date(log.createdAt.getTime() - timezoneOffsetMinutes * 60_000).getUTCHours();
      activityLogsByHour[localHour].push(log);
    }

    // We'll generate an array of 24 hours (00:00 to 23:59)
    const startHour = 0;
    const endHour = 23;
    
    const hourlyTimeLogged = [];
    const hourlyProductivity = [];
    const hourlyApps = [];
    const hourlyDetails: any[] = [];
    const appColors: any = {};
    const globalAppTimes: Record<string, number> = aggregateAppUsage(activityLogs);

    const getRandomColor = (name: string) => {
      if (appColors[name]) return appColors[name];
      const colors = ['#3b82f6', '#f43f5e', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#f97316'];
      const c = colors[Object.keys(appColors).length % colors.length];
      appColors[name] = c;
      return c;
    };

    for (let h = startHour; h <= endHour; h++) {
      let secondsInHour = 0;
      // `targetDate` is the UTC instant of the user's local midnight. Adding
      // the hour keeps time-entry ranges in that same local-day coordinate
      // system, regardless of the Worker runtime timezone.
      const hourStart = new Date(today.getTime() + h * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000 - 1);
      secondsInHour = totalTrackedSeconds(timeEntries, hourStart, hourEnd);
      let timePercent = Math.min(100, Math.floor((secondsInHour / 3600) * 100));
      hourlyTimeLogged.push(timePercent);

      const logsInHour = activityLogsByHour[h];

      let avgProductivity = 0;
      const hourAppMap: any = {};
      
      if (logsInHour.length > 0) {
        avgProductivity = activityMetrics(logsInHour, Math.floor(secondsInHour)).averageScore;
        Object.assign(hourAppMap, aggregateAppUsage(logsInHour));
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
      const hourActivity = activityMetrics(logsInHour, Math.floor(secondsInHour));
      const activeSecs = hourActivity.activeSeconds;
      const idleSecs = hourActivity.idleSeconds;

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
    const totalSecondsToday = totalTrackedSeconds(timeEntries, targetDate, targetDateEnd);

    // Calculate total activity & idle time today (strictly bounded by totalSecondsToday)
    const dailyActivity = activityMetrics(activityLogs, totalSecondsToday);
    const totalActivitySecondsToday = dailyActivity.activeSeconds;
    const totalIdleSecondsToday = dailyActivity.idleSeconds;

    // A rolling ten-minute average prevents the score from jumping with every
    // 10-second sample while keeping it responsive to current work.
    const rollingStart = new Date(Math.max(targetDate.getTime(), Date.now() - 10 * 60 * 1000));
    const rollingEntries = timeEntries.filter((entry) => {
      const end = entry.endTime?.getTime() ?? Date.now();
      return end >= rollingStart.getTime();
    });
    const rollingTrackedSeconds = totalTrackedSeconds(rollingEntries, rollingStart, targetDateEnd);
    const rollingLogs = activityLogs.filter((log) => log.createdAt >= rollingStart);
    const rollingActivityScore = activityMetrics(rollingLogs, rollingTrackedSeconds).averageScore;

    // The daily average remains for reports; the desktop UI uses the rolling
    // value so a single sample cannot dominate the visible percentage.
    const avgActivityScore = dailyActivity.averageScore;

    // Calculate daily totals for the past 7 days and future 7 days (15 days total)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weekEntries = await prisma.timeEntry.findMany({
      where: { userId, startTime: { gte: weekStart } },
      orderBy: { startTime: 'desc' },
      take: 500,
    });

    const getLocalISODate = (d: Date) => {
      const local = new Date(d.getTime() - timezoneOffsetMinutes * 60_000);
      return local.getUTCFullYear() + '-' + String(local.getUTCMonth() + 1).padStart(2, '0') + '-' + String(local.getUTCDate()).padStart(2, '0');
    };
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
        rollingActivityScore,
        weeklyTotals,
        avatarUrl: user?.avatarUrl || null
      }
    });

  } catch (error) {
    console.error('Failed to fetch summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
