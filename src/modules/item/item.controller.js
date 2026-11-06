const Controller = require('../../core/Controller');

// One controller class for food, craft items and domestic services; the model passed in decides which.
class ItemController extends Controller {
  // Middleware: loads the item and makes sure it belongs to the logged-in provider.
  async loadOwn(req, res, next) {
    req.item = await this.model.findById(req.params.id);
    if (req.item?.provider_id !== req.user.provider_id) return this.notFound(res, `${this.name} not found or not yours`);
    next();
  }

  // Search & filter: ?q=cake&category_id=1&provider_id=2&min_price=10&max_price=100&sort=price
  async list(req, res) {
    res.json(await this.model.search(req.query));
  }

  async create(req, res) {
    res.status(201).json(await this.model.create({ ...req.body, provider_id: req.user.provider_id }));
  }
  // get, update and remove are inherited from Controller.
}

module.exports = ItemController;
