import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    // Поддерживаемые типы: 'sqlite' | 'postgres' | 'mysql'
    type: process.env.DB_TYPE || 'sqlite',
    // Путь к файлу SQLite
    sqliteFile: process.env.DB_FILE || path.resolve(__dirname, '../data/learningj.db'),
    // Настройки для PostgreSQL / MySQL
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'learningj',
    url: process.env.DATABASE_URL || '',
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

