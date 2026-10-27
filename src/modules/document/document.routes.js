const router = require('express').Router();
const { auth, role } = require('../../middleware/auth.middleware');
const controller = require('./document.controller');

router.use(auth);

router.get('/', role('provider', 'admin'), controller.list);
router.post('/', role('provider'), controller.create);
router.delete('/:id', role('provider'), controller.remove);

module.exports = router;
