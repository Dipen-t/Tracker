import { db } from '../src/db';
import { users, tasks, timeLogs } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

const DUMMY_TASKS = [
  { title: "Design Landing Page", description: "Create high-fidelity mockups for the new landing page.", status: "COMPLETED" },
  { title: "Implement Authentication", description: "Set up JWT based auth and bcrypt.", status: "COMPLETED" },
  { title: "Database Schema Design", description: "Design Drizzle ORM schema for users, tasks, logs.", status: "COMPLETED" },
  { title: "Build Dashboard Charts", description: "Use Recharts to build advanced analytics.", status: "COMPLETED" },
  { title: "Refactor API Controllers", description: "Clean up error handling and response formatting.", status: "IN_PROGRESS" },
  { title: "Write E2E Tests", description: "Add Cypress tests for the main flows.", status: "PENDING" },
  { title: "Deploy to Production", description: "Set up Vercel and Railway deployments.", status: "PENDING" },
  { title: "Optimize Database Queries", description: "Add missing indexes and optimize joins.", status: "IN_PROGRESS" },
  { title: "User Onboarding Flow", description: "Create a welcome tutorial for new users.", status: "PENDING" },
  { title: "Fix Drag & Drop Bug", description: "Native HTML5 DnD has a glitch on Safari.", status: "COMPLETED" },
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding dummy data...');
  const userEmail = 'dipenntalreja@gmail.com';

  let user = await db.query.users.findFirst({
    where: eq(users.email, userEmail)
  });

  if (!user) {
    console.log(`User ${userEmail} not found. Creating...`);
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [newUser] = await db.insert(users).values({
      name: 'Dipen Talreja',
      email: userEmail,
      password_hash: hashedPassword,
    }).returning();
    user = newUser;
  }

  // Generate tasks
  const createdTaskIds = [];
  
  for (const t of DUMMY_TASKS) {
    // Random created date between 1 and 14 days ago
    const daysAgoCreated = getRandomInt(1, 14);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgoCreated);

    let completedAt = null;
    if (t.status === 'COMPLETED') {
      const daysAgoCompleted = getRandomInt(0, daysAgoCreated - 1);
      completedAt = new Date();
      completedAt.setDate(completedAt.getDate() - daysAgoCompleted);
    }

    const [newTask] = await db.insert(tasks).values({
      userId: user.id,
      title: t.title,
      description: t.description,
      status: t.status as any,
      createdAt,
      updatedAt: createdAt,
      completedAt
    }).returning();

    createdTaskIds.push(newTask.id);
  }

  console.log(`Created ${createdTaskIds.length} dummy tasks.`);

  // Generate time logs
  // Let's create random time logs for the last 14 days
  let logCount = 0;
  for (let i = 0; i < 14; i++) {
    // How many logs on this day? (0 to 4)
    const logsOnDay = getRandomInt(1, 4);
    
    for (let j = 0; j < logsOnDay; j++) {
      const randomTaskId = createdTaskIds[getRandomInt(0, createdTaskIds.length - 1)];
      
      const logDate = new Date();
      logDate.setDate(logDate.getDate() - i);
      // Random start hour
      logDate.setHours(getRandomInt(8, 18), getRandomInt(0, 59), 0, 0);

      // Random duration: 15 mins to 2.5 hours
      const durationSeconds = getRandomInt(15 * 60, 150 * 60);

      const endedAt = new Date(logDate.getTime() + durationSeconds * 1000);

      await db.insert(timeLogs).values({
        userId: user.id,
        taskId: randomTaskId,
        startedAt: logDate,
        endedAt,
        durationSeconds,
        createdAt: logDate,
      });

      logCount++;
    }
  }

  console.log(`Created ${logCount} dummy time logs.`);
  console.log('Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
