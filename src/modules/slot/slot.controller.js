const Controller = require('../../core/Controller');
const Slot = require('./slot.model');
const DomesticService = require('../item/service.model');

class SlotController extends Controller {
  async ownsService(req, serviceId) {
    return (await DomesticService.findById(serviceId))?.provider_id === req.user.provider_id;
  }

  // Middleware: loads the slot and checks it belongs to one of the provider's services and is still free.
  async loadOwn(req, res, next) {
    req.slot = await this.model.findById(req.params.id);
    if (!req.slot || !(await this.ownsService(req, req.slot.service_id))) return this.notFound(res, 'Slot not found or not yours');
    if (req.slot.is_booked) return res.status(400).json({ message: 'This slot is booked and cannot be changed' });
    next();
  }

  // A service's slots: GET /api/slots?service_id=1&is_booked=false
  async list(req, res) {
    if (!req.query.service_id) return res.status(400).json({ message: 'service_id query param is required' });
    return super.list(req, res);
  }

  // Body: service_id, slot_date (YYYY-MM-DD), start_time, end_time (HH:MM)
  async create(req, res) {
    if (!(await this.ownsService(req, req.body.service_id))) return this.notFound(res, 'Service not found or not yours');
    return super.create(req, res);
  }
  // update and remove are inherited from Controller.
}

module.exports = new SlotController(Slot, 'Slot');
