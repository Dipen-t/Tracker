import { eq, and, gte } from 'drizzle-orm';
import { db } from '../../db';
import { timeLogs, tasks } from '../../db/schema';

export class DashboardService {
  static async getTodaySummary(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const logs = await db.query.timeLogs.findMany({
      where: and(
        eq(timeLogs.userId, userId),
        gte(timeLogs.startedAt, today)
      ),
      columns: {
        taskId: true,
        durationSeconds: true,
      }
    });

    const uniqueTaskIds = new Set<string>();
    let totalSecondsToday = 0;

    for (const log of logs) {
      if (log.taskId) {
        uniqueTaskIds.add(log.taskId);
      }
      if (log.durationSeconds) {
        totalSecondsToday += log.durationSeconds;
      }
    }

    // Fetch all user tasks to calculate remaining metrics
    const allUserTasks = await db.query.tasks.findMany({
      where: eq(tasks.userId, userId)
    });

    let completedTasksToday = 0;
    let pendingOrInProgress = 0;

    for (const t of allUserTasks) {
      if (t.status === 'PENDING' || t.status === 'IN_PROGRESS') {
        pendingOrInProgress++;
      } else if (t.status === 'COMPLETED' && t.completedAt) {
        const compDate = new Date(t.completedAt);
        compDate.setUTCHours(0,0,0,0);
        if (compDate.getTime() === today.getTime()) {
          completedTasksToday++;
        }
      }
    }

    return {
      totalTimeToday: totalSecondsToday,
      tasksWorkedOnToday: uniqueTaskIds.size,
      completedTasksToday,
      pendingOrInProgress
    };
  }

  static async getWeeklyChartData(userId: string) {
    // Get date 7 days ago
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6); // Include today + 6 previous days

    const logs = await db.query.timeLogs.findMany({
      where: and(
        eq(timeLogs.userId, userId),
        gte(timeLogs.startedAt, startDate)
      ),
      columns: {
        startedAt: true,
        durationSeconds: true,
      }
    });

    // Initialize the last 7 days with 0 hours
    const chartData = [];
    const daysMap = new Map<string, number>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. 'Mon', 'Tue'
      chartData.push({ day: dateStr, hours: 0 });
      daysMap.set(dateStr, i);
    }

    // Aggregate durations by day
    for (const log of logs) {
      if (log.durationSeconds) {
        const logDateStr = new Date(log.startedAt).toLocaleDateString('en-US', { weekday: 'short' });
        const index = daysMap.get(logDateStr);
        if (index !== undefined) {
          // Convert seconds to hours with 2 decimal places
          chartData[index].hours += log.durationSeconds / 3600;
        }
      }
    }

    // Round hours for cleaner chart display
    for (const data of chartData) {
      data.hours = Math.round(data.hours * 10) / 10;
    }

    return chartData;
  }

  static async getAdvancedAnalytics(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Today + previous 6 days

    const fourteenDaysAgo = new Date(sevenDaysAgo);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 7);

    // Fetch all user tasks
    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.userId, userId),
    });

    // Fetch time logs for last 14 days
    const recentLogs = await db.query.timeLogs.findMany({
      where: and(
        eq(timeLogs.userId, userId),
        gte(timeLogs.startedAt, fourteenDaysAgo)
      )
    });

    // 1. Task Status Distribution
    const statusDistribution = [
      { name: 'Pending', value: 0, fill: '#94a3b8' }, // slate-400
      { name: 'In Progress', value: 0, fill: '#3b82f6' }, // blue-500
      { name: 'Completed', value: 0, fill: '#16a34a' } // green-600
    ];

    allTasks.forEach(task => {
      if (task.status === 'PENDING') statusDistribution[0].value++;
      else if (task.status === 'IN_PROGRESS') statusDistribution[1].value++;
      else if (task.status === 'COMPLETED') statusDistribution[2].value++;
    });

    // Filter out 0 value statuses for better UI pie chart display
    const filteredStatusDistribution = statusDistribution.filter(s => s.value > 0);

    // 2. This Week vs Last Week Performance
    const performanceMap = new Map<number, { dayName: string, thisWeek: number, lastWeek: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      performanceMap.set(i, {
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        thisWeek: 0,
        lastWeek: 0
      });
    }

    recentLogs.forEach(log => {
      const logDate = new Date(log.startedAt);
      logDate.setUTCHours(0,0,0,0);
      
      const daysSince14Days = Math.floor((logDate.getTime() - fourteenDaysAgo.getTime()) / (1000 * 3600 * 24));
      if (daysSince14Days >= 0 && daysSince14Days < 7) {
        // Last week
        const dayIndex = daysSince14Days;
        if (performanceMap.has(dayIndex)) {
          performanceMap.get(dayIndex)!.lastWeek += (log.durationSeconds || 0) / 3600;
        }
      } else if (daysSince14Days >= 7 && daysSince14Days < 14) {
        // This week
        const dayIndex = daysSince14Days - 7;
        if (performanceMap.has(dayIndex)) {
          performanceMap.get(dayIndex)!.thisWeek += (log.durationSeconds || 0) / 3600;
        }
      }
    });

    const performanceComparison = Array.from(performanceMap.values()).map(d => ({
      ...d,
      thisWeek: Math.round(d.thisWeek * 10) / 10,
      lastWeek: Math.round(d.lastWeek * 10) / 10
    }));

    // 3. Time Distribution by Task (Top 5)
    // Map tasks to their recent time logs (last 7 days only for relevance)
    const taskTimeMap = new Map<string, number>();
    recentLogs.forEach(log => {
      const logDate = new Date(log.startedAt);
      if (logDate >= sevenDaysAgo) {
        const current = taskTimeMap.get(log.taskId) || 0;
        taskTimeMap.set(log.taskId, current + (log.durationSeconds || 0));
      }
    });

    const timeByTask = Array.from(taskTimeMap.entries())
      .map(([taskId, seconds]) => {
        const task = allTasks.find(t => t.id === taskId);
        return {
          name: task?.title || 'Unknown Task',
          hours: Math.round((seconds / 3600) * 10) / 10
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // 4. Task Completion Trend
    const completionMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      completionMap.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0);
    }

    allTasks.forEach(task => {
      if (task.status === 'COMPLETED' && task.completedAt) {
        const compDate = new Date(task.completedAt);
        compDate.setUTCHours(0,0,0,0);
        if (compDate >= sevenDaysAgo) {
          const key = compDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (completionMap.has(key)) {
            completionMap.set(key, completionMap.get(key)! + 1);
          }
        }
      }
    });

    const completionTrend = Array.from(completionMap.entries()).map(([day, completed]) => ({ day, completed }));

    return {
      statusDistribution: filteredStatusDistribution.length > 0 ? filteredStatusDistribution : statusDistribution,
      performanceComparison,
      timeByTask,
      completionTrend
    };
  }
}
