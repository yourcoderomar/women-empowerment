const router = require('express').Router();
const { auth, role } = require('../../middleware/auth.middleware');
const controller = require('./chat.controller');

router.use(auth, role('customer', 'provider'));

router.get('/', controller.list);
router.post('/', role('customer'), controller.open);
router.get('/:id/messages', controller.loadOwn, controller.messages);
router.post('/:id/messages', controller.loadOwn, controller.send);

module.exports = router;
