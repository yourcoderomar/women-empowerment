const AppointmentSlot = require('./slot.model');
const DomesticService = require('../item/service.model');

const ownsService = async (req, serviceId) => (await DomesticService.findById(serviceId))?.provider_id === req.user.provider_id;

// Middleware: loads the slot and checks it belongs to one of the provider's services and is still free.
exports.loadOwn = async (req, res, next) => {
  req.slot = await AppointmentSlot.findById(req.params.id);
  if (!req.slot || !(await ownsService(req, req.slot.service_id))) return res.status(404).json({ message: 'Slot not found or not yours' });
  if (req.slot.is_booked) return res.status(400).json({ message: 'This slot is booked and cannot be changed' });
  next();
};

// A service's slots: GET /api/slots?service_id=1&is_booked=false
exports.list = async (req, res) => {
  if (!req.query.service_id) return res.status(400).json({ message: 'service_id query param is required' });
  res.json(await AppointmentSlot.findAll(req.query));
};

// Body: service_id, slot_date (YYYY-MM-DD), start_time, end_time (HH:MM)
exports.create = async (req, res) => {
  if (!(await ownsService(req, req.body.service_id))) return res.status(404).json({ message: 'Service not found or not yours' });
  res.status(201).json(await AppointmentSlot.create(req.body));
};

exports.update = async (req, res) => res.json(await AppointmentSlot.update(req.params.id, req.body));

exports.remove = async (req, res) => {
  await AppointmentSlot.remove(req.params.id);
  res.status(204).end();
};
