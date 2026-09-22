import { repository } from '../db/db.js';

export const progressController = {
  async getState(req, res) {
    try {
      const today = req.query.date || new Date().toISOString().slice(0, 10);
      const state = await repository.getFullState(today);
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateLevel(req, res) {
    try {
      const { level } = req.body;
      const newLevel = await repository.updateLevel(level);
      res.json({ success: true, level: newLevel });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async addHours(req, res) {
    try {
      const { hours } = req.body;
      const totalHours = await repository.addHours(hours);
      res.json({ success: true, hours: totalHours });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async reset(req, res) {
    try {
      const state = await repository.resetAll();
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

