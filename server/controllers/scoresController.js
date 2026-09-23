import { repository } from '../db/db.js';

export const scoresController = {
  async addScore(req, res) {
    try {
      const { user = 'nurik', userId, points = 0, reason = '' } = req.body;
      const targetUser = userId || user || 'nurik';
      const parsedPoints = Number(points);
      if (isNaN(parsedPoints)) {
        return res.status(400).json({ success: false, error: 'Некорректное значение очков' });
      }
      const updatedState = await repository.addScore(targetUser, parsedPoints, reason);
      res.json({ success: true, data: updatedState });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getHistory(req, res) {
    try {
      const userId = req.query.userId || req.headers['x-user-id'] || 'nurik';
      const state = await repository.getFullState(userId);
      res.json({
        success: true,
        currentUser: state.currentUser,
        otherUser: state.otherUser,
        allUsers: state.allUsers,
        history: state.scoreHistory
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
