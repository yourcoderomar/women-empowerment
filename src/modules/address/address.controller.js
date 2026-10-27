const UserAddress = require('./address.model');

// Middleware: loads the address and checks it belongs to the logged-in user.
exports.loadOwn = async (req, res, next) => {
  req.address = await UserAddress.findById(req.params.id);
  if (req.address?.user_id !== req.user.user_id) return res.status(404).json({ message: 'Address not found' });
  next();
};

exports.list = async (req, res) => res.json(await UserAddress.findAll({ user_id: req.user.user_id }));

exports.get = (req, res) => res.json(req.address);

exports.create = async (req, res) => {
  res.status(201).json(await UserAddress.create({ ...req.body, user_id: req.user.user_id }));
};

exports.update = async (req, res) => res.json(await UserAddress.update(req.params.id, req.body));

exports.remove = async (req, res) => {
  await UserAddress.remove(req.params.id);
  res.status(204).end();
};
