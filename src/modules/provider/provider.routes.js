const router = require('express').Router();
const { auth, role } = require('../../middleware/auth.middleware');
const controller = require('./provider.controller');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.patch('/me', auth, role('provider'), controller.updateMe);
router.patch('/:id/verification', auth, role('admin'), controller.setVerification);

module.exports = router;
