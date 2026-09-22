import express from 'express';
import { progressController } from '../controllers/progressController.js';
import { weeksController } from '../controllers/weeksController.js';
import { scoresController } from '../controllers/scoresController.js';
import { tasksController } from '../controllers/tasksController.js';

const router = express.Router();

// Проверка здоровья сервиса
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Java League API',
    version: '1.0.0'
  });
});

// Полное состояние
router.get('/state', progressController.getState);
router.post('/level', progressController.updateLevel);
router.post('/hours', progressController.addHours);
router.post('/reset', progressController.reset);

// Недели и этапы
router.get('/weeks', weeksController.getWeeks);
router.post('/weeks/toggle', weeksController.toggle);

// Задачи дня
router.post('/tasks/toggle', tasksController.toggleTask);

// Очки и соревнование
router.get('/scores', scoresController.getHistory);
router.post('/scores', scoresController.addScore);

export default router;

