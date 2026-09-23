/**
 * Адаптер для подключения к PostgreSQL (локальный Postgres, Supabase, Neon.tech, Render и т.д.)
 */

import { config } from '../config.js';
import { initialStages, initialWeeks, initialProjects, resolveUserId } from './db.js';

let pgPool = null;

export async function initPostgres() {
  try {
    const { Pool } = await import('pg');

    const poolConfig = config.db.url
      ? { connectionString: config.db.url, ssl: config.db.url.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined }
      : {
          host: config.db.host,
          port: config.db.port,
          user: config.db.user,
          password: config.db.password,
          database: config.db.database,
        };

    pgPool = new Pool(poolConfig);

    const client = await pgPool.connect();
    console.log('[PostgreSQL] Успешно подключено к базе данных!');

    // Базовые таблицы
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        points INT DEFAULT 0,
        hours NUMERIC(6,1) DEFAULT 0,
        level INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS score_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        points INT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Автоматическая миграция: проверка наличия колонки user_id в completed_weeks и daily_tasks
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'completed_weeks' AND column_name = 'user_id'
        ) THEN
          DROP TABLE IF EXISTS completed_weeks CASCADE;
          CREATE TABLE completed_weeks (
            user_id VARCHAR(50) NOT NULL,
            week_number INT NOT NULL,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, week_number)
          );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'daily_tasks' AND column_name = 'user_id'
        ) THEN
          DROP TABLE IF EXISTS daily_tasks CASCADE;
          CREATE TABLE daily_tasks (
            user_id VARCHAR(50) NOT NULL,
            task_key VARCHAR(50) NOT NULL,
            task_date DATE NOT NULL,
            completed INT DEFAULT 1,
            PRIMARY KEY (user_id, task_key, task_date)
          );
        END IF;
      END $$;
    `);

    // Пользователи Нурик и Санжар
    await client.query(`
      INSERT INTO users (id, name, points, hours, level) VALUES
      ('nurik', 'Нурик', 0, 0, 0),
      ('sanzhar', 'Санжар', 0, 0, 0)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Очистка старых системных пользователей если были
    await client.query(`DELETE FROM users WHERE id IN ('you', 'friend');`);

    client.release();
    return pgPool;
  } catch (err) {
    console.error('[PostgreSQL Error] Не удалось инициализировать Postgres:', err.message);
    throw err;
  }
}

export const postgresRepository = {
  async getAllUsers() {
    const client = await pgPool.connect();
    try {
      const res = await client.query('SELECT id, name, points, hours, level FROM users ORDER BY points DESC');
      return res.rows;
    } finally {
      client.release();
    }
  },

  async getFullState(rawUserId, todayStr) {
    const userId = resolveUserId(rawUserId);
    if (!todayStr) todayStr = new Date().toISOString().slice(0, 10);
    const client = await pgPool.connect();

    try {
      const usersRes = await client.query('SELECT * FROM users');
      const nurik = usersRes.rows.find(u => u.id === 'nurik') || { id: 'nurik', name: 'Нурик', points: 0, hours: 0, level: 0 };
      const sanzhar = usersRes.rows.find(u => u.id === 'sanzhar') || { id: 'sanzhar', name: 'Санжар', points: 0, hours: 0, level: 0 };

      const currentUser = userId === 'sanzhar' ? sanzhar : nurik;
      const otherUser = userId === 'sanzhar' ? nurik : sanzhar;

      const weeksRes = await client.query('SELECT week_number FROM completed_weeks WHERE user_id = $1 ORDER BY week_number ASC', [userId]);
      const completed = weeksRes.rows.map(r => r.week_number);

      const otherWeeksRes = await client.query('SELECT week_number FROM completed_weeks WHERE user_id = $1', [otherUser.id]);
      const otherCompletedCount = otherWeeksRes.rows.length;

      const tasksRes = await client.query('SELECT task_key FROM daily_tasks WHERE user_id = $1 AND task_date = $2', [userId, todayStr]);
      const tasks = {};
      tasksRes.rows.forEach(r => { tasks[r.task_key] = true; });

      const logsRes = await client.query(`
        SELECT sh.id, sh.user_id, u.name as user_name, sh.points, sh.reason, sh.created_at 
        FROM score_history sh
        LEFT JOIN users u ON sh.user_id = u.id
        ORDER BY sh.id DESC 
        LIMIT 15
      `);

      return {
        currentUser,
        otherUser,
        allUsers: [nurik, sanzhar],
        points: parseInt(currentUser.points, 10) || 0,
        friend: parseInt(otherUser.points, 10) || 0,
        hours: parseFloat(currentUser.hours) || 0,
        level: parseInt(currentUser.level, 10) || 0,
        completed,
        otherCompletedCount,
        tasks,
        scoreHistory: logsRes.rows,
        stages: initialStages,
        weeks: initialWeeks,
        projects: initialProjects
      };
    } finally {
      client.release();
    }
  },

  async toggleWeek(userId, weekNumber) {
    const num = Number(weekNumber);
    const userName = userId === 'sanzhar' ? 'Санжар' : 'Нурик';
    const client = await pgPool.connect();

    try {
      const check = await client.query('SELECT week_number FROM completed_weeks WHERE user_id = $1 AND week_number = $2', [userId, num]);
      let isCompleted = false;

      if (check.rows.length > 0) {
        await client.query('DELETE FROM completed_weeks WHERE user_id = $1 AND week_number = $2', [userId, num]);
        await client.query('UPDATE users SET points = GREATEST(0, points - 30) WHERE id = $1', [userId]);
        await client.query('INSERT INTO score_history (user_id, points, reason) VALUES ($1, $2, $3)', [
          userId, -30, `${userName}: снята отметка с недели ${num}`
        ]);
        isCompleted = false;
      } else {
        await client.query('INSERT INTO completed_weeks (user_id, week_number) VALUES ($1, $2)', [userId, num]);
        await client.query('UPDATE users SET points = points + 30 WHERE id = $1', [userId]);
        await client.query('INSERT INTO score_history (user_id, points, reason) VALUES ($1, $2, $3)', [
          userId, 30, `${userName}: сдал мини-проект недели ${num}`
        ]);
        isCompleted = true;
      }

      const state = await this.getFullState(userId);
      return { isCompleted, state };
    } finally {
      client.release();
    }
  },

  async toggleDailyTask(userId, dateStr, taskKey) {
    const client = await pgPool.connect();
    const hourDelta = taskKey === 'practice' ? 1 : 0.5;
    const userName = userId === 'sanzhar' ? 'Санжар' : 'Нурик';
    const taskNames = { theory: 'Теория', practice: 'Практика', review: 'Синхрон' };
    const taskTitle = taskNames[taskKey] || taskKey;

    try {
      const check = await client.query('SELECT 1 FROM daily_tasks WHERE user_id = $1 AND task_key = $2 AND task_date = $3', [userId, taskKey, dateStr]);
      let done = false;

      if (check.rows.length > 0) {
        await client.query('DELETE FROM daily_tasks WHERE user_id = $1 AND task_key = $2 AND task_date = $3', [userId, taskKey, dateStr]);
        await client.query('UPDATE users SET points = GREATEST(0, points - 10), hours = GREATEST(0, hours - $1) WHERE id = $2', [hourDelta, userId]);
        done = false;
      } else {
        await client.query('INSERT INTO daily_tasks (user_id, task_key, task_date, completed) VALUES ($1, $2, $3, 1)', [userId, taskKey, dateStr]);
        await client.query('UPDATE users SET points = points + 10, hours = hours + $1 WHERE id = $2', [hourDelta, userId]);
        await client.query('INSERT INTO score_history (user_id, points, reason) VALUES ($1, 10, $2)', [
          userId, `${userName}: выполнил ${taskTitle}`
        ]);
        done = true;
      }

      const state = await this.getFullState(userId, dateStr);
      return { done, state };
    } finally {
      client.release();
    }
  },

  async addScore(userId, deltaPoints, reason) {
    const delta = Number(deltaPoints) || 0;
    const userName = userId === 'sanzhar' ? 'Санжар' : 'Нурик';
    const desc = reason || (delta >= 0 ? `${userName}: +${delta} XP` : `${userName}: ${delta} XP`);
    const client = await pgPool.connect();

    try {
      if (delta < 0) {
        await client.query('UPDATE users SET points = GREATEST(0, points + $1) WHERE id = $2', [delta, userId]);
      } else {
        await client.query('UPDATE users SET points = points + $1 WHERE id = $2', [delta, userId]);
      }

      await client.query('INSERT INTO score_history (user_id, points, reason) VALUES ($1, $2, $3)', [userId, delta, desc]);
      return await this.getFullState(userId);
    } finally {
      client.release();
    }
  },

  async updateLevel(userId, level) {
    const lvl = Math.max(0, Math.min(5, Number(level) || 0));
    const client = await pgPool.connect();
    try {
      await client.query('UPDATE users SET level = $1 WHERE id = $2', [lvl, userId]);
      return lvl;
    } finally {
      client.release();
    }
  },

  async addHours(userId, hours) {
    const delta = Math.max(0, Number(hours) || 0);
    const client = await pgPool.connect();
    try {
      await client.query('UPDATE users SET hours = hours + $1 WHERE id = $2', [delta, userId]);
      const res = await client.query('SELECT hours FROM users WHERE id = $1', [userId]);
      return parseFloat(res.rows[0].hours);
    } finally {
      client.release();
    }
  },

  async resetAll(userId) {
    const client = await pgPool.connect();
    try {
      if (userId) {
        await client.query('DELETE FROM completed_weeks WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM daily_tasks WHERE user_id = $1', [userId]);
        await client.query('UPDATE users SET points = 0, hours = 0, level = 0 WHERE id = $1', [userId]);
        return await this.getFullState(userId);
      }
      await client.query('TRUNCATE completed_weeks, daily_tasks, score_history');
      await client.query('UPDATE users SET points = 0, hours = 0, level = 0');
      return await this.getFullState('nurik');
    } finally {
      client.release();
    }
  }
};
