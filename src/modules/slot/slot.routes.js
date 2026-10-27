const router = require('express').Router();
const { auth, role } = require('../../middleware/auth.middleware');
const controller = require('./slot.controller');

router.get('/', controller.list);
router.post('/', auth, role('provider'), controller.create);
router.patch('/:id', auth, role('provider'), controller.loadOwn, controller.update);
router.delete('/:id', auth, role('provider'), controller.loadOwn, controller.remove);

module.exports = router;
