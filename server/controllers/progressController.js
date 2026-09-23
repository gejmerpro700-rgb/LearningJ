import { repository } from '../db/db.js';

export const progressController = {
  async getState(req, res) {
    try {
      const today = req.query.date || new Date().toISOString().slice(0, 10);
      const userId = req.query.userId || req.headers['x-user-id'] || 'nurik';
      const state = await repository.getFullState(userId, today);
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateLevel(req, res) {
    try {
      const { level, userId } = req.body;
      const targetUser = userId || req.headers['x-user-id'] || 'nurik';
      const newLevel = await repository.updateLevel(targetUser, level);
      res.json({ success: true, level: newLevel });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async addHours(req, res) {
    try {
      const { hours, userId } = req.body;
      const targetUser = userId || req.headers['x-user-id'] || 'nurik';
      const totalHours = await repository.addHours(targetUser, hours);
      res.json({ success: true, hours: totalHours });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async reset(req, res) {
    try {
      const { userId } = req.body;
      const state = await repository.resetAll(userId);
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
