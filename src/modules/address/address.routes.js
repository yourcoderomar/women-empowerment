const router = require('express').Router();
const { auth } = require('../../middleware/auth.middleware');
const controller = require('./address.controller');

router.use(auth);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.loadOwn, controller.get);
router.patch('/:id', controller.loadOwn, controller.update);
router.delete('/:id', controller.loadOwn, controller.remove);

module.exports = router;
