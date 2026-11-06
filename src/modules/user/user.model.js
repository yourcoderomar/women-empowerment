const { query, one } = require('../../db/connection');
const Model = require('../../core/Model');

// A user plus their customer or provider row (whichever they have).
const PROFILE = `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.user_type, u.created_at,
    c.customer_id, c.loyalty_points,
    sp.provider_id, sp.store_name, sp.national_id, sp.rating, sp.verification_status
  FROM users u
  LEFT JOIN customers c ON c.user_id = u.user_id
  LEFT JOIN service_providers sp ON sp.user_id = u.user_id`;

class UserModel extends Model {
  constructor() {
    // Only name and phone can be edited; email, password and user_type are set once at registration.
    super('users', 'user_id', ['full_name', 'phone_number'], ['email', 'password', 'user_type']);
    this.columns = 'user_id, full_name, email, phone_number, user_type, created_at'; // never return the password
  }

  // Emails are stored in lower case so login is not case sensitive (overrides Model.create).
  create(data, db) {
    return super.create({ ...data, email: data.email?.toLowerCase().trim() }, db);
  }

  // Includes the password hash: only for checking login.
  findByEmailWithPassword(email) {
    return one('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase().trim()]);
  }

  findProfile(userId) {
    return one(`${PROFILE} WHERE u.user_id = ?`, [userId]);
  }

  // Admin list, e.g. ?user_type=provider&verification_status=pending
  findProfiles({ user_type, verification_status }) {
    return query(
      `${PROFILE} WHERE (? IS NULL OR u.user_type = ?) AND (? IS NULL OR sp.verification_status = ?)
       ORDER BY u.created_at DESC`,
      [user_type, user_type, verification_status, verification_status]
    );
  }
}

module.exports = new UserModel();
