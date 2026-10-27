const router = require('express').Router();
const { auth, role } = require('../../middleware/auth.middleware');
const controller = require('./payment.controller');

router.use(auth);

router.get('/', controller.list);
router.post('/', role('customer'), controller.create);
router.patch('/:id/status', role('provider'), controller.setStatus);

module.exports = router;
