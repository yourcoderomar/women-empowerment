const Controller = require('../../core/Controller');
const Address = require('./address.model');

// Every user only sees and changes their own addresses.
class AddressController extends Controller {
  // Middleware: loads the address and checks it belongs to the logged-in user.
  async loadOwn(req, res, next) {
    req.address = await this.model.findById(req.params.id);
    if (req.address?.user_id !== req.user.user_id) return this.notFound(res);
    next();
  }

  async list(req, res) {
    res.json(await this.model.findAll({ user_id: req.user.user_id }));
  }

  get(req, res) {
    res.json(req.address); // already loaded by loadOwn
  }

  async create(req, res) {
    res.status(201).json(await this.model.create({ ...req.body, user_id: req.user.user_id }));
  }
  // update and remove are inherited from Controller.
}

module.exports = new AddressController(Address, 'Address');
