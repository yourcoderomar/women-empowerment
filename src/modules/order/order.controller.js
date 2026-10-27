const Order = require('./order.model');

// Body: { items: [{ item_type: 'food' | 'craft' | 'service', item_id, quantity, slot_id }], delivery_address_id, special_instruction }
exports.create = async (req, res) => {
  res.status(201).json(await Order.create(req.user, req.body));
};

// My orders (as customer or provider): GET /api/orders?status=pending
exports.list = async (req, res) => res.json(await Order.findForUser(req.user, req.query.status));

exports.get = async (req, res) => {
  const order = await Order.findOneForUser(req.user, req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
};

// Allowed status changes: who can move an order from which state to which.
const transitions = {
  provider: { pending: ['accepted', 'cancelled'], accepted: ['in_progress'], in_progress: ['completed'] },
  customer: { pending: ['cancelled'] },
};

exports.setStatus = async (req, res) => {
  const order = await Order.findOneForUser(req.user, req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!transitions[req.user.user_type][order.status]?.includes(req.body.status)) {
    return res.status(400).json({ message: `Cannot change status from ${order.status} to ${req.body.status}` });
  }
  res.json(await Order.setStatus(order.order_id, req.body.status));
};
