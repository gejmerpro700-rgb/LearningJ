import { repository } from '../db/db.js';

export const weeksController = {
  async getWeeks(req, res) {
    try {
      const state = await repository.getFullState();
      res.json({
        success: true,
        weeks: state.weeks,
        stages: state.stages,
        completed: state.completed
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async toggle(req, res) {
    try {
      const { weekNumber } = req.body;
      if (weekNumber === undefined || weekNumber === null) {
        return res.status(400).json({ success: false, error: 'Параметр weekNumber обязателен' });
      }
      const result = await repository.toggleWeek(weekNumber);
      res.json({ success: true, isCompleted: result.isCompleted, state: result.state });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

