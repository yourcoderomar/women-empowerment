const { Router } = require('express');
const { auth, role, verifiedProvider } = require('../../middleware/auth.middleware');
const itemController = require('./item.controller');

// The same routes for /api/foods, /api/crafts and /api/services (see app.js).
module.exports = (Model, name) => {
  const router = Router();
  const controller = itemController(Model, name);

  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', auth, role('provider'), verifiedProvider, controller.create);
  router.patch('/:id', auth, role('provider'), controller.loadOwn, controller.update);
  router.delete('/:id', auth, role('provider'), controller.loadOwn, controller.remove);

  return router;
};
