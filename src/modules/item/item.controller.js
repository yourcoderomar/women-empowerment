// The same handlers for food, craft items and domestic services; Model is one of food / craft / service.model.
module.exports = (Model, name) => ({
  // Middleware: loads the item and makes sure it belongs to the logged-in provider.
  loadOwn: async (req, res, next) => {
    req.item = await Model.findById(req.params.id);
    if (req.item?.provider_id !== req.user.provider_id) return res.status(404).json({ message: `${name} not found or not yours` });
    next();
  },

  // Search & filter: ?q=cake&category_id=1&provider_id=2&min_price=10&max_price=100&sort=price
  list: async (req, res) => res.json(await Model.search(req.query)),

  get: async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) return res.status(404).json({ message: `${name} not found` });
    res.json(item);
  },

  create: async (req, res) => {
    res.status(201).json(await Model.create({ ...req.body, provider_id: req.user.provider_id }));
  },

  update: async (req, res) => res.json(await Model.update(req.params.id, req.body)),

  remove: async (req, res) => {
    await Model.remove(req.params.id);
    res.status(204).end();
  },
});
