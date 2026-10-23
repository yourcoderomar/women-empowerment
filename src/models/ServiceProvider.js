const { many, one } = require('../db');
const crud = require('./crud');

// Public fields only: no national_id.
const PUBLIC = `SELECT sp.provider_id, sp.store_name, sp.rating, sp.verification_status, u.full_name, u.phone_number
  FROM service_providers sp JOIN users u ON u.user_id = sp.user_id`;

module.exports = {
  ...crud('service_providers', 'provider_id', ['store_name', 'national_id'], ['user_id']),

  // Verified providers only, optional search by store name.
  search: (q) => many(
    `${PUBLIC} WHERE sp.verification_status = 'accepted' AND ($1::text IS NULL OR sp.store_name ILIKE '%' || $1 || '%')
     ORDER BY sp.rating DESC`,
    [q]
  ),

  findPublic: (id) => one(`${PUBLIC} WHERE sp.provider_id = $1`, [id]),

  setVerification: (id, status) => one(
    'UPDATE service_providers SET verification_status = $1 WHERE provider_id = $2 RETURNING *',
    [status, id]
  ),

  // Recalculate the average rating from the reviews table.
  updateRating: (id) => one(
    `UPDATE service_providers
     SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE provider_id = $1), 0)
     WHERE provider_id = $1 RETURNING *`,
    [id]
  ),
};
