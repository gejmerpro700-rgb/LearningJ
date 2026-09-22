# 🚀 Публикация Java League на Render.com и Railway.app (Бесплатно)

Да! Этот проект **на 100% готов** к развертыванию (деплою) на хостингах **Render.com** и **Railway.app**, а также к подключению бесплатной базы данных PostgreSQL в один клик.

---

## Вариант 1. Деплой на Render.com (Бесплатный Web Service + Postgres)

Render предоставляет бесплатный хостинг веб-сервисов Node.js и бесплатный сервер базы данных PostgreSQL.

### Шаг 1. Загрузите код на GitHub
1. Создайте новый репозиторий на [GitHub](https://github.com).
2. Загрузите ваш проект в репозиторий:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Java League"
   git branch -M main
   git remote add origin https://github.com/ВАШ_НИК/learningj.git
   git push -u origin main
   ```

### Шаг 2. Создайте PostgreSQL базу данных на Render
1. Зарегистрируйтесь на [Render.com](https://render.com).
2. Нажмите **New +** ➔ **PostgreSQL**.
3. Заполните:
   - **Name**: `learningj-db`
   - **Database**: `learningj`
   - **Region**: Выберите ближайший (например, Frankfurt).
   - **Plan**: `Free`.
4. Нажмите **Create Database**.
5. После создания скопируйте параметр **Internal Database URL** (или **External Database URL**).

### Шаг 3. Создайте Web Service на Render
1. Нажмите **New +** ➔ **Web Service**.
2. Подключите ваш GitHub-репозиторий.
3. Настройки сервиса:
   - **Name**: `java-league`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. В разделе **Environment Variables** (Переменные окружения) добавьте:
   - `NODE_ENV` = `production`
   - `DB_TYPE` = `postgres`
   - `DATABASE_URL` = `<вставьте скопированный URL базы данных Render>`
5. Нажмите **Create Web Service**.

Готово! Render автоматически соберет проект и выдаст вам публичный HTTPS адрес вида `https://java-league.onrender.com`.

---

## Вариант 2. Деплой на Railway.app

Railway — один из самых удобных хостингов с быстрой автоматической настройкой.

### Шаг 1. Создайте проект в Railway
1. Зарегистрируйтесь на [Railway.app](https://railway.app).
2. Нажмите **New Project** ➔ **Deploy from GitHub repo**.
3. Выберите ваш репозиторий с проектом Java League.

### Шаг 2. Добавьте PostgreSQL базу данных в Railway
1. В вашем проекте Railway нажмите кнопку **+ New** ➔ **Database** ➔ **Add PostgreSQL**.
2. Railway автоматически создаст базу данных за пару секунд.

### Шаг 3. Свяжите переменные окружения
1. Кликните по вашему Node.js веб-сервису в схеме Railway.
2. Перейдите во вкладку **Variables** ➔ **Add Reference Variable**.
3. Добавьте:
   - `DB_TYPE` = `postgres`
   - `DATABASE_URL` = `${{ Postgres.DATABASE_URL }}` (Railway предложит автозаполнение!)
4. Во вкладке **Settings** ➔ **Networking** ➔ Нажмите **Generate Domain**, чтобы получить публичный адрес (например, `https://java-league.up.railway.app`).

---

## ⚡ Что происходит при деплое:

1. Наш бекенд автоматически определяет переменную `process.env.PORT`, которую выделяет Render или Railway.
2. При наличии `DB_TYPE=postgres` и `DATABASE_URL` бэкенд подключается к PostgreSQL и автоматически создаст все таблицы при первом запуске (`users`, `completed_weeks`, `daily_tasks`, `score_history`).
3. Фронтенд работает быстро, а прогресс 2 друзей синхронизируется в единой облачной базе данных с любого устройства (ПК, смартфон)!

