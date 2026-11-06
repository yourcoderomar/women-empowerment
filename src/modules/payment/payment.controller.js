const Controller = require('../../core/Controller');
const Payment = require('./payment.model');
const Order = require('../order/order.model');

// ponytail: records payments only, no real card gateway. The provider confirms success (e.g. cash received).
class PaymentController extends Controller {
  // Payments of one of my orders: GET /api/payments?order_id=1
  async list(req, res) {
    if (!(await Order.findOneForUser(req.user, req.query.order_id))) return this.notFound(res, 'Order not found');
    res.json(await this.model.findAll({ order_id: req.query.order_id }));
  }

  // Body: order_id, payment_method (cash | card). The amount is the order total.
  async create(req, res) {
    const order = await Order.findOneForUser(req.user, req.body.order_id);
    if (!order || order.customer_id !== req.user.customer_id) return this.notFound(res, 'Order not found');
    if (order.status === 'cancelled') return res.status(400).json({ message: 'Cannot pay for a cancelled order' });
    res.status(201).json(await this.model.create({
      order_id: order.order_id, user_id: req.user.user_id, amount: order.total_amount, payment_method: req.body.payment_method,
    }));
  }

  // Provider marks a pending payment as success or failed.
  async setStatus(req, res) {
    const payment = await this.model.findById(req.params.id);
    const order = payment && await Order.findOneForUser(req.user, payment.order_id);
    if (!order || order.provider_id !== req.user.provider_id) return this.notFound(res);
    if (payment.payment_status !== 'pending' || !['success', 'failed'].includes(req.body.payment_status)) {
      return res.status(400).json({ message: `Cannot change payment from ${payment.payment_status} to ${req.body.payment_status}` });
    }
    res.json(await this.model.update(payment.transaction_id, { payment_status: req.body.payment_status }));
  }
}

module.exports = new PaymentController(Payment, 'Payment');
