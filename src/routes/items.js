const { Router } = require('express');
const { auth, role, verifiedProvider } = require('../middleware/auth');

// The same CRUD routes for food, craft items and domestic services (see app.js).
module.exports = (Model, name) => {
  const router = Router();

  // Owner check: loads the item and makes sure it belongs to the logged-in provider.
  async function mine(req, res, next) {
    req.item = await Model.findById(req.params.id);
    if (req.item?.provider_id !== req.user.provider_id) return res.status(404).json({ message: `${name} not found or not yours` });
    next();
  }

  // Search & filter: ?q=cake&category_id=1&provider_id=2&min_price=10&max_price=100&sort=price
  router.get('/', async (req, res) => res.json(await Model.search(req.query)));

  router.get('/:id', async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) return res.status(404).json({ message: `${name} not found` });
    res.json(item);
  });

  router.post('/', auth, role('provider'), verifiedProvider, async (req, res) => {
    res.status(201).json(await Model.create({ ...req.body, provider_id: req.user.provider_id }));
  });

  router.patch('/:id', auth, role('provider'), mine, async (req, res) => res.json(await Model.update(req.params.id, req.body)));

  router.delete('/:id', auth, role('provider'), mine, async (req, res) => {
    await Model.remove(req.params.id);
    res.status(204).end();
  });

  return router;
};
