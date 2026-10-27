const { query } = require('../../db/connection');
const crud = require('../../utils/crud.factory');

module.exports = {
  ...crud('reviews', 'review_id', ['rating', 'comment'], ['order_id', 'customer_id', 'provider_id']),

  findByProvider: (providerId) => query(
    `SELECT r.*, u.full_name AS customer_name FROM reviews r
     JOIN customers c ON c.customer_id = r.customer_id JOIN users u ON u.user_id = c.user_id
     WHERE r.provider_id = ? ORDER BY r.created_at DESC`,
    [providerId]
  ),
};
