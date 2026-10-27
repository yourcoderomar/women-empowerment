const router = require('express').Router();
const { auth, role } = require('../../middleware/auth.middleware');
const controller = require('./category.controller');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', auth, role('admin'), controller.create);
router.patch('/:id', auth, role('admin'), controller.update);
router.delete('/:id', auth, role('admin'), controller.remove);

module.exports = router;
