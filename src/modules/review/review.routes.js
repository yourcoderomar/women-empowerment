const router = require('express').Router();
const { auth, role } = require('../../middleware/auth.middleware');
const controller = require('./review.controller');

router.get('/', controller.list);
router.post('/', auth, role('customer'), controller.create);
router.patch('/:id', auth, role('customer'), controller.loadOwn, controller.update);
router.delete('/:id', auth, role('customer'), controller.loadOwn, controller.remove);

module.exports = router;
