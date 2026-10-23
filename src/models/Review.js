const { many } = require('../db');
const crud = require('./crud');

module.exports = {
  ...crud('reviews', 'review_id', ['rating', 'comment'], ['order_id', 'customer_id', 'provider_id']),

  findByProvider: (providerId) => many(
    `SELECT r.*, u.full_name AS customer_name FROM reviews r
     JOIN customers c ON c.customer_id = r.customer_id JOIN users u ON u.user_id = c.user_id
     WHERE r.provider_id = $1 ORDER BY r.created_at DESC`,
    [providerId]
  ),
};
