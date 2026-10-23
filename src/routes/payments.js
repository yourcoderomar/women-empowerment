const router = require('express').Router();
const PaymentTransaction = require('../models/PaymentTransaction');
const Order = require('../models/Order');
const { auth, role } = require('../middleware/auth');

router.use(auth);

// ponytail: records payments only, no real card gateway. The provider confirms success (e.g. cash received).

// Payments of one of my orders: GET /api/payments?order_id=1
router.get('/', async (req, res) => {
  if (!(await Order.findOneForUser(req.user, req.query.order_id))) return res.status(404).json({ message: 'Order not found' });
  res.json(await PaymentTransaction.findAll({ order_id: req.query.order_id }));
});

// Body: order_id, payment_method (cash | card). The amount is the order total.
router.post('/', role('customer'), async (req, res) => {
  const order = await Order.findOneForUser(req.user, req.body.order_id);
  if (!order || order.customer_id !== req.user.customer_id) return res.status(404).json({ message: 'Order not found' });
  if (order.status === 'cancelled') return res.status(400).json({ message: 'Cannot pay for a cancelled order' });
  res.status(201).json(await PaymentTransaction.create({
    order_id: order.order_id, user_id: req.user.user_id, amount: order.total_amount, payment_method: req.body.payment_method,
  }));
});

// Provider marks a pending payment as success or failed.
router.patch('/:id/status', role('provider'), async (req, res) => {
  const payment = await PaymentTransaction.findById(req.params.id);
  const order = payment && await Order.findOneForUser(req.user, payment.order_id);
  if (!order || order.provider_id !== req.user.provider_id) return res.status(404).json({ message: 'Payment not found' });
  if (payment.payment_status !== 'pending' || !['success', 'failed'].includes(req.body.payment_status)) {
    return res.status(400).json({ message: `Cannot change payment from ${payment.payment_status} to ${req.body.payment_status}` });
  }
  res.json(await PaymentTransaction.update(payment.transaction_id, { payment_status: req.body.payment_status }));
});

module.exports = router;
