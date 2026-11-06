const { query, one } = require('../../db/connection');
const Model = require('../../core/Model');

// Public fields only: no national_id.
const PUBLIC = `SELECT sp.provider_id, sp.store_name, sp.rating, sp.verification_status, u.full_name, u.phone_number
  FROM service_providers sp JOIN users u ON u.user_id = sp.user_id`;

class ProviderModel extends Model {
  constructor() {
    super('service_providers', 'provider_id', ['store_name', 'national_id'], ['user_id']);
  }

  // Verified providers only, optional search by store name.
  search(q) {
    return query(
      `${PUBLIC} WHERE sp.verification_status = 'accepted' AND (? IS NULL OR sp.store_name LIKE CONCAT('%', ?, '%'))
       ORDER BY sp.rating DESC`,
      [q, q]
    );
  }

  findPublic(id) {
    return one(`${PUBLIC} WHERE sp.provider_id = ?`, [id]);
  }

  async setVerification(id, status) {
    await query('UPDATE service_providers SET verification_status = ? WHERE provider_id = ?', [status, id]);
    return this.findById(id);
  }

  // Recalculate the average rating from the reviews table.
  updateRating(id) {
    return query(
      `UPDATE service_providers
       SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE provider_id = ?), 0)
       WHERE provider_id = ?`,
      [id, id]
    );
  }
}

module.exports = new ProviderModel();
