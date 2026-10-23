const router = require('express').Router();
const User = require('../models/User');
const { auth, role } = require('../middleware/auth');

router.use(auth);

// Admin: list users, e.g. ?user_type=provider&verification_status=pending
router.get('/', role('admin'), async (req, res) => {
  res.json(await User.findProfiles(req.query));
});

// Email, user_type and password are not editable here.
router.patch('/me', async (req, res) => {
  res.json(await User.update(req.user.user_id, req.body));
});

router.delete('/me', async (req, res) => {
  await User.remove(req.user.user_id);
  res.status(204).end();
});

module.exports = router;
