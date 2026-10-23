const router = require('express').Router();
const Order = require('../models/Order');
const { auth, role } = require('../middleware/auth');

router.use(auth);

// Body: { items: [{ item_type: 'food' | 'craft' | 'service', item_id, quantity, slot_id }], delivery_address_id, special_instruction }
router.post('/', role('customer'), async (req, res) => {
  res.status(201).json(await Order.create(req.user, req.body));
});

// My orders (as customer or provider): GET /api/orders?status=pending
router.get('/', async (req, res) => res.json(await Order.findForUser(req.user, req.query.status)));

router.get('/:id', async (req, res) => {
  const order = await Order.findOneForUser(req.user, req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

// Allowed status changes: who can move an order from which state to which.
const transitions = {
  provider: { pending: ['accepted', 'cancelled'], accepted: ['in_progress'], in_progress: ['completed'] },
  customer: { pending: ['cancelled'] },
};

router.patch('/:id/status', role('customer', 'provider'), async (req, res) => {
  const order = await Order.findOneForUser(req.user, req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!transitions[req.user.user_type][order.status]?.includes(req.body.status)) {
    return res.status(400).json({ message: `Cannot change status from ${order.status} to ${req.body.status}` });
  }
  res.json(await Order.setStatus(order.order_id, req.body.status));
});

module.exports = router;
