import { eq, and, isNull, desc, sql, gte, lte } from 'drizzle-orm';
import { db } from '../../db';
import { timeLogs, tasks } from '../../db/schema';
import { TaskService } from '../tasks/task.service';

export class TimeService {
  static async getAllLogs(userId: string, options: { page: number; limit: number; filter: string }) {
    const { page, limit, filter } = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(timeLogs.userId, userId)];

    // Date filtering logic
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (filter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (filter === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (filter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (filter === 'previous_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    if (startDate && endDate) {
      conditions.push(gte(timeLogs.createdAt, startDate));
      conditions.push(lte(timeLogs.createdAt, endDate));
    }

    const whereClause = and(...conditions);

    // Get paginated data
    const logs = await db.query.timeLogs.findMany({
      where: whereClause,
      with: {
        task: {
          columns: { title: true }
        }
      },
      orderBy: [desc(timeLogs.createdAt)],
      limit,
      offset,
    });

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(timeLogs)
      .where(whereClause);

    const total = Number(countResult.count);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async startTimer(userId: string, taskId: string) {
    // 1. Verify the task belongs to the user
    const task = await TaskService.getById(userId, taskId);

    // 2. Check if the user already has ANY active timer
    const activeTimer = await db.query.timeLogs.findFirst({
      where: and(eq(timeLogs.userId, userId), isNull(timeLogs.endedAt)),
    });

    if (activeTimer) {
      const error: any = new Error('Another timer is already running.');
      error.statusCode = 409;
      throw error;
    }

    // 3. Create the new time log
    const [newLog] = await db
      .insert(timeLogs)
      .values({
        userId,
        taskId,
        startedAt: new Date(),
      })
      .returning();

    // 4. Optionally update task status to IN_PROGRESS if it's PENDING
    if (task.status === 'PENDING') {
      await db
        .update(tasks)
        .set({ status: 'IN_PROGRESS', updatedAt: new Date() })
        .where(eq(tasks.id, taskId));
    }

    return newLog;
  }

  static async stopTimer(userId: string, taskId: string) {
    // 1. Find the active timer for THIS task
    const activeTimer = await db.query.timeLogs.findFirst({
      where: and(
        eq(timeLogs.userId, userId),
        eq(timeLogs.taskId, taskId),
        isNull(timeLogs.endedAt)
      ),
    });

    if (!activeTimer) {
      const error: any = new Error('No active timer found for this task.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Calculate duration
    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - activeTimer.startedAt.getTime()) / 1000);

    // 3. Update the time log
    const [updatedLog] = await db
      .update(timeLogs)
      .set({
        endedAt,
        durationSeconds,
      })
      .where(eq(timeLogs.id, activeTimer.id))
      .returning();

    return updatedLog;
  }

  static async getActiveTimer(userId: string) {
    const activeTimer = await db.query.timeLogs.findFirst({
      where: and(eq(timeLogs.userId, userId), isNull(timeLogs.endedAt)),
      with: {
        task: {
          columns: {
            title: true,
          }
        }
      }
    });

    return activeTimer || null;
  }

  static async getTaskTimeLogs(userId: string, taskId: string) {
    // Verify ownership implicitly or explicitly
    await TaskService.getById(userId, taskId);

    return await db.query.timeLogs.findMany({
      where: and(eq(timeLogs.userId, userId), eq(timeLogs.taskId, taskId)),
      orderBy: [desc(timeLogs.createdAt)],
    });
  }

  static async getTaskTotalTime(userId: string, taskId: string) {
    const logs = await this.getTaskTimeLogs(userId, taskId);
    
    // Aggregate duration
    const totalSeconds = logs.reduce((acc, log) => {
      if (log.durationSeconds) {
        return acc + log.durationSeconds;
      }
      return acc;
    }, 0);

    return { totalSeconds };
  }
}
