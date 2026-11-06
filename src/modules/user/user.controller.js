const Controller = require('../../core/Controller');
const User = require('./user.model');

class UserController extends Controller {
  // Admin: list users, e.g. ?user_type=provider&verification_status=pending
  async list(req, res) {
    res.json(await this.model.findProfiles(req.query));
  }

  // Only name and phone can change here (see UserModel).
  async updateMe(req, res) {
    res.json(await this.model.update(req.user.user_id, req.body));
  }

  async deleteMe(req, res) {
    await this.model.remove(req.user.user_id); // everything they own is deleted too (ON DELETE CASCADE)
    res.status(204).end();
  }
}

module.exports = new UserController(User, 'User');
