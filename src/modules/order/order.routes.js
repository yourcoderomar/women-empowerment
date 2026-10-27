const router = require('express').Router();
const { auth, role } = require('../../middleware/auth.middleware');
const controller = require('./order.controller');

router.use(auth);

router.post('/', role('customer'), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.patch('/:id/status', role('customer', 'provider'), controller.setStatus);

module.exports = router;
