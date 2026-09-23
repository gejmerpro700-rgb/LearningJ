import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

let sqliteDb = null;

// Исходные данные дорожной карты 45 недель
export const initialWeeks = [
  {n:0, stage:0, title:"Подготовка", topic:"JDK, IntelliJ IDEA, Git, GitHub", project:"Hello Java", tasks:["Создать Java-проект","Запустить main","Первый commit/push"]},
  {n:1, stage:1, title:"Синтаксис и переменные", topic:"class, main, println, int, double, String, boolean, Scanner", project:"Калькулятор", tasks:["Переменные","Ввод данных","Арифметика"]},
  {n:2, stage:1, title:"Условия", topic:"if, else, switch, &&, ||, !", project:"Угадай число", tasks:["Сравнения","Логика","Ветвление"]},
  {n:3, stage:1, title:"Циклы", topic:"for, while, do while, break, continue", project:"Терминальный тренажёр", tasks:["Циклы","Меню","Повторение"]},
  {n:4, stage:1, title:"Методы", topic:"void, return, parameters, arguments", project:"Calculator 2.0", tasks:["Параметры","Возврат","Декомпозиция"]},
  {n:5, stage:1, title:"Массивы и строки", topic:"arrays, indexes, length, String, char", project:"Анализатор текста", tasks:["Массивы","String","Подсчёт"]},
  {n:6, stage:2, title:"ArrayList", topic:"add, remove, get, set, contains, size", project:"To-Do List", tasks:["Список задач","CRUD","Статусы"]},
  {n:7, stage:2, title:"HashMap / HashSet", topic:"Map, Set, поиск и уникальность", project:"Телефонная книга", tasks:["Map","Set","Поиск"]},
  {n:8, stage:2, title:"ООП: основы", topic:"class, object, fields, methods, constructor, this", project:"Student Management System", tasks:["Классы","Объекты","Конструкторы"]},
  {n:9, stage:2, title:"ООП: наследование", topic:"private, getters/setters, extends", project:"Система персонажей", tasks:["Инкапсуляция","Наследование","Переиспользование"]},
  {n:10, stage:2, title:"ООП: полиморфизм", topic:"interfaces, abstract, overriding, overloading", project:"Mini Game Engine", tasks:["Полиморфизм","Интерфейсы","Абстракция"]},
  {n:11, stage:2, title:"Exceptions", topic:"try, catch, finally, throw, throws", project:"Устойчивые приложения", tasks:["Обработка ошибок","Свои исключения"]},
  {n:12, stage:2, title:"Files", topic:"Path, Files, чтение и запись", project:"To-Do с сохранением", tasks:["Файлы","Сохранение","Загрузка"]},
  {n:13, stage:3, title:"Collections глубже", topic:"List, Set, Map, Queue, Deque", project:"Коллекционный менеджер", tasks:["Структуры данных","Выбор коллекции"]},
  {n:14, stage:3, title:"Generics", topic:"List<String>, Map<String,Integer>, generic types", project:"Типизированный каталог", tasks:["Generic-классы","Generic-методы"]},
  {n:15, stage:3, title:"Lambda", topic:"functional interfaces, Predicate, Function, Consumer", project:"Фильтр данных", tasks:["Lambda","Functional interfaces"]},
  {n:16, stage:3, title:"Stream API", topic:"filter, map, sorted, collect, reduce", project:"Анализатор студентов", tasks:["Фильтрация","Сортировка","Агрегация"]},
  {n:17, stage:3, title:"Optional", topic:"null safety и Optional", project:"Безопасный поиск", tasks:["Optional","null"]},
  {n:18, stage:3, title:"Date & Time", topic:"LocalDate, LocalDateTime, Duration, Period", project:"Система дедлайнов", tasks:["Даты","Время","Расчёты"]},
  {n:19, stage:3, title:"Multithreading", topic:"Thread, Runnable, ExecutorService, synchronization", project:"Многопоточный симулятор", tasks:["Потоки","Concurrency","Race condition"]},
  {n:20, stage:4, title:"Git и совместная разработка", topic:"clone, add, commit, push, pull, branch, merge", project:"Командный репозиторий", tasks:["Ветки","Merge","Code review"]},
  {n:21, stage:5, title:"SQL основы", topic:"таблицы, PK, FK, SELECT, INSERT, UPDATE, DELETE", project:"База студентов", tasks:["SQL","CRUD","Связи"]},
  {n:22, stage:5, title:"SQL глубже", topic:"JOIN, indexes, transactions", project:"Система оценок", tasks:["JOIN","Индексы","Транзакции"]},
  {n:23, stage:5, title:"JDBC", topic:"Java ↔ PostgreSQL, Connection, PreparedStatement, ResultSet", project:"Student Management DB", tasks:["Подключение","CRUD","Запросы"]},
  {n:24, stage:6, title:"Spring / IoC / DI", topic:"Dependency Injection, IoC, Beans", project:"Первое Spring-приложение", tasks:["Beans","DI","Конфигурация"]},
  {n:25, stage:6, title:"Spring Boot", topic:"project structure, configuration", project:"Backend starter", tasks:["Spring Boot","Properties"]},
  {n:26, stage:6, title:"REST API", topic:"GET, POST, PUT, DELETE, HTTP, JSON", project:"Students REST API", tasks:["Endpoints","JSON","CRUD"]},
  {n:27, stage:6, title:"Spring Data JPA", topic:"Entity, Repository, Service, Controller", project:"School Backend", tasks:["JPA","Repositories","Layers"]},
  {n:28, stage:6, title:"Relationships", topic:"OneToMany, ManyToOne, ManyToMany", project:"School relations", tasks:["Связи","Модели"]},
  {n:29, stage:7, title:"Security", topic:"authentication, authorization, roles", project:"Role-based API", tasks:["Roles","Permissions","Security"]},
  {n:30, stage:7, title:"JWT", topic:"tokens, login, protected endpoints", project:"JWT Auth", tasks:["Login","Token","Protected API"]},
  {n:31, stage:8, title:"Frontend basics", topic:"HTML, CSS, JavaScript, JSON, HTTP", project:"API dashboard", tasks:["Fetch","DOM","Forms"]},
  {n:32, stage:8, title:"Full-stack integration", topic:"Frontend → REST → Spring → PostgreSQL", project:"School platform v1", tasks:["Integration","Errors","UX"]},
  {n:33, stage:9, title:"Docker", topic:"containers, images, compose", project:"Containerized backend", tasks:["Dockerfile","Compose"]},
  {n:34, stage:9, title:"Testing", topic:"JUnit, Mockito, integration tests", project:"Tested backend", tasks:["Unit tests","Mocks","Coverage"]},
  {n:35, stage:9, title:"Architecture", topic:"layers, DTO, validation, clean code", project:"Refactored API", tasks:["DTO","Validation","Architecture"]},
  {n:36, stage:9, title:"CI/CD", topic:"build, test, deploy pipeline", project:"CI pipeline", tasks:["Automation","Checks"]},
  {n:37, stage:10, title:"Большой проект I", topic:"проектирование полноценного приложения", project:"School Management Platform", tasks:["План","Database","Backend"]},
  {n:38, stage:10, title:"Большой проект II", topic:"authentication, roles, features", project:"School Management Platform", tasks:["Security","Features"]},
  {n:39, stage:10, title:"Большой проект III", topic:"frontend, integration, polish", project:"School Management Platform", tasks:["Frontend","Integration"]},
  {n:40, stage:10, title:"Большой проект IV", topic:"tests, Docker, documentation", project:"Production-ready v1", tasks:["Tests","Docker","README"]},
  {n:41, stage:10, title:"Алгоритмы", topic:"arrays, strings, maps, sorting, complexity", project:"Algorithm challenge set", tasks:["Задачи","Big O"]},
  {n:42, stage:10, title:"Подготовка к стажировке", topic:"GitHub, CV, interview questions", project:"Portfolio pack", tasks:["README","CV","Projects"]},
  {n:43, stage:10, title:"Mock interview", topic:"Java Core, OOP, SQL, Spring", project:"Техническое собеседование", tasks:["Вопросы","Live coding"]},
  {n:44, stage:10, title:"Финальный релиз", topic:"публикация и презентация проекта", project:"Java League Final", tasks:["Deploy","Demo","Retrospective"]}
];

export const initialStages = [
  {n:0,name:"Подготовка",desc:"Инструменты и первый запуск",range:"0"},
  {n:1,name:"Java Basics",desc:"Синтаксис, условия, циклы, методы",range:"1–5"},
  {n:2,name:"Java Core + OOP",desc:"Коллекции, ООП, exceptions, files",range:"6–12"},
  {n:3,name:"Java Core+",desc:"Generics, Lambda, Streams, concurrency",range:"13–19"},
  {n:4,name:"Git + командная разработка",desc:"Совместная работа и Git workflow",range:"20"},
  {n:5,name:"SQL + JDBC",desc:"PostgreSQL и соединение с Java",range:"21–23"},
  {n:6,name:"Spring Boot",desc:"REST, JPA и backend",range:"24–28"},
  {n:7,name:"Security",desc:"Auth, roles, JWT",range:"29–30"},
  {n:8,name:"Frontend basics",desc:"HTML, CSS, JS и интеграция",range:"31–32"},
  {n:9,name:"Production skills",desc:"Docker, tests, architecture, CI/CD",range:"33–36"},
  {n:10,name:"Большой проект + Junior prep",desc:"Full-stack, алгоритмы, портфолио",range:"37–44"}
];

export const initialProjects = [
  {icon:"⌘", title:"Калькулятор", category:"Java Basics", desc:"Ввод, переменные и арифметика."},
  {icon:"◉", title:"Угадай число", category:"Java Basics", desc:"Условия, логика и циклы."},
  {icon:"☷", title:"To-Do List", category:"Java Core", desc:"ArrayList и CRUD-операции."},
  {icon:"♙", title:"Student Management", category:"OOP", desc:"Классы, объекты и методы."},
  {icon:"⚔", title:"Mini Game Engine", category:"OOP", desc:"Наследование и полиморфизм."},
  {icon:"▣", title:"Анализатор студентов", category:"Core+", desc:"Streams, filtering, sorting."},
  {icon:"◈", title:"Student Management DB", category:"SQL/JDBC", desc:"Java + PostgreSQL."},
  {icon:"⌁", title:"Students REST API", category:"Spring Boot", desc:"REST CRUD backend."},
  {icon:"♜", title:"School Backend", category:"Spring JPA", desc:"Entity, Repository, Service, Controller."},
  {icon:"◆", title:"JWT Auth", category:"Security", desc:"Роли, login и защищённые endpoints."},
  {icon:"▤", title:"School Platform", category:"Full-stack", desc:"Frontend → API → DB."},
  {icon:"★", title:"Java League Final", category:"Portfolio", desc:"Большой проект + tests + Docker + README."}
];

// Нормализация имени пользователя: "Нурик" -> "nurik", "Санжар" -> "sanzhar"
export function resolveUserId(input) {
  if (!input) return 'nurik';
  const clean = String(input).trim().toLowerCase();
  if (clean.includes('санжар') || clean.includes('sanzhar') || clean.includes('саня') || clean === 's') {
    return 'sanzhar';
  }
  return 'nurik';
}

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

  // Создание/обновление таблиц
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      hours REAL DEFAULT 0,
      level INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS score_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Проверка миграции completed_weeks (наличие user_id)
  try {
    const weekCols = sqliteDb.prepare("PRAGMA table_info(completed_weeks);").all();
    const hasUserIdInWeeks = weekCols.some(c => c.name === 'user_id');
    if (weekCols.length > 0 && !hasUserIdInWeeks) {
      sqliteDb.exec(`DROP TABLE completed_weeks;`);
    }
  } catch {}

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS completed_weeks (
      user_id TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (user_id, week_number)
    );
  `);

  // Проверка миграции daily_tasks (наличие user_id)
  try {
    const taskCols = sqliteDb.prepare("PRAGMA table_info(daily_tasks);").all();
    const hasUserIdInTasks = taskCols.some(c => c.name === 'user_id');
    if (taskCols.length > 0 && !hasUserIdInTasks) {
      sqliteDb.exec(`DROP TABLE daily_tasks;`);
    }
  } catch {}

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS daily_tasks (
      user_id TEXT NOT NULL,
      task_key TEXT NOT NULL,
      task_date TEXT NOT NULL,
      completed INTEGER DEFAULT 1,
      PRIMARY KEY (user_id, task_key, task_date)
    );
  `);

  // Инициализация пользователей Нурик и Санжар
  const checkNurik = sqliteDb.prepare("SELECT * FROM users WHERE id = 'nurik'").get();
  if (!checkNurik) {
    sqliteDb.prepare("INSERT INTO users (id, name, points, hours, level) VALUES (?, ?, ?, ?, ?)").run('nurik', 'Нурик', 0, 0, 0);
  }

  const checkSanzhar = sqliteDb.prepare("SELECT * FROM users WHERE id = 'sanzhar'").get();
  if (!checkSanzhar) {
    sqliteDb.prepare("INSERT INTO users (id, name, points, hours, level) VALUES (?, ?, ?, ?, ?)").run('sanzhar', 'Санжар', 0, 0, 0);
  }

  // Удаляем старые записи 'you'/'friend' если были
  sqliteDb.exec("DELETE FROM users WHERE id IN ('you', 'friend');");

  console.log(`[DB] SQLite подключена успешно (${dbPath}). Пользователи: Нурик & Санжар.`);
  return sqliteDb;
}

// Репозиторий данных (абстракция над базой)
export const repository = {
  async getAllUsers() {
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      return await postgresRepository.getAllUsers();
    }
    const rows = sqliteDb.prepare('SELECT id, name, points, hours, level FROM users ORDER BY points DESC').all();
    return rows;
  },

  async getFullState(rawUserId, todayStr) {
    const userId = resolveUserId(rawUserId);

    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      const res = await postgresRepository.getFullState(userId, todayStr);
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

    const nurik = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get('nurik') || { id: 'nurik', name: 'Нурик', points: 0, hours: 0, level: 0 };
    const sanzhar = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get('sanzhar') || { id: 'sanzhar', name: 'Санжар', points: 0, hours: 0, level: 0 };

    const currentUser = userId === 'sanzhar' ? sanzhar : nurik;
    const otherUser = userId === 'sanzhar' ? nurik : sanzhar;

    // Сданные недели текущего пользователя
    const completedRows = sqliteDb.prepare('SELECT week_number FROM completed_weeks WHERE user_id = ? ORDER BY week_number ASC').all(userId);
    const completed = completedRows.map(r => r.week_number);

    // Сданные недели другого пользователя (для счетчика на лидерборде)
    const otherCompletedRows = sqliteDb.prepare('SELECT week_number FROM completed_weeks WHERE user_id = ?').all(otherUser.id);
    const otherCompleted = otherCompletedRows.map(r => r.week_number);

    // Задачи текущего пользователя на сегодня
    const taskRows = sqliteDb.prepare('SELECT task_key FROM daily_tasks WHERE user_id = ? AND task_date = ?').all(userId, todayStr);
    const tasks = {};
    taskRows.forEach(r => { tasks[r.task_key] = true; });

    // Общая лента истории очков (последние 15 событий обоих пользователей)
    const recentLogs = sqliteDb.prepare(`
      SELECT sh.id, sh.user_id, u.name as user_name, sh.points, sh.reason, sh.created_at 
      FROM score_history sh
      LEFT JOIN users u ON sh.user_id = u.id
      ORDER BY sh.id DESC 
      LIMIT 15
    `).all();

    return {
      currentUser,
      otherUser,
      allUsers: [nurik, sanzhar],
      // Обратная совместимость для клиента
      points: currentUser.points || 0,
      friend: otherUser.points || 0,
      hours: currentUser.hours || 0,
      level: currentUser.level || 0,
      completed,
      otherCompletedCount: otherCompleted.length,
      tasks,
      scoreHistory: recentLogs,
      stages: initialStages,
      weeks: initialWeeks,
      projects: initialProjects
    };
  },

  async updateLevel(rawUserId, level) {
    const userId = resolveUserId(rawUserId);
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      return await postgresRepository.updateLevel(userId, level);
    }
    const lvl = Math.max(0, Math.min(5, Number(level) || 0));
    sqliteDb.prepare('UPDATE users SET level = ? WHERE id = ?').run(lvl, userId);
    return lvl;
  },

  async addHours(rawUserId, hours) {
    const userId = resolveUserId(rawUserId);
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      return await postgresRepository.addHours(userId, hours);
    }
    const delta = Math.max(0, Number(hours) || 0);
    sqliteDb.prepare('UPDATE users SET hours = hours + ? WHERE id = ?').run(delta, userId);
    const updated = sqliteDb.prepare('SELECT hours FROM users WHERE id = ?').get(userId);
    return updated ? updated.hours : 0;
  },

  async toggleWeek(rawUserId, weekNumber) {
    const userId = resolveUserId(rawUserId);
    const userName = userId === 'sanzhar' ? 'Санжар' : 'Нурик';

    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      const res = await postgresRepository.toggleWeek(userId, weekNumber);
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
    const existing = sqliteDb.prepare('SELECT week_number FROM completed_weeks WHERE user_id = ? AND week_number = ?').get(userId, num);
    let isCompleted = false;

    if (existing) {
      sqliteDb.prepare('DELETE FROM completed_weeks WHERE user_id = ? AND week_number = ?').run(userId, num);
      sqliteDb.prepare('UPDATE users SET points = MAX(0, points - 30) WHERE id = ?').run(userId);
      sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
        userId, -30, `${userName}: снята отметка с недели ${num}`, new Date().toISOString()
      );
      isCompleted = false;
    } else {
      sqliteDb.prepare('INSERT INTO completed_weeks (user_id, week_number, completed_at) VALUES (?, ?, ?)').run(userId, num, new Date().toISOString());
      sqliteDb.prepare('UPDATE users SET points = points + 30 WHERE id = ?').run(userId);
      sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
        userId, 30, `${userName}: сдал мини-проект недели ${num}`, new Date().toISOString()
      );
      isCompleted = true;
    }

    const state = await this.getFullState(userId);
    return { isCompleted, state };
  },

  async toggleDailyTask(rawUserId, dateStr, taskKey) {
    const userId = resolveUserId(rawUserId);
    const userName = userId === 'sanzhar' ? 'Санжар' : 'Нурик';

    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      const res = await postgresRepository.toggleDailyTask(userId, dateStr, taskKey);
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

    const existing = sqliteDb.prepare('SELECT 1 FROM daily_tasks WHERE user_id = ? AND task_key = ? AND task_date = ?').get(userId, taskKey, dateStr);
    let done = false;

    const hourDelta = taskKey === 'practice' ? 1 : 0.5;
    const taskNames = { theory: 'Теория', practice: 'Практика', review: 'Синхрон' };
    const taskTitle = taskNames[taskKey] || taskKey;

    if (existing) {
      sqliteDb.prepare('DELETE FROM daily_tasks WHERE user_id = ? AND task_key = ? AND task_date = ?').run(userId, taskKey, dateStr);
      sqliteDb.prepare('UPDATE users SET points = MAX(0, points - 10), hours = MAX(0, hours - ?) WHERE id = ?').run(hourDelta, userId);
      done = false;
    } else {
      sqliteDb.prepare('INSERT INTO daily_tasks (user_id, task_key, task_date, completed) VALUES (?, ?, ?, 1)').run(userId, taskKey, dateStr);
      sqliteDb.prepare('UPDATE users SET points = points + 10, hours = hours + ? WHERE id = ?').run(hourDelta, userId);
      sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
        userId, 10, `${userName}: выполнил ${taskTitle}`, new Date().toISOString()
      );
      done = true;
    }

    return { done, state: await this.getFullState(userId, dateStr) };
  },

  async addScore(rawUserId, deltaPoints, reason) {
    const userId = resolveUserId(rawUserId);
    const userName = userId === 'sanzhar' ? 'Санжар' : 'Нурик';

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

    const delta = Number(deltaPoints) || 0;
    const desc = reason || (delta >= 0 ? `${userName}: +${delta} XP` : `${userName}: ${delta} XP`);

    if (delta < 0) {
      sqliteDb.prepare('UPDATE users SET points = MAX(0, points + ?) WHERE id = ?').run(delta, userId);
    } else {
      sqliteDb.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(delta, userId);
    }

    sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
      userId, delta, desc, new Date().toISOString()
    );

    return await this.getFullState(userId);
  },

  async resetAll(rawUserId) {
    if (config.db.type === 'postgres') {
      const { postgresRepository } = await import('./postgres.js');
      const res = await postgresRepository.resetAll(rawUserId);
      return {
        ...res,
        stages: initialStages,
        weeks: initialWeeks,
        projects: initialProjects
      };
    }

    if (rawUserId) {
      const userId = resolveUserId(rawUserId);
      sqliteDb.prepare('DELETE FROM completed_weeks WHERE user_id = ?').run(userId);
      sqliteDb.prepare('DELETE FROM daily_tasks WHERE user_id = ?').run(userId);
      sqliteDb.prepare('UPDATE users SET points = 0, hours = 0, level = 0 WHERE id = ?').run(userId);
      return await this.getFullState(userId);
    }

    sqliteDb.exec(`
      DELETE FROM completed_weeks;
      DELETE FROM daily_tasks;
      DELETE FROM score_history;
      UPDATE users SET points = 0, hours = 0, level = 0;
    `);
    sqliteDb.prepare('INSERT INTO score_history (user_id, points, reason, created_at) VALUES (?, ?, ?, ?)').run(
      'nurik', 0, 'Сброс прогресса', new Date().toISOString()
    );
    return await this.getFullState('nurik');
  }
};
