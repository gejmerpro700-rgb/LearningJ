import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initDatabase } from './db/db.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

// Инициализация базы данных
initDatabase();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Логгирование запросов в режиме development
if (config.nodeEnv !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.originalUrl.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });
}

// REST API
app.use('/api', apiRoutes);

// Статические файлы фронтенда
app.use(express.static(rootDir));

// SPA fallback для любых путей, кроме /api
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Централизованная обработка ошибок
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Внутренняя ошибка сервера' : err.message
  });
});

app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                ⚡ JAVA LEAGUE SERVER ⚡                  ║
║                                                          ║
║  Фронтенд & API доступны по адресу:                     ║
║  ➜ http://localhost:${config.port}                                ║
║                                                          ║
║  REST API эндпоинты:                                     ║
║  ➜ http://localhost:${config.port}/api/health                     ║
║  ➜ http://localhost:${config.port}/api/state                      ║
║  ➜ http://localhost:${config.port}/api/scores                     ║
╚══════════════════════════════════════════════════════════╝
  `);
});

