import { repository } from '../db/db.js';

export const tasksController = {
  async toggleTask(req, res) {
    try {
      const { taskKey, date } = req.body;
      if (!taskKey) {
        return res.status(400).json({ success: false, error: 'Параметр taskKey обязателен' });
      }
      const dateStr = date || new Date().toISOString().slice(0, 10);
      const result = await repository.toggleDailyTask(dateStr, taskKey);
      res.json({ success: true, done: result.done, state: result.state });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

