# 🗄 Руководство по подключению базы данных к Java League

Бекенд проекта спроектирован по модульному принципу (Repository pattern) и изначально поддерживает:
1. **SQLite (по умолчанию)** — встроена в проект, работает сразу «из коробки» без установки дополнительных серверов.
2. **PostgreSQL** — идеальный выбор для Java / Spring Boot разработчиков (локально или в облаке Supabase / Neon).
3. **MySQL** — классическая реляционная СУБД.

---

## 1. Как работает встроенная база данных (SQLite)

В проект уже встроена SQLite на базе нативного модуля `node:sqlite` (доступен в Node.js 22+).
- **Файл базы данных**: автоматически создается по пути `./data/learningj.db`.
- **Режим работы**: WAL (Write-Ahead Logging) для быстрой параллельной записи и чтения.
- **Преимущества**: не требует логинов, паролей, Docker или установки СУБД. Все ваши недели, очки XP, таймер и задачи сохраняются локально в один компактный файл.

Если вам достаточно локального хранения, **настраивать ничего не нужно** — просто запустите сервер:
```bash
npm start
```

---

## 2. Подключение PostgreSQL (Локально или в Облаке)

PostgreSQL — стандарт де-факто в экосистеме Java и Spring Data JPA. Вы можете подключить как локальный PostgreSQL, так и бесплатную облачную базу данных (например, [Neon.tech](https://neon.tech) или [Supabase](https://supabase.com)).

### Шаг 1. Установите драйвер `pg`
В терминале проекта выполните:
```bash
npm install pg
```

### Шаг 2. Создайте базу данных (если используете локальный Postgres)
В `psql` или pgAdmin создайте базу данных:
```sql
CREATE DATABASE learningj;
```

### Шаг 3. Настройте файл `.env`
Откройте файл `.env` в корне проекта и укажите параметры подключения:

#### Вариант А: Одной строкой (Connection URL / для Neon, Supabase, Render)
```env
PORT=3000
NODE_ENV=development

# Переключаем тип базы данных
DB_TYPE=postgres

# Строка подключения (URL скопируйте из панели Neon или Supabase)
DATABASE_URL=postgresql://postgres:ваш_пароль@localhost:5432/learningj?sslmode=disable
```

#### Вариант Б: Отдельными параметрами (для локального PostgreSQL)
```env
PORT=3000
NODE_ENV=development

DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=ваш_пароль
DB_NAME=learningj
```

### Шаг 4. Схема таблиц (создается автоматически)
При первом запуске адаптер `server/db/postgres.js` **автоматически** создаст все необходимые таблицы:
- `users` — профили («Ты» и «Друг»), накопленные очки XP, часы и уровень понимания.
- `completed_weeks` — сданные мини-проекты недель с датой завершения.
- `daily_tasks` — ежедневные чекбоксы (теория, практика, код-ревью).
- `score_history` — подробный лог начислений очков XP с комментариями.

Если вы хотите выполнить DDL вручную через pgAdmin / psql:
```sql
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

-- Начальные данные
INSERT INTO users (id, name, points, hours, level) VALUES
('you', 'Ты', 0, 0, 0),
('friend', 'Друг', 0, 0, 0)
ON CONFLICT (id) DO NOTHING;
```

---

## 3. Подключение MySQL

Для работы с MySQL:

### Шаг 1. Установите драйвер `mysql2`
```bash
npm install mysql2
```

### Шаг 2. Настройте `.env`
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ваш_пароль
DB_NAME=learningj
```

### Шаг 3. Создайте таблицы в MySQL
```sql
CREATE DATABASE IF NOT EXISTS learningj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE learningj;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  points INT DEFAULT 0,
  hours FLOAT DEFAULT 0,
  level INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS completed_weeks (
  week_number INT PRIMARY KEY,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  task_key VARCHAR(50) NOT NULL,
  task_date DATE NOT NULL,
  completed INT DEFAULT 1,
  PRIMARY KEY (task_key, task_date)
);

CREATE TABLE IF NOT EXISTS score_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  points INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO users (id, name, points, hours, level) VALUES
('you', 'Ты', 0, 0, 0),
('friend', 'Друг', 0, 0, 0);
```

---

## 4. Как протестировать подключение

1. Запустите сервер:
   ```bash
   npm start
   ```
2. В консоли отобразится статус подключения:
   - Для SQLite: `[DB] SQLite подключена успешно (./data/learningj.db)`
   - Для PostgreSQL: `[PostgreSQL] Успешно подключено к базе данных!`
3. Откройте в браузере:
   ```
   http://localhost:3000
   ```
   В сайдбаре или меню индикатор статуса покажет: **«Сервер и БД активны»** (зеленый индикатор).
4. Проверьте API здоровья в терминале или браузере:
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:3000/api/state
   ```

---

## 5. Полезные команды

- `npm start` — запуск продакшн-сервера
- `npm run dev` — запуск сервера с автоперезагрузкой при изменении файлов (`--watch`)
- `curl -X POST http://localhost:3000/api/reset` — сброс всех данных (очистка прогресса)

