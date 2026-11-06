const Controller = require('../../core/Controller');
const Order = require('./order.model');

// Allowed status changes: who can move an order from which state to which.
const TRANSITIONS = {
  provider: { pending: ['accepted', 'cancelled'], accepted: ['in_progress'], in_progress: ['completed'] },
  customer: { pending: ['cancelled'] },
};

class OrderController extends Controller {
  // Body: { items: [{ item_type: 'food' | 'craft' | 'service', item_id, quantity, slot_id }], delivery_address_id, special_instruction }
  async create(req, res) {
    res.status(201).json(await this.model.placeOrder(req.user, req.body));
  }

  // My orders (as customer or provider): GET /api/orders?status=pending
  async list(req, res) {
    res.json(await this.model.findForUser(req.user, req.query.status));
  }

  async get(req, res) {
    const order = await this.model.findOneForUser(req.user, req.params.id);
    if (!order) return this.notFound(res);
    res.json(order);
  }

  async setStatus(req, res) {
    const order = await this.model.findOneForUser(req.user, req.params.id);
    if (!order) return this.notFound(res);
    if (!TRANSITIONS[req.user.user_type][order.status]?.includes(req.body.status)) {
      return res.status(400).json({ message: `Cannot change status from ${order.status} to ${req.body.status}` });
    }
    res.json(await this.model.setStatus(order.order_id, req.body.status));
  }
}

module.exports = new OrderController(Order, 'Order');
