// ==========================================================================
// JAVA LEAGUE — MULTI-USER CLIENT LOGIC (НУРИК & САНЖАР)
// ==========================================================================

const LOCAL_STORAGE_KEY = 'javaLeagueState_v2';
const USER_STORAGE_KEY = 'javaLeagueUser';

// Текущий выбранный пользователь ('nurik' или 'sanzhar')
let currentUserId = localStorage.getItem(USER_STORAGE_KEY) || null;

// Данные по умолчанию (гарантируют мгновенный рендер без ожидания API)
const defaultWeeks = [
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

const defaultStages = [
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

const defaultProjects = [
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

let state = {
  currentUser: { id: 'nurik', name: 'Нурик', points: 0, hours: 0, level: 0 },
  otherUser: { id: 'sanzhar', name: 'Санжар', points: 0, hours: 0, level: 0 },
  allUsers: [],
  points: 0,
  friend: 0,
  completed: [],
  otherCompletedCount: 0,
  tasks: {},
  level: 0,
  hours: 0,
  scoreHistory: [],
  weeks: defaultWeeks,
  stages: defaultStages,
  projects: defaultProjects
};

let isServerOnline = false;
let soundEnabled = true;

// Web Audio API синтезатор звуковых эффектов
const audioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'alarm') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    console.debug('Audio error:', e);
  }
}

// Селекторы
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Уведомления (Toast)
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Загрузка локального состояния
function loadLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      if (!state.weeks || !state.weeks.length) state.weeks = defaultWeeks;
      if (!state.stages || !state.stages.length) state.stages = defaultStages;
      if (!state.projects || !state.projects.length) state.projects = defaultProjects;
    }
  } catch (e) {
    console.error('Ошибка чтения localStorage:', e);
  }
}

// Сохранение локального состояния
function saveLocalState() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Ошибка записи localStorage:', e);
  }
}

// Нормализация имени: "нурик", "nurik" -> "nurik"; "санжар", "sanzhar" -> "sanzhar"
function normalizeName(input) {
  if (!input) return null;
  const clean = String(input).trim().toLowerCase();
  if (clean.includes('санжар') || clean.includes('sanzhar') || clean.includes('саня') || clean === 's') {
    return 'sanzhar';
  }
  if (clean.includes('нурик') || clean.includes('nurik') || clean.includes('нур') || clean === 'n') {
    return 'nurik';
  }
  return null;
}

// Клиентский API слой
const api = {
  async checkServer() {
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        isServerOnline = data.status === 'ok';
      } else {
        isServerOnline = false;
      }
    } catch {
      isServerOnline = false;
    }
    updateServerStatusUI();
    return isServerOnline;
  },

  async fetchUsers() {
    if (!isServerOnline) return;
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.users) {
          state.allUsers = json.users;
          updateLoginModalUsers(json.users);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch users:', e);
    }
  },

  async fetchState() {
    const uid = currentUserId || 'nurik';
    const today = new Date().toISOString().slice(0, 10);

    if (isServerOnline) {
      try {
        const res = await fetch(`/api/state?userId=${encodeURIComponent(uid)}&date=${today}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            state.currentUser = d.currentUser || state.currentUser;
            state.otherUser = d.otherUser || state.otherUser;
            state.allUsers = d.allUsers || state.allUsers;
            state.points = d.points ?? state.points;
            state.friend = d.friend ?? state.friend;
            state.hours = d.hours ?? state.hours;
            state.level = d.level ?? state.level;
            state.completed = d.completed || state.completed;
            state.otherCompletedCount = d.otherCompletedCount || 0;
            state.tasks = d.tasks || state.tasks;
            state.scoreHistory = d.scoreHistory || [];
            if (d.weeks?.length) state.weeks = d.weeks;
            if (d.stages?.length) state.stages = d.stages;
            if (d.projects?.length) state.projects = d.projects;
            saveLocalState();
            return;
          }
        }
      } catch (e) {
        console.warn('API fetchState error, working offline:', e);
      }
    }

    // Офлайн режим: локальные пользователи
    if (!state.allUsers || state.allUsers.length === 0) {
      state.allUsers = [
        { id: 'nurik', name: 'Нурик', points: state.points || 0, hours: state.hours || 0, level: state.level || 0 },
        { id: 'sanzhar', name: 'Санжар', points: state.friend || 0, hours: 0, level: 0 }
      ];
    }
    const curr = state.allUsers.find(u => u.id === uid) || state.allUsers[0];
    const other = state.allUsers.find(u => u.id !== uid) || state.allUsers[1];
    state.currentUser = curr;
    state.otherUser = other;
    state.points = curr.points;
    state.friend = other.points;
  },

  async toggleWeek(weekNum) {
    const uid = currentUserId || 'nurik';
    if (isServerOnline) {
      try {
        const res = await fetch('/api/weeks/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, weekNumber: weekNum })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.state) {
            this.applyStateUpdate(json.state);
            return json.isCompleted;
          }
        }
      } catch (e) {
        console.warn('Sync failed, toggling locally:', e);
      }
    }

    // Локальный режим
    const idx = state.completed.indexOf(weekNum);
    let done = false;
    if (idx >= 0) {
      state.completed.splice(idx, 1);
      state.points = Math.max(0, state.points - 30);
      done = false;
    } else {
      state.completed.push(weekNum);
      state.points += 30;
      done = true;
    }
    if (state.currentUser) state.currentUser.points = state.points;
    saveLocalState();
    return done;
  },

  async toggleDailyTask(taskKey) {
    const uid = currentUserId || 'nurik';
    const today = new Date().toISOString().slice(0, 10);

    if (isServerOnline) {
      try {
        const res = await fetch('/api/tasks/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, taskKey, date: today })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.state) {
            this.applyStateUpdate(json.state);
            return json.done;
          }
        }
      } catch (e) {
        console.warn('Sync failed, toggling task locally:', e);
      }
    }

    // Локальный режим
    state.tasks[taskKey] = !state.tasks[taskKey];
    const isDone = !!state.tasks[taskKey];
    const hourDelta = taskKey === 'practice' ? 1 : 0.5;
    if (isDone) {
      state.points += 10;
      state.hours += hourDelta;
    } else {
      state.points = Math.max(0, state.points - 10);
      state.hours = Math.max(0, state.hours - hourDelta);
    }
    if (state.currentUser) {
      state.currentUser.points = state.points;
      state.currentUser.hours = state.hours;
    }
    saveLocalState();
    return isDone;
  },

  async addScore(targetUserId, points, reason) {
    const uid = targetUserId || currentUserId || 'nurik';
    if (isServerOnline) {
      try {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, points, reason })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            this.applyStateUpdate(json.data);
            return;
          }
        }
      } catch (e) {
        console.warn('Sync failed, adding score locally:', e);
      }
    }

    // Локальный режим
    const delta = Number(points) || 0;
    if (uid === currentUserId) {
      state.points = Math.max(0, state.points + delta);
      if (state.currentUser) state.currentUser.points = state.points;
    } else {
      state.friend = Math.max(0, state.friend + delta);
      if (state.otherUser) state.otherUser.points = state.friend;
    }

    const userName = uid === 'sanzhar' ? 'Санжар' : 'Нурик';
    state.scoreHistory.unshift({
      id: Date.now(),
      user_id: uid,
      user_name: userName,
      points: delta,
      reason: reason || `${userName}: ${delta >= 0 ? '+' : ''}${delta} XP`,
      created_at: new Date().toISOString()
    });
    saveLocalState();
  },

  async updateLevel(level) {
    const uid = currentUserId || 'nurik';
    const lvl = Math.max(0, Math.min(5, Number(level)));
    state.level = lvl;
    if (state.currentUser) state.currentUser.level = lvl;
    saveLocalState();

    if (isServerOnline) {
      try {
        await fetch('/api/level', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, level: lvl })
        });
      } catch (e) {
        console.warn('Failed to sync level:', e);
      }
    }
  },

  async addStudyHours(hours) {
    const uid = currentUserId || 'nurik';
    state.hours += hours;
    if (state.currentUser) state.currentUser.hours = state.hours;
    saveLocalState();

    if (isServerOnline) {
      try {
        await fetch('/api/hours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, hours })
        });
      } catch (e) {
        console.warn('Failed to sync hours:', e);
      }
    }
  },

  async resetAll() {
    const uid = currentUserId || 'nurik';
    if (isServerOnline) {
      try {
        await fetch('/api/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid })
        });
      } catch (e) {
        console.warn('Reset error:', e);
      }
    }
    state.points = 0;
    state.completed = [];
    state.tasks = {};
    state.level = 0;
    state.hours = 0;
    if (state.currentUser) {
      state.currentUser.points = 0;
      state.currentUser.hours = 0;
      state.currentUser.level = 0;
    }
    saveLocalState();
  },

  applyStateUpdate(newState) {
    if (!newState) return;
    state.currentUser = newState.currentUser || state.currentUser;
    state.otherUser = newState.otherUser || state.otherUser;
    state.allUsers = newState.allUsers || state.allUsers;
    state.points = newState.points ?? state.points;
    state.friend = newState.friend ?? state.friend;
    state.hours = newState.hours ?? state.hours;
    state.level = newState.level ?? state.level;
    state.completed = newState.completed || state.completed;
    state.otherCompletedCount = newState.otherCompletedCount || 0;
    state.tasks = newState.tasks || state.tasks;
    state.scoreHistory = newState.scoreHistory || state.scoreHistory;
    saveLocalState();
  }
};

// Обновление плашки синхронизации
function updateServerStatusUI() {
  const syncWrap = $('#syncStatus');
  const syncText = $('#syncText');
  if (!syncWrap || !syncText) return;

  if (isServerOnline) {
    syncWrap.className = 'sync-status online';
    syncText.textContent = 'Сервер и БД активны';
  } else {
    syncWrap.className = 'sync-status offline';
    syncText.textContent = 'Офлайн (локальный режим)';
  }
}

// Обновление плашки пользователя в UI
function updateCurrentUserUI() {
  const isNurik = currentUserId === 'nurik';
  const name = isNurik ? 'Нурик' : 'Санжар';
  const letter = isNurik ? 'Н' : 'С';
  const avatarClass = isNurik ? 'nurik' : 'sanzhar';

  // Верхний бар
  const topName = $('#topUserName');
  const topXp = $('#topUserXp');
  const topAvatar = $('#topUserAvatar');
  if (topName) topName.textContent = name;
  if (topXp) topXp.textContent = `${state.points} XP`;
  if (topAvatar) {
    topAvatar.textContent = letter;
    topAvatar.className = `user-chip-avatar ${avatarClass}`;
  }

  // Сайдбар
  const sideName = $('#sidebarUserName');
  const sideXp = $('#sidebarUserXp');
  const sideAvatar = $('#sidebarUserAvatar');
  if (sideName) sideName.textContent = name;
  if (sideXp) sideXp.textContent = `${state.points} XP`;
  if (sideAvatar) {
    sideAvatar.textContent = letter;
    sideAvatar.className = `sidebar-user-avatar ${avatarClass}`;
  }

  // Hero pill
  const heroPill = $('#heroUserPill');
  if (heroPill) {
    heroPill.innerHTML = `👤 Профиль: <b>${name}</b>`;
  }

  // Пресет в модалке очков
  $$('#scoreModal .segment-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.targetUser === currentUserId);
  });
}

// Обновление карточек в окне логина с актуальным XP
function updateLoginModalUsers(users) {
  if (!users || !users.length) return;
  const nurik = users.find(u => u.id === 'nurik');
  const sanzhar = users.find(u => u.id === 'sanzhar');
  const nXp = $('#loginNurikXp');
  const sXp = $('#loginSanzharXp');
  if (nXp && nurik) nXp.textContent = nurik.points || 0;
  if (sXp && sanzhar) sXp.textContent = sanzhar.points || 0;
}

// Переключение пользователя
async function setCurrentUser(userId) {
  if (userId !== 'nurik' && userId !== 'sanzhar') return;
  currentUserId = userId;
  localStorage.setItem(USER_STORAGE_KEY, userId);

  // Скрываем модальное окно логина
  const loginModal = $('#loginModal');
  if (loginModal) loginModal.classList.remove('open');

  toast(`Вход выполнен: ${userId === 'nurik' ? 'Нурик 👑' : 'Санжар ⚡'}`);
  playSound('success');

  // Загружаем данные этого пользователя
  await api.fetchState();
  updateCurrentUserUI();
  renderAll();
}

// Открытие окна логина / выбора профиля
function openLoginModal(canClose = true) {
  const modal = $('#loginModal');
  const closeBtn = $('#closeLoginModalBtn');
  const errorEl = $('#loginError');
  const input = $('#loginNameInput');

  if (errorEl) errorEl.textContent = '';
  if (input) input.value = '';

  if (closeBtn) {
    closeBtn.style.display = canClose && currentUserId ? 'grid' : 'none';
  }

  api.fetchUsers();
  if (modal) modal.classList.add('open');
}

// Навигация по секциям
function goToSection(sectionId) {
  playSound('click');
  $$('.page').forEach(p => p.classList.toggle('active', p.id === sectionId));
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === sectionId));
  $$('.bottom-nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === sectionId));

  const titles = {
    dashboard: 'Java League',
    roadmap: 'Дорожная карта',
    weeks: 'Учебные недели',
    projects: 'Проекты',
    scores: 'XP Баттл (Нурик vs Санжар)',
    rules: 'Система обучения'
  };

  const pageTitle = $('#pageTitle');
  if (pageTitle && titles[sectionId]) {
    pageTitle.textContent = titles[sectionId];
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Описания уровней понимания
const skillLevelDescriptions = {
  0: '0/5 — Тёмный лес. Тема незнакома или концепции непонятны.',
  1: '1/5 — Понял общую теорию и термины, но писать код сложно.',
  2: '2/5 — Могу решить простую задачу с открытой документацией/видео.',
  3: '3/5 — Могу реализовать задачу самостоятельно без подглядываний.',
  4: '4/5 — Могу легко объяснить устройство кода и ошибки другу.',
  5: '5/5 — Полное мастерство. Пишу чистый код в проекте без подсказок.'
};

// Рендеринг Roadmap
function renderRoadmap() {
  const container = $('#roadmapList');
  if (!container || !state.stages.length) return;

  container.innerHTML = state.stages.map((stage, idx) => {
    const stageWeeks = state.weeks.filter(w => w.stage === stage.n);
    const completedInStage = stageWeeks.filter(w => state.completed.includes(w.n)).length;
    const isStageDone = stageWeeks.length > 0 && completedInStage === stageWeeks.length;

    return `
      <article class="stage ${idx === 1 ? 'open' : ''} ${isStageDone ? 'stage-done' : ''}">
        <div class="stage-head">
          <span class="stage-num-badge">ЭТАП ${stage.n}</span>
          <div class="stage-head-text">
            <h3>${stage.name}</h3>
            <p>${stage.desc} · недели ${stage.range} · (сдано вами: ${completedInStage}/${stageWeeks.length})</p>
          </div>
          <span class="stage-toggle-icon">+</span>
        </div>
        <div class="stage-weeks">
          ${stageWeeks.map(w => {
      const isDone = state.completed.includes(w.n);
      return `
              <div class="mini-week ${isDone ? 'done' : ''}">
                <div class="mini-week-top">
                  <b>Неделя ${w.n}</b>
                  <span>${isDone ? '✓ Сдано вами' : 'В процессе'}</span>
                </div>
                <strong>${w.title}</strong>
                <span class="mini-week-project">📦 ${w.project}</span>
              </div>
            `;
    }).join('')}
        </div>
      </article>
    `;
  }).join('');

  $$('.stage-head').forEach(head => {
    head.addEventListener('click', () => {
      head.parentElement.classList.toggle('open');
      playSound('click');
    });
  });
}

// Рендеринг Недель
function renderWeeks() {
  const stageFilter = $('#stageFilter');
  if (!stageFilter || !state.stages.length) return;

  const currentVal = stageFilter.value || 'all';
  stageFilter.innerHTML = '<option value="all">Все этапы (0–10)</option>' +
    state.stages.map(s => `<option value="${s.n}">Этап ${s.n} — ${s.name}</option>`).join('');
  stageFilter.value = currentVal;

  function doRender() {
    const filter = stageFilter.value;
    const search = ($('#weekSearch')?.value || '').trim().toLowerCase();

    const filtered = state.weeks.filter(w => {
      const matchStage = filter === 'all' || String(w.stage) === filter;
      const matchSearch = !search ||
        w.title.toLowerCase().includes(search) ||
        w.topic.toLowerCase().includes(search) ||
        w.project.toLowerCase().includes(search);
      return matchStage && matchSearch;
    });

    const grid = $('#weekGrid');
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">Ничего не найдено по вашему запросу.</div>';
      return;
    }

    grid.innerHTML = filtered.map(w => {
      const isDone = state.completed.includes(w.n);
      return `
        <article class="week-card ${isDone ? 'done' : ''}">
          <div class="week-card-top">
            <span class="week-card-num">НЕДЕЛЯ ${w.n}</span>
            <span style="font-size:10px; color:var(--text-muted); margin-left:auto;">Этап ${w.stage}</span>
          </div>
          <h3>${w.title}</h3>
          <p>${w.topic}</p>
          <span class="week-card-project-tag">📦 Проект: <b>${w.project}</b></span>
          <button class="${isDone ? 'ghost-btn' : 'primary-btn'}" data-toggle-week="${w.n}">
            ${isDone ? '✓ Проект сдан вами' : 'Сдать проект (+30 XP)'}
          </button>
        </article>
      `;
    }).join('');

    $$('[data-toggle-week]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const num = Number(btn.dataset.toggleWeek);
        const done = await api.toggleWeek(num);
        if (done) {
          playSound('success');
          toast(`+30 XP за сдачу проекта недели ${num}!`);
        } else {
          toast(`Отметка недели ${num} снята.`);
        }
        renderAll();
      });
    });
  }

  stageFilter.onchange = doRender;
  const searchInput = $('#weekSearch');
  if (searchInput) {
    searchInput.oninput = doRender;
  }

  doRender();
}

// Рендеринг Проектов
function renderProjects() {
  const grid = $('#projectGrid');
  if (!grid || !state.projects.length) return;

  grid.innerHTML = state.projects.map(p => `
    <article class="project-card">
      <div class="project-card-header">
        <div class="project-icon">${p.icon}</div>
        <span class="project-category-tag">${p.category}</span>
      </div>
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
    </article>
  `).join('');
}

// Вычисление текущей недели спринта
function getCurrentSprintWeek() {
  if (!state.weeks.length) return null;
  const n = Math.min(state.weeks.length - 1, state.completed.length);
  return state.weeks[n] || state.weeks[0];
}

// Рендеринг Дашборда
function renderDashboard() {
  const w = getCurrentSprintWeek();
  const weekCard = $('#currentWeekCard');

  if (w && weekCard && state.stages[w.stage]) {
    const isCurrentDone = state.completed.includes(w.n);
    weekCard.innerHTML = `
      <div class="week-badge-row">
        <span class="week-num-badge">НЕДЕЛЯ ${w.n}</span>
        <span style="font-size:12px; color:var(--text-muted);">•</span>
        <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">${state.stages[w.stage].name}</span>
      </div>
      <h3>${w.title}</h3>
      <p>${w.topic}</p>
      <div class="tasks-chip-row">
        ${(w.tasks || []).map(t => `<span class="task-chip">${t}</span>`).join('')}
      </div>
      <div class="project-footer-row">
        <div class="project-info-label">
          Мини-проект недели: <b>${w.project}</b>
        </div>
        <button class="${isCurrentDone ? 'ghost-btn' : 'primary-btn'}" data-toggle-week="${w.n}">
          ${isCurrentDone ? '✓ Проект сдан вами' : 'Сдать проект (+30 XP)'}
        </button>
      </div>
    `;

    const sprintBtn = weekCard.querySelector('[data-toggle-week]');
    if (sprintBtn) {
      sprintBtn.addEventListener('click', async () => {
        const done = await api.toggleWeek(w.n);
        if (done) {
          playSound('success');
          toast(`+30 XP за сдачу проекта недели ${w.n}!`);
        } else {
          toast(`Отметка недели ${w.n} снята.`);
        }
        renderAll();
      });
    }

    $('#currentStage').textContent = `Этап ${w.stage}`;
    $('#currentStageName').textContent = state.stages[w.stage].name;
  }

  const totalWeeks = state.weeks.length || 45;
  const completedCount = state.completed.length;
  const pct = Math.round((completedCount / totalWeeks) * 100);

  $('#completedWeeks').textContent = `${completedCount} / ${totalWeeks}`;
  $('#completionPercentage').textContent = `${pct}% выполнено`;
  $('#statsWeeksFill').style.width = `${pct}%`;
  $('#sidebarWeeksBadge').textContent = `${completedCount}/${totalWeeks}`;

  $('#studyHours').textContent = `${state.hours} ч`;
  $('#totalPoints').textContent = `${state.points} XP`;

  // Шкала лидерства
  renderLeaderboard();

  // Уровень понимания
  $('#skillLevel').textContent = state.level;
  $('#skillDescription').textContent = skillLevelDescriptions[state.level] || '';
  $$('.skill-btn').forEach(b => {
    b.classList.toggle('selected', Number(b.dataset.level) === state.level);
  });

  // Ежедневные чеки
  const dailyDoneCount = Object.values(state.tasks).filter(Boolean).length;
  $('#todayProgress').style.width = `${(dailyDoneCount / 3) * 100}%`;
  $('#todayProgressText').textContent = `${dailyDoneCount} / 3 задач`;

  $$('.check-btn').forEach(btn => {
    const key = btn.dataset.task;
    btn.classList.toggle('done', !!state.tasks[key]);
  });

  // История начислений
  renderScoreHistory();
  updateCurrentUserUI();
}

// Рендеринг Лидерборда Нурика и Санжара
function renderLeaderboard() {
  const isNurik = currentUserId === 'nurik';
  const nurikPts = isNurik ? state.points : state.friend;
  const sanzharPts = isNurik ? state.friend : state.points;

  // Счетчики
  const nScoreEl = $('#nurikScore');
  const sScoreEl = $('#sanzharScore');
  if (nScoreEl) nScoreEl.textContent = nurikPts;
  if (sScoreEl) sScoreEl.textContent = sanzharPts;

  // Бейджи "ВЫ"
  const nBadge = $('#nurikBadge');
  const sBadge = $('#sanzharBadge');
  if (nBadge) nBadge.textContent = isNurik ? 'ВЫ 👤' : 'NURIK';
  if (sBadge) sBadge.textContent = !isNurik ? 'ВЫ 👤' : 'SANZHAR';

  const cardNurik = $('#cardNurik');
  const cardSanzhar = $('#cardSanzhar');
  if (cardNurik) cardNurik.classList.toggle('active-user', isNurik);
  if (cardSanzhar) cardSanzhar.classList.toggle('active-user', !isNurik);

  // Бары прогресса
  const maxPts = Math.max(nurikPts, sanzharPts, 10);
  const nFill = $('#nurikBarFill');
  const sFill = $('#sanzharBarFill');
  if (nFill) nFill.style.width = `${Math.min(100, Math.round((nurikPts / maxPts) * 100))}%`;
  if (sFill) sFill.style.width = `${Math.min(100, Math.round((sanzharPts / maxPts) * 100))}%`;

  // Тексты статусов
  const diff = nurikPts - sanzharPts;
  const scoreDiffStatus = $('#scoreDiffStatus');
  const nStatus = $('#nurikStatusLabel');
  const sStatus = $('#sanzharStatusLabel');

  if (diff > 0) {
    if (nStatus) nStatus.textContent = `Лидирует (+${diff} XP) 👑`;
    if (sStatus) sStatus.textContent = `Догоняет (-${diff} XP) 🎯`;
    if (scoreDiffStatus) scoreDiffStatus.textContent = isNurik ? `Впереди на +${diff} XP 👑` : `Отставание: ${diff} XP 🎯`;
  } else if (diff < 0) {
    const absDiff = Math.abs(diff);
    if (nStatus) nStatus.textContent = `Догоняет (-${absDiff} XP) 🎯`;
    if (sStatus) sStatus.textContent = `Лидирует (+${absDiff} XP) 👑`;
    if (scoreDiffStatus) scoreDiffStatus.textContent = !isNurik ? `Впереди на +${absDiff} XP 👑` : `Отставание: ${absDiff} XP 🎯`;
  } else {
    if (nStatus) nStatus.textContent = 'Ничья ⚡';
    if (sStatus) sStatus.textContent = 'Ничья ⚡';
    if (scoreDiffStatus) scoreDiffStatus.textContent = 'Вровень с соперником';
  }
}

// Рендеринг истории очков
function renderScoreHistory() {
  const container = $('#scoreHistoryList');
  if (!container) return;

  if (!state.scoreHistory || state.scoreHistory.length === 0) {
    container.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 11px;">История пока пуста. Начните выполнять задачи!</div>';
    return;
  }

  container.innerHTML = state.scoreHistory.slice(0, 10).map(item => {
    const isPlus = item.points >= 0;
    const userName = item.user_name || (item.user_id === 'sanzhar' ? 'Санжар' : 'Нурик');
    const isYou = item.user_id === currentUserId;

    return `
      <div class="history-item">
        <span class="reason">
          <b style="color: ${item.user_id === 'sanzhar' ? '#38bdf8' : '#fbbf24'};">${userName}${isYou ? ' (Вы)' : ''}</b>: ${item.reason}
        </span>
        <span class="pts ${isPlus ? 'positive' : 'negative'}">${isPlus ? '+' : ''}${item.points} XP</span>
      </div>
    `;
  }).join('');
}

// Полный рендеринг всех компонентов
function renderAll() {
  renderRoadmap();
  renderWeeks();
  renderProjects();
  renderDashboard();
}

// ==========================================================================
// ТАЙМЕР 2 ЧАСОВ И ФОКУС-РЕЖИМ
// ==========================================================================

let timerInterval = null;
let remainingSeconds = 7200;
const TOTAL_SECONDS = 7200;

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function updateTimerDisplays() {
  const formatted = formatTime(remainingSeconds);
  const topDisplay = $('#topTimerDisplay');
  const panelDisplay = $('#timerDisplay');
  const modalDisplay = $('#modalTimerDisplay');

  if (topDisplay) topDisplay.textContent = formatted;
  if (panelDisplay) panelDisplay.textContent = formatted;
  if (modalDisplay) modalDisplay.textContent = formatted;
}

function toggleTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    $('#focusBtnText').textContent = 'Продолжить';
    $('#modalStartBtn').textContent = '▶ Продолжить';
    toast('Таймер на паузе');
    return;
  }

  $('#focusBtnText').textContent = 'Пауза';
  $('#modalStartBtn').textContent = '⏸ Пауза';
  toast(`Фокус-сессия 2 часов запущена для ${currentUserId === 'nurik' ? 'Нурика' : 'Санжара'}!`);
  playSound('click');

  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      remainingSeconds = TOTAL_SECONDS;
      updateTimerDisplays();

      $('#focusBtnText').textContent = 'Начать 2 часа';
      $('#modalStartBtn').textContent = '▶ Старт';

      playSound('alarm');
      api.addStudyHours(2);
      api.addScore(currentUserId, 20, '2 часа фокуса завершены');
      toast('🎉 2 часа завершены! +20 XP и +2 часа в ваш профиль!');
      renderDashboard();
      return;
    }

    remainingSeconds--;
    updateTimerDisplays();
  }, 1000);
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  remainingSeconds = TOTAL_SECONDS;
  updateTimerDisplays();
  $('#focusBtnText').textContent = 'Начать 2 часа';
  $('#modalStartBtn').textContent = '▶ Старт';
  toast('Таймер сброшен');
}

// ==========================================================================
// ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ
// ==========================================================================

function initEvents() {
  // Навигация
  $$('.nav-item').forEach(b => b.addEventListener('click', () => goToSection(b.dataset.section)));
  $$('.bottom-nav-item').forEach(b => b.addEventListener('click', () => goToSection(b.dataset.section)));
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => goToSection(b.dataset.goto)));

  // Смена пользователя (кнопка в шапке и сайдбаре)
  $('#openUserModalBtn')?.addEventListener('click', () => openLoginModal(true));
  $('#switchUserSidebarBtn')?.addEventListener('click', () => openLoginModal(true));
  $('#closeLoginModalBtn')?.addEventListener('click', () => {
    $('#loginModal')?.classList.remove('open');
  });

  // Клик по карточкам входа
  $$('[data-select-user]').forEach(card => {
    card.addEventListener('click', () => {
      const u = card.dataset.selectUser;
      setCurrentUser(u);
    });
  });

  // Форма ввода имени
  $('#loginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#loginNameInput');
    const val = input ? input.value : '';
    const resolved = normalizeName(val);
    const errorEl = $('#loginError');

    if (!resolved) {
      if (errorEl) errorEl.textContent = 'Пожалуйста, введите "Нурик" или "Санжар"';
      return;
    }
    setCurrentUser(resolved);
  });

  // Ежедневные чеки
  $$('.check-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.task;
      const isDone = await api.toggleDailyTask(key);
      if (isDone) {
        playSound('success');
        toast(`+10 XP: выполнена задача "${key}"`);
      } else {
        toast(`Отметка задачи "${key}" снята`);
      }
      renderDashboard();
    });
  });

  // Шкала понимания 0-5
  $$('.skill-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const lvl = Number(btn.dataset.level);
      await api.updateLevel(lvl);
      playSound('click');
      renderDashboard();
      toast(`Уровень понимания: ${lvl}/5`);
    });
  });

  // Таймер кнопки
  $('#focusBtn')?.addEventListener('click', toggleTimer);
  $('#modalStartBtn')?.addEventListener('click', toggleTimer);
  $('#modalResetBtn')?.addEventListener('click', resetTimer);

  // Модалка таймера
  const timerModal = $('#timerModal');
  $('#openTimerOverlayBtn')?.addEventListener('click', () => timerModal?.classList.add('open'));
  $('#closeTimerModalBtn')?.addEventListener('click', () => timerModal?.classList.remove('open'));
  timerModal?.addEventListener('click', e => {
    if (e.target === timerModal) timerModal.classList.remove('open');
  });

  // Быстрые кнопки начисления XP (начисляют текущему пользователю!)
  $$('.quick-xp').forEach(b => {
    b.addEventListener('click', async () => {
      const add = Number(b.dataset.add);
      const text = b.textContent.trim();
      await api.addScore(currentUserId, add, text);
      playSound(add > 0 ? 'success' : 'click');
      toast(`Вам начислено ${add > 0 ? '+' : ''}${add} XP`);
      renderDashboard();
    });
  });

  // Модалка добавления XP
  const scoreModal = $('#scoreModal');
  let selectedTargetUser = currentUserId || 'nurik';
  let selectedXpDelta = 10;

  $('#openScoreModalBtn')?.addEventListener('click', () => {
    selectedTargetUser = currentUserId || 'nurik';
    $$('#scoreModal .segment-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.targetUser === selectedTargetUser);
    });
    scoreModal?.classList.add('open');
  });

  $('#closeScoreModalBtn')?.addEventListener('click', () => scoreModal?.classList.remove('open'));
  $('#cancelScoreModalBtn')?.addEventListener('click', () => scoreModal?.classList.remove('open'));
  scoreModal?.addEventListener('click', e => {
    if (e.target === scoreModal) scoreModal.classList.remove('open');
  });

  $$('#scoreModal .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#scoreModal .segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTargetUser = btn.dataset.targetUser;
    });
  });

  $$('#scoreModal .preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('#scoreModal .preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedXpDelta = Number(chip.dataset.xp);
      const customInput = $('#customXpInput');
      if (customInput) customInput.value = selectedXpDelta;
    });
  });

  $('#customXpInput')?.addEventListener('input', e => {
    selectedXpDelta = Number(e.target.value) || 0;
    $$('#scoreModal .preset-chip').forEach(c => c.classList.remove('active'));
  });

  $('#confirmScoreModalBtn')?.addEventListener('click', async () => {
    const reasonInput = $('#scoreReasonInput');
    const reason = reasonInput?.value.trim() || undefined;
    await api.addScore(selectedTargetUser, selectedXpDelta, reason);
    playSound(selectedXpDelta > 0 ? 'success' : 'click');
    const targetName = selectedTargetUser === 'sanzhar' ? 'Санжару' : 'Нурику';
    toast(`${targetName}: ${selectedXpDelta >= 0 ? '+' : ''}${selectedXpDelta} XP`);
    if (reasonInput) reasonInput.value = '';
    scoreModal?.classList.remove('open');
    renderDashboard();
  });

  // Звук переключатель
  $('#soundToggleBtn')?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const icon = $('#soundIcon');
    if (icon) icon.textContent = soundEnabled ? '🔊' : '🔇';
    toast(soundEnabled ? 'Звуковые эффекты включены' : 'Звук выключен');
    if (soundEnabled) playSound('click');
  });

  // Сброс личного прогресса
  $('#resetBtn')?.addEventListener('click', async () => {
    const name = currentUserId === 'sanzhar' ? 'Санжара' : 'Нурика';
    if (confirm(`Сбросить личный прогресс для ${name} (задачи, недели, очки)?`)) {
      await api.resetAll();
      toast('Личный прогресс сброшен');
      renderAll();
    }
  });

  // Пробел = пауза/старт таймера
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      toggleTimer();
    }
  });
}

// Запуск приложения
async function initApp() {
  loadLocalState();

  const d = new Date();
  const dateEl = $('#todayDate');
  if (dateEl) {
    dateEl.textContent = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  initEvents();

  // Проверка соединения с бекендом
  await api.checkServer();

  // Проверка авторизации: если пользователь не выбран, открываем окно входа
  if (!currentUserId) {
    openLoginModal(false);
  } else {
    updateCurrentUserUI();
  }

  // Загружаем актуальное состояние
  await api.fetchState();

  // Первоначальный рендеринг
  renderAll();

  // Периодическая фоновая синхронизация (каждые 15 секунд)
  setInterval(async () => {
    await api.checkServer();
    if (isServerOnline && currentUserId) {
      await api.fetchState();
      renderAll();
    }
  }, 15000);
}

// Старт после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
