import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  integer, 
  uniqueIndex, 
  index 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for Task Status
export const statusEnum = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false, mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex('email_idx').on(table.email),
  };
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50, enum: statusEnum }).default('PENDING').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false, mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: false, mode: 'date' }),
}, (table) => {
  return {
    userIdx: index('task_user_idx').on(table.userId),
  };
});

export const timeLogs = pgTable('time_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: false, mode: 'date' }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: false, mode: 'date' }),
  durationSeconds: integer('duration_seconds'),
  createdAt: timestamp('created_at', { withTimezone: false, mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('time_log_user_idx').on(table.userId),
    taskIdx: index('time_log_task_idx').on(table.taskId),
    startedAtIdx: index('time_log_started_at_idx').on(table.startedAt),
  };
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  timeLogs: many(timeLogs),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  timeLogs: many(timeLogs),
}));

export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  user: one(users, {
    fields: [timeLogs.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [timeLogs.taskId],
    references: [tasks.id],
  }),
}));
