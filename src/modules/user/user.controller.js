const User = require('./user.model');

// Admin: list users, e.g. ?user_type=provider&verification_status=pending
exports.list = async (req, res) => {
  res.json(await User.findProfiles(req.query));
};

// Email, user_type and password are not editable here.
exports.updateMe = async (req, res) => {
  res.json(await User.update(req.user.user_id, req.body));
};

exports.deleteMe = async (req, res) => {
  await User.remove(req.user.user_id);
  res.status(204).end();
};
