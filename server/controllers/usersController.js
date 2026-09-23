import { repository, resolveUserId } from '../db/db.js';

export const usersController = {
  async getUsers(req, res) {
    try {
      const users = await repository.getAllUsers();
      res.json({ success: true, users });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Имя обязательно' });
      }
      const userId = resolveUserId(name);
      const state = await repository.getFullState(userId);
      res.json({
        success: true,
        user: state.currentUser,
        otherUser: state.otherUser,
        state
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
