import { repository } from '../db/db.js';

export const scoresController = {
  async addScore(req, res) {
    try {
      const { user = 'you', points = 0, reason = '' } = req.body;
      const parsedPoints = Number(points);
      if (isNaN(parsedPoints)) {
        return res.status(400).json({ success: false, error: 'Некорректное значение очков' });
      }
      const updatedState = await repository.addScore(user, parsedPoints, reason);
      res.json({ success: true, data: updatedState });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getHistory(req, res) {
    try {
      const state = await repository.getFullState();
      res.json({
        success: true,
        you: state.points,
        friend: state.friend,
        history: state.scoreHistory
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

