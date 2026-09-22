import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

let sqliteDb = null;

// Исходные данные дорожной карты 45 недель
export const initialWeeks = [
  { n: 0, stage: 0, title: "Подготовка", topic: "JDK, IntelliJ IDEA, Git, GitHub", project: "Hello Java", tasks: ["Создать Java-проект", "Запустить main", "Первый commit/push"] },
  { n: 1, stage: 1, title: "Синтаксис и переменные", topic: "class, main, println, int, double, String, boolean, Scanner", project: "Калькулятор", tasks: ["Переменные", "Ввод данных", "Арифметика"] },
  { n: 2, stage: 1, title: "Условия", topic: "if, else, switch, &&, ||, !", project: "Угадай число", tasks: ["Сравнения", "Логика", "Ветвление"] },
  { n: 3, stage: 1, title: "Циклы", topic: "for, while, do while, break, continue", project: "Терминальный тренажёр", tasks: ["Циклы", "Меню", "Повторение"] },
  { n: 4, stage: 1, title: "Методы", topic: "void, return, parameters, arguments", project: "Calculator 2.0", tasks: ["Параметры", "Возврат", "Декомпозиция"] },
  { n: 5, stage: 1, title: "Массивы и строки", topic: "arrays, indexes, length, String, char", project: "Анализатор текста", tasks: ["Массивы", "String", "Подсчёт"] },
  { n: 6, stage: 2, title: "ArrayList", topic: "add, remove, get, set, contains, size", project: "To-Do List", tasks: ["Список задач", "CRUD", "Статусы"] },
  { n: 7, stage: 2, title: "HashMap / HashSet", topic: "Map, Set, поиск и уникальность", project: "Телефонная книга", tasks: ["Map", "Set", "Поиск"] },
  { n: 8, stage: 2, title: "ООП: основы", topic: "class, object, fields, methods, constructor, this", project: "Student Management System", tasks: ["Классы", "Объекты", "Конструкторы"] },
  { n: 9, stage: 2, title: "ООП: наследование", topic: "private, getters/setters, extends", project: "Система персонажей", tasks: ["Инкапсуляция", "Наследование", "Переиспользование"] },
  { n: 10, stage: 2, title: "ООП: полиморфизм", topic: "interfaces, abstract, overriding, overloading", project: "Mini Game Engine", tasks: ["Полиморфизм", "Интерфейсы", "Абстракция"] },
  { n: 11, stage: 2, title: "Exceptions", topic: "try, catch, finally, throw, throws", project: "Устойчивые приложения", tasks: ["Обработка ошибок", "Свои исключения"] },
  { n: 12, stage: 2, title: "Files", topic: "Path, Files, чтение и запись", project: "To-Do с сохранением", tasks: ["Файлы", "Сохранение", "Загрузка"] },
  { n: 13, stage: 3, title: "Collections глубже", topic: "List, Set, Map, Queue, Deque", project: "Коллекционный менеджер", tasks: ["Структуры данных", "Выбор коллекции"] },
  { n: 14, stage: 3, title: "Generics", topic: "List<String>, Map<String,Integer>, generic types", project: "Типизированный каталог", tasks: ["Generic-классы", "Generic-методы"] },
  { n: 15, stage: 3, title: "Lambda", topic: "functional interfaces, Predicate, Function, Consumer", project: "Фильтр данных", tasks: ["Lambda", "Functional interfaces"] },
  { n: 16, stage: 3, title: "Stream API", topic: "filter, map, sorted, collect, reduce", project: "Анализатор студентов", tasks: ["Фильтрация", "Сортировка", "Агрегация"] },
  { n: 17, stage: 3, title: "Optional", topic: "null safety и Optional", project: "Безопасный поиск", tasks: ["Optional", "null"] },
  { n: 18, stage: 3, title: "Date & Time", topic: "LocalDate, LocalDateTime, Duration, Period", project: "Система дедлайнов", tasks: ["Даты", "Время", "Расчёты"] },
  { n: 19, stage: 3, title: "Multithreading", topic: "Thread, Runnable, ExecutorService, synchronization", project: "Многопоточный симулятор", tasks: ["Потоки", "Concurrency", "Race condition"] },
  { n: 20, stage: 4, title: "Git и совместная разработка", topic: "clone, add, commit, push, pull, branch, merge", project: "Командный репозиторий", tasks: ["Ветки", "Merge", "Code review"] },
  { n: 21, stage: 5, title: "SQL основы", topic: "таблицы, PK, FK, SELECT, INSERT, UPDATE, DELETE", project: "База студентов", tasks: ["SQL", "CRUD", "Связи"] },
  { n: 22, stage: 5, title: "SQL глубже", topic: "JOIN, indexes, transactions", project: "Система оценок", tasks: ["JOIN", "Индексы", "Транзакции"] },
  { n: 23, stage: 5, title: "JDBC", topic: "Java ↔ PostgreSQL, Connection, PreparedStatement, ResultSet", project: "Student Management DB", tasks: ["Подключение", "CRUD", "Запросы"] },
  { n: 24, stage: 6, title: "Spring / IoC / DI", topic: "Dependency Injection, IoC, Beans", project: "Первое Spring-приложение", tasks: ["Beans", "DI", "Конфигурация"] },
  { n: 25, stage: 6, title: "Spring Boot", topic: "project structure, configuration", project: "Backend starter", tasks: ["Spring Boot", "Properties"] },
  { n: 26, stage: 6, title: "REST API", topic: "GET, POST, PUT, DELETE, HTTP, JSON", project: "Students REST API", tasks: ["Endpoints", "JSON", "CRUD"] },
  { n: 27, stage: 6, title: "Spring Data JPA", topic: "Entity, Repository, Service, Controller", project: "School Backend", tasks: ["JPA", "Repositories", "Layers"] },
  { n: 28, stage: 6, title: "Relationships", topic: "OneToMany, ManyToOne, ManyToMany", project: "School relations", tasks: ["Связи", "Модели"] },
  { n: 29, stage: 7, title: "Security", topic: "authentication, authorization, roles", project: "Role-based API", tasks: ["Roles", "Permissions", "Security"] },
  { n: 30, stage: 7, title: "JWT", topic: "tokens, login, protected endpoints", project: "JWT Auth", tasks: ["Login", "Token", "Protected API"] },
  { n: 31, stage: 8, title: "Frontend basics", topic: "HTML, CSS, JavaScript, JSON, HTTP", project: "API dashboard", tasks: ["Fetch", "DOM", "Forms"] },
  { n: 32, stage: 8, title: "Full-stack integration", topic: "Frontend → REST → Spring → PostgreSQL", project: "School platform v1", tasks: ["Integration", "Errors", "UX"] },
  { n: 33, stage: 9, title: "Docker", topic: "containers, images, compose", project: "Containerized backend", tasks: ["Dockerfile", "Compose"] },
  { n: 34, stage: 9, title: "Testing", topic: "JUnit, Mockito, integration tests", project: "Tested backend", tasks: ["Unit tests", "Mocks", "Coverage"] },
  { n: 35, stage: 9, title: "Architecture", topic: "layers, DTO, validation, clean code", project: "Refactored API", tasks: ["DTO", "Validation", "Architecture"] },
  { n: 36, stage: 9, title: "CI/CD", topic: "build, test, deploy pipeline", project: "CI pipeline", tasks: ["Automation", "Checks"] },
  { n: 37, stage: 10, title: "Большой проект I", topic: "проектирование полноценного приложения", project: "School Management Platform", tasks: ["План", "Database", "Backend"] },
  { n: 38, stage: 10, title: "Большой проект II", topic: "authentication, roles, features", project: "School Management Platform", tasks: ["Security", "Features"] },
  { n: 39, stage: 10, title: "Большой проект III", topic: "frontend, integration, polish", project: "School Management Platform", tasks: ["Frontend", "Integration"] },
  { n: 40, stage: 10, title: "Большой проект IV", topic: "tests, Docker, documentation", project: "Production-ready v1", tasks: ["Tests", "Docker", "README"] },
  { n: 41, stage: 10, title: "Алгоритмы", topic: "arrays, strings, maps, sorting, complexity", project: "Algorithm challenge set", tasks: ["Задачи", "Big O"] },
  { n: 42, stage: 10, title: "Подготовка к стажировке", topic: "GitHub, CV, interview questions", project: "Portfolio pack", tasks: ["README", "CV", "Projects"] },
  { n: 43, stage: 10, title: "Mock interview", topic: "Java Core, OOP, SQL, Spring", project: "Техническое собеседование", tasks: ["Вопросы", "Live coding"] },
  { n: 44, stage: 10, title: "Финальный релиз", topic: "публикация и презентация проекта", project: "Java League Final", tasks: ["Deploy", "Demo", "Retrospective"] }
];

export const initialStages = [
  { n: 0, name: "Подготовка", desc: "Инструменты и первый запуск", range: "0" },
  { n: 1, name: "Java Basics", desc: "Синтаксис, условия, циклы, методы", range: "1–5" },
  { n: 2, name: "Java Core + OOP", desc: "Коллекции, ООП, exceptions, files", range: "6–12" },
  { n: 3, name: "Java Core+", desc: "Generics, Lambda, Streams, concurrency", range: "13–19" },
  { n: 4, name: "Git + командная разработка", desc: "Совместная работа и Git workflow", range: "20" },
  { n: 5, name: "SQL + JDBC", desc: "PostgreSQL и соединение с Java", range: "21–23" },
  { n: 6, name: "Spring Boot", desc: "REST, JPA и backend", range: "24–28" },
  { n: 7, name: "Security", desc: "Auth, roles, JWT", range: "29–30" },
  { n: 8, name: "Frontend basics", desc: "HTML, CSS, JS и интеграция", range: "31–32" },
  { n: 9, name: "Production skills", desc: "Docker, tests, architecture, CI/CD", range: "33–36" },
  { n: 10, name: "Большой проект + Junior prep", desc: "Full-stack, алгоритмы, портфолио", range: "37–44" }
];

export const initialProjects = [
  { icon: "⌘", title: "Калькулятор", category: "Java Basics", desc: "Ввод, переменные и арифметика." },
  { icon: "◉", title: "Угадай число", category: "Java Basics", desc: "Условия, логика и циклы." },
  { icon: "☷", title: "To-Do List", category: "Java Core", desc: "ArrayList и CRUD-операции." },
  { icon: "♙", title: "Student Management", category: "OOP", desc: "Классы, объекты и методы." },
  { icon: "⚔", title: "Mini Game Engine", category: "OOP", desc: "Наследование и полиморфизм." },
  { icon: "▣", title: "Анализатор студентов", category: "Core+", desc: "Streams, filtering, sorting." },
  { icon: "◈", title: "Student Management DB", category: "SQL/JDBC", desc: "Java + PostgreSQL." },
  { icon: "⌁", title: "Students REST API", category: "Spring Boot", desc: "REST CRUD backend." },
  { icon: "♜", title: "School Backend", category: "Spring JPA", desc: "Entity, Repository, Service, Controller." },
  { icon: "◆", title: "JWT Auth", category: "Security", desc: "Роли, login и защищённые endpoints." },
  { icon: "▤", title: "School Platform", category: "Full-stack", desc: "Frontend → API → DB." },
  { icon: "★", title: "Java League Final", category: "Portfolio", desc: "Большой проект + tests + Docker + README." }
];

export async function initDatabase() {
  if (config.db.type === 'postgres') {
    const { initPostgres } = await import('./postgres.js');
    return await initPostgres();
  }

  // SQLite (по умолчанию)
  const dbPath = config.db.sqliteFile;
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA journal_mode = WAL;');

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      hours REAL DEFAULT 0,
      level INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS completed_weeks (
      week_number INTEGER PRIMARY KEY,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_tasks (
      task_key TEXT NOT NULL,
      task_date TEXT NOT NULL,
      completed INTEGER DEFAULT 1,
      PRIMARY KEY (task_key, task_date)
    );

    CREATE TABLE IF NOT EXISTS score_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const checkUser = sqliteDb.prepare('SELECT COUNT(*) as count FROM users;').get();
  if (checkUser.count === 0) {
    const insertUser = sqliteDb.prepare('INSERT INTO users (id, name, points, hours, level) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('you', 'Ты', 0, 0, 0);
    insertUser.run('friend', 'Друг', 0, 0, 0);

    const logScore = sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)');
    logScore.run('you', 0, 'Старт в Java League', new Date().toISOString());
    logScore.run('friend', 0, 'Старт в Java League', new Date().toISOString());
  }

  console.log(`[DB] SQLite подключена успешно (${dbPath})`);
  return sqliteDb;
}

// Репозиторий данных (абстракция над базой)
export const repository = {
  async getFullState(todayStr) {
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      const res = await postgresRepository.getFullState(todayStr);
      return {
        ...res,
        stages: initialStages,
        weeks: initialWeeks,
        projects: initialProjects
      };
    }

    if (!todayStr) {
      todayStr = new Date().toISOString().slice(0, 10);
    }

    const you = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get('you') || { points: 0, hours: 0, level: 0 };
    const friend = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get('friend') || { points: 0, hours: 0, level: 0 };

    const completedRows = sqliteDb.prepare('SELECT week_number FROM completed_weeks ORDER BY week_number ASC').all();
    const completed = completedRows.map(r => r.week_number);

    const taskRows = sqliteDb.prepare('SELECT task_key FROM daily_tasks WHERE task_date = ?').all(todayStr);
    const tasks = {};
    taskRows.forEach(r => { tasks[r.task_key] = true; });

    const recentLogs = sqliteDb.prepare(`
      SELECT id, user_id, points, reason, created_at 
      FROM score_history 
      ORDER BY id DESC 
      LIMIT 15
    `).all();

    return {
      points: you.points || 0,
      friend: friend.points || 0,
      hours: you.hours || 0,
      level: you.level || 0,
      completed,
      tasks,
      scoreHistory: recentLogs,
      stages: initialStages,
      weeks: initialWeeks,
      projects: initialProjects
    };
  },

  async updateLevel(level) {
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      return await postgresRepository.updateLevel(level);
    }
    const lvl = Math.max(0, Math.min(5, Number(level) || 0));
    sqliteDb.prepare('UPDATE users SET level = ? WHERE id = ?').run(lvl, 'you');
    return lvl;
  },

  async addHours(hours) {
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      return await postgresRepository.addHours(hours);
    }
    const delta = Math.max(0, Number(hours) || 0);
    sqliteDb.prepare('UPDATE users SET hours = hours + ? WHERE id = ?').run(delta, 'you');
    const updated = sqliteDb.prepare('SELECT hours FROM users WHERE id = ?').get('you');
    return updated.hours;
  },

  async toggleWeek(weekNumber) {
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      const res = await postgresRepository.toggleWeek(weekNumber);
      return {
        ...res,
        state: {
          ...res.state,
          stages: initialStages,
          weeks: initialWeeks,
          projects: initialProjects
        }
      };
    }

    const num = Number(weekNumber);
    const existing = sqliteDb.prepare('SELECT week_number FROM completed_weeks WHERE week_number = ?').get(num);
    let isCompleted = false;

    if (existing) {
      sqliteDb.prepare('DELETE FROM completed_weeks WHERE week_number = ?').run(num);
      sqliteDb.prepare('UPDATE users SET points = MAX(0, points - 30) WHERE id = ?').run('you');
      sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
        'you', -30, `Снята отметка: Неделя ${num}`, new Date().toISOString()
      );
      isCompleted = false;
    } else {
      sqliteDb.prepare('INSERT INTO completed_weeks (week_number, completed_at) VALUES (?, ?)').run(num, new Date().toISOString());
      sqliteDb.prepare('UPDATE users SET points = points + 30 WHERE id = ?').run('you');
      sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
        'you', 30, `Завершен мини-проект: Неделя ${num}`, new Date().toISOString()
      );
      isCompleted = true;
    }

    const state = await this.getFullState();
    return { isCompleted, state };
  },

  async toggleDailyTask(dateStr, taskKey) {
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      const res = await postgresRepository.toggleDailyTask(dateStr, taskKey);
      return {
        ...res,
        state: {
          ...res.state,
          stages: initialStages,
          weeks: initialWeeks,
          projects: initialProjects
        }
      };
    }

    const existing = sqliteDb.prepare('SELECT 1 FROM daily_tasks WHERE task_key = ? AND task_date = ?').get(taskKey, dateStr);
    let done = false;

    const hourDelta = taskKey === 'practice' ? 1 : 0.5;

    if (existing) {
      sqliteDb.prepare('DELETE FROM daily_tasks WHERE task_key = ? AND task_date = ?').run(taskKey, dateStr);
      sqliteDb.prepare('UPDATE users SET points = MAX(0, points - 10), hours = MAX(0, hours - ?) WHERE id = ?').run(hourDelta, 'you');
      done = false;
    } else {
      sqliteDb.prepare('INSERT INTO daily_tasks (task_key, task_date, completed) VALUES (?, ?, 1)').run(taskKey, dateStr);
      sqliteDb.prepare('UPDATE users SET points = points + 10, hours = hours + ? WHERE id = ?').run(hourDelta, 'you');
      sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
        'you', 10, `Дневная цель: ${taskKey}`, new Date().toISOString()
      );
      done = true;
    }

    return { done, state: await this.getFullState(dateStr) };
  },

  async addScore(userId, deltaPoints, reason) {
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      const res = await postgresRepository.addScore(userId, deltaPoints, reason);
      return {
        ...res,
        stages: initialStages,
        weeks: initialWeeks,
        projects: initialProjects
      };
    }

    const uid = userId === 'friend' ? 'friend' : 'you';
    const delta = Number(deltaPoints) || 0;
    const desc = reason || (delta >= 0 ? `+${delta} XP` : `${delta} XP`);

    if (delta < 0) {
      sqliteDb.prepare('UPDATE users SET points = MAX(0, points + ?) WHERE id = ?').run(delta, uid);
    } else {
      sqliteDb.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(delta, uid);
    }

    sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
      uid, delta, desc, new Date().toISOString()
    );

    return await this.getFullState();
  },

  async resetAll() {
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      const res = await postgresRepository.resetAll();
      return {
        ...res,
        stages: initialStages,
        weeks: initialWeeks,
        projects: initialProjects
      };
    }

    sqliteDb.exec(`
      DELETE FROM completed_weeks;
      DELETE FROM daily_tasks;
      DELETE FROM score_history;
      UPDATE users SET points = 0, hours = 0, level = 0;
    `);
    sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
      'you', 0, 'Сброс прогресса', new Date().toISOString()
    );
    return await this.getFullState();
  }
};

