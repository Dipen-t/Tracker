import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db';
import { tasks } from '../../db/schema';
import { CreateTaskInput, UpdateTaskInput } from './task.validation';
import { groq } from '../../lib/groq';

export class TaskService {
  static async generateTaskDetails(rawInput: string) {
    if (!rawInput || rawInput.trim().length === 0) {
      throw new Error("Input cannot be empty");
    }
    
    const prompt = `You are a helpful productivity assistant. The user wants to create a task with this input: "${rawInput}".
Generate a clearer, more professional task title and a structured description for this task.
Return ONLY a valid JSON object with EXACTLY two keys: "title" and "description". Do not include any other text or markdown formatting.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "openai/gpt-oss-20b",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Failed to generate task details");
    }

    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || rawInput,
        description: parsed.description || null,
      };
    } catch (err) {
      console.error("Failed to parse Groq response:", err);
      return { title: rawInput, description: null };
    }
  }

  static async create(userId: string, data: CreateTaskInput) {
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId,
        title: data.title,
        description: data.description || null,
        status: 'PENDING',
      })
      .returning();

    return newTask;
  }

  static async getAll(userId: string) {
    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.userId, userId),
      orderBy: [desc(tasks.createdAt)],
      with: {
        timeLogs: {
          columns: {
            durationSeconds: true,
          }
        }
      }
    });

    return allTasks.map(task => {
      const { timeLogs, ...rest } = task;
      const totalTime = timeLogs.reduce((acc, log) => acc + (log.durationSeconds || 0), 0);
      return { ...rest, totalTime, hasTimeLogs: timeLogs.length > 0 };
    });
  }

  static async getById(userId: string, taskId: string) {
    const task = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    });

    if (!task) {
      const error: any = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    return task;
  }

  static async update(userId: string, taskId: string, data: UpdateTaskInput) {
    // Verify existence and ownership
    const task = await this.getById(userId, taskId);

    const updateData: any = { ...data, updatedAt: new Date() };

    if (data.status) {
      if (data.status === 'COMPLETED' && task.status !== 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (data.status !== 'COMPLETED' && task.status === 'COMPLETED') {
        updateData.completedAt = null;
      }
    }

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return updatedTask;
  }

  static async delete(userId: string, taskId: string) {
    // Verify existence and ownership
    await this.getById(userId, taskId);

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
      
    return { success: true };
  }
}
