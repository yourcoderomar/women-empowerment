// Parent class of every controller. For a simple table it already handles the five CRUD requests:
//   GET /        → list      GET /:id    → get
//   POST /       → create    PATCH /:id  → update     DELETE /:id → remove
// A child class overrides a method when that request needs extra rules (ownership, validation, ...).
class Controller {
  constructor(model, name) {
    this.model = model; // a Model object, e.g. the Category model
    this.name = name;   // used in messages, e.g. 'Category not found'

    // Express calls handlers as plain functions (router.get('/', controller.list)), which loses `this`.
    // Binding every method once here keeps `this` pointing at this controller.
    for (let proto = Object.getPrototypeOf(this); proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key !== 'constructor' && !Object.hasOwn(this, key)) this[key] = this[key].bind(this);
      }
    }
  }

  notFound(res, message = `${this.name} not found`) {
    return res.status(404).json({ message });
  }

  async list(req, res) {
    res.json(await this.model.findAll(req.query));
  }

  async get(req, res) {
    const row = await this.model.findById(req.params.id);
    if (!row) return this.notFound(res);
    res.json(row);
  }

  async create(req, res) {
    res.status(201).json(await this.model.create(req.body));
  }

  async update(req, res) {
    const row = await this.model.update(req.params.id, req.body);
    if (!row) return this.notFound(res);
    res.json(row);
  }

  async remove(req, res) {
    if (!(await this.model.remove(req.params.id))) return this.notFound(res);
    res.status(204).end();
  }
}

module.exports = Controller;
