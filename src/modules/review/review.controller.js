const Controller = require('../../core/Controller');
const Review = require('./review.model');
const Order = require('../order/order.model');
const ServiceProvider = require('../provider/provider.model');

// Every change to a review also recalculates the provider's average rating.
class ReviewController extends Controller {
  // A provider's reviews: GET /api/reviews?provider_id=1
  async list(req, res) {
    if (!req.query.provider_id) return res.status(400).json({ message: 'provider_id query param is required' });
    res.json(await this.model.findByProvider(req.query.provider_id));
  }

  // Middleware: loads the review and checks the logged-in customer wrote it.
  async loadOwn(req, res, next) {
    req.review = await this.model.findById(req.params.id);
    if (req.review?.customer_id !== req.user.customer_id) return this.notFound(res, 'Review not found or not yours');
    next();
  }

  // Body: order_id, rating (1-5), comment. Only for your own completed orders, once per order.
  async create(req, res) {
    const order = await Order.findOneForUser(req.user, req.body.order_id);
    if (!order || order.customer_id !== req.user.customer_id || order.status !== 'completed') {
      return res.status(403).json({ message: 'You can only review your own completed orders' });
    }
    const review = await this.model.create({ ...req.body, order_id: order.order_id, customer_id: order.customer_id, provider_id: order.provider_id });
    await ServiceProvider.updateRating(review.provider_id);
    res.status(201).json(review);
  }

  async update(req, res) {
    const review = await this.model.update(req.params.id, req.body);
    await ServiceProvider.updateRating(review.provider_id);
    res.json(review);
  }

  async remove(req, res) {
    await this.model.remove(req.params.id);
    await ServiceProvider.updateRating(req.review.provider_id);
    res.status(204).end();
  }
}

module.exports = new ReviewController(Review, 'Review');
