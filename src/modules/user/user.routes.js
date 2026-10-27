const router = require('express').Router();
const { auth, role } = require('../../middleware/auth.middleware');
const controller = require('./user.controller');

router.use(auth);

router.get('/', role('admin'), controller.list);
router.patch('/me', controller.updateMe);
router.delete('/me', controller.deleteMe);

module.exports = router;
