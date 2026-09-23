import { repository } from '../db/db.js';

export const weeksController = {
  async getWeeks(req, res) {
    try {
      const userId = req.query.userId || req.headers['x-user-id'] || 'nurik';
      const state = await repository.getFullState(userId);
      res.json({
        success: true,
        weeks: state.weeks,
        stages: state.stages,
        completed: state.completed,
        currentUser: state.currentUser,
        otherUser: state.otherUser
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async toggle(req, res) {
    try {
      const { weekNumber, userId } = req.body;
      const targetUser = userId || req.headers['x-user-id'] || 'nurik';
      if (weekNumber === undefined || weekNumber === null) {
        return res.status(400).json({ success: false, error: 'Параметр weekNumber обязателен' });
      }
      const result = await repository.toggleWeek(targetUser, weekNumber);
      res.json({ success: true, isCompleted: result.isCompleted, state: result.state });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
