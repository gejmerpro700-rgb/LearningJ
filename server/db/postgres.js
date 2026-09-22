/**
 * Адаптер для подключения к PostgreSQL (локальный Postgres, Supabase, Neon.tech и т.д.)
 * 
 * Для активации:
 * 1. Выполните: npm install pg
 * 2. В файле .env укажите:
 *    DB_TYPE=postgres
 *    DATABASE_URL=postgresql://пользователь:пароль@хост:5432/имя_бд
 */

import { config } from '../config.js';

let pgPool = null;

export async function initPostgres() {
  try {
    // Динамический импорт 'pg' (чтобы проект запускался без ошибок, пока pg не установлен)
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

    // Проверка соединения
    const client = await pgPool.connect();
    console.log('[PostgreSQL] Успешно подключено к базе данных!');

    // Автоматическое создание таблиц
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        points INT DEFAULT 0,
        hours NUMERIC(6,1) DEFAULT 0,
        level INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS completed_weeks (
        week_number INT PRIMARY KEY,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_tasks (
        task_key VARCHAR(50) NOT NULL,
        task_date DATE NOT NULL,
        completed INT DEFAULT 1,
        PRIMARY KEY (task_key, task_date)
      );

      CREATE TABLE IF NOT EXISTS score_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        points INT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Начальные пользователи
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO users (id, name, points, hours, level) VALUES
        ('you', 'Ты', 0, 0, 0),
        ('friend', 'Друг', 0, 0, 0);
      `);
      await client.query(`
        INSERT INTO score_history (user_id, points, reason) VALUES
        ('you', 0, 'Старт в Java League'),
        ('friend', 0, 'Старт в Java League');
      `);
    }

    client.release();
    return pgPool;
  } catch (err) {
    console.error('[PostgreSQL Error] Не удалось инициализировать Postgres:', err.message);
    console.warn('[PostgreSQL] Убедитесь, что установлен пакет: npm install pg, и проверен DATABASE_URL в .env');
    throw err;
  }
}

export const postgresRepository = {
  async getFullState(todayStr) {
    if (!todayStr) todayStr = new Date().toISOString().slice(0, 10);
    const client = await pgPool.connect();
    try {
      const usersRes = await client.query('SELECT * FROM users');
      const you = usersRes.rows.find(u => u.id === 'you') || { points: 0, hours: 0, level: 0 };
      const friend = usersRes.rows.find(u => u.id === 'friend') || { points: 0, hours: 0, level: 0 };

      const weeksRes = await client.query('SELECT week_number FROM completed_weeks ORDER BY week_number ASC');
      const completed = weeksRes.rows.map(r => r.week_number);

      const tasksRes = await client.query('SELECT task_key FROM daily_tasks WHERE task_date = $1', [todayStr]);
      const tasks = {};
      tasksRes.rows.forEach(r => { tasks[r.task_key] = true; });

      const logsRes = await client.query(`
        SELECT id, user_id, points, reason, created_at 
        FROM score_history 
        ORDER BY id DESC 
        LIMIT 15
      `);

      return {
        points: parseInt(you.points, 10) || 0,
        friend: parseInt(friend.points, 10) || 0,
        hours: parseFloat(you.hours) || 0,
        level: parseInt(you.level, 10) || 0,
        completed,
        tasks,
        scoreHistory: logsRes.rows
      };
    } finally {
      client.release();
    }
  },

  async toggleWeek(weekNumber) {
    const num = Number(weekNumber);
    const client = await pgPool.connect();
    try {
      const check = await client.query('SELECT week_number FROM completed_weeks WHERE week_number = $1', [num]);
      let isCompleted = false;

      if (check.rows.length > 0) {
        await client.query('DELETE FROM completed_weeks WHERE week_number = $1', [num]);
        await client.query('UPDATE users SET points = GREATEST(0, points - 30) WHERE id = $1', ['you']);
        await client.query('INSERT INTO score_history (user_id, points, reason) VALUES ($1, $2, $3)', [
          'you', -30, `Снята отметка: Неделя ${num}`
        ]);
        isCompleted = false;
      } else {
        await client.query('INSERT INTO completed_weeks (week_number) VALUES ($1)', [num]);
        await client.query('UPDATE users SET points = points + 30 WHERE id = $1', ['you']);
        await client.query('INSERT INTO score_history (user_id, points, reason) VALUES ($1, $2, $3)', [
          'you', 30, `Завершен мини-проект: Неделя ${num}`
        ]);
        isCompleted = true;
      }

      const state = await this.getFullState();
      return { isCompleted, state };
    } finally {
      client.release();
    }
  },

  async toggleDailyTask(dateStr, taskKey) {
    const client = await pgPool.connect();
    const hourDelta = taskKey === 'practice' ? 1 : 0.5;
    try {
      const check = await client.query('SELECT 1 FROM daily_tasks WHERE task_key = $1 AND task_date = $2', [taskKey, dateStr]);
      let done = false;

      if (check.rows.length > 0) {
        await client.query('DELETE FROM daily_tasks WHERE task_key = $1 AND task_date = $2', [taskKey, dateStr]);
        await client.query('UPDATE users SET points = GREATEST(0, points - 10), hours = GREATEST(0, hours - $1) WHERE id = $2', [hourDelta, 'you']);
        done = false;
      } else {
        await client.query('INSERT INTO daily_tasks (task_key, task_date, completed) VALUES ($1, $2, 1)', [taskKey, dateStr]);
        await client.query('UPDATE users SET points = points + 10, hours = hours + $1 WHERE id = $2', [hourDelta, 'you']);
        await client.query('INSERT INTO score_history (user_id, points, reason) VALUES ($1, 10, $2)', [
          'you', `Дневная цель: ${taskKey}`
        ]);
        done = true;
      }

      const state = await this.getFullState(dateStr);
      return { done, state };
    } finally {
      client.release();
    }
  },

  async addScore(userId, deltaPoints, reason) {
    const uid = userId === 'friend' ? 'friend' : 'you';
    const delta = Number(deltaPoints) || 0;
    const desc = reason || (delta >= 0 ? `+${delta} XP` : `${delta} XP`);
    const client = await pgPool.connect();

    try {
      if (delta < 0) {
        await client.query('UPDATE users SET points = GREATEST(0, points + $1) WHERE id = $2', [delta, uid]);
      } else {
        await client.query('UPDATE users SET points = points + $1 WHERE id = $2', [delta, uid]);
      }

      await client.query('INSERT INTO score_history (user_id, points, reason) VALUES ($1, $2, $3)', [uid, delta, desc]);
      return await this.getFullState();
    } finally {
      client.release();
    }
  },

  async updateLevel(level) {
    const lvl = Math.max(0, Math.min(5, Number(level) || 0));
    const client = await pgPool.connect();
    try {
      await client.query('UPDATE users SET level = $1 WHERE id = $2', [lvl, 'you']);
      return lvl;
    } finally {
      client.release();
    }
  },

  async addHours(hours) {
    const delta = Math.max(0, Number(hours) || 0);
    const client = await pgPool.connect();
    try {
      await client.query('UPDATE users SET hours = hours + $1 WHERE id = $2', [delta, 'you']);
      const res = await client.query('SELECT hours FROM users WHERE id = $1', ['you']);
      return parseFloat(res.rows[0].hours);
    } finally {
      client.release();
    }
  },

  async resetAll() {
    const client = await pgPool.connect();
    try {
      await client.query('TRUNCATE completed_weeks, daily_tasks, score_history');
      await client.query('UPDATE users SET points = 0, hours = 0, level = 0');
      await client.query('INSERT INTO score_history (user_id, points, reason) VALUES ($1, 0, $2)', ['you', 'Сброс прогресса']);
      return await this.getFullState();
    } finally {
      client.release();
    }
  }
};

