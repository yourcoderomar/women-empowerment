const { many, one } = require('../db');

const COLS = 'user_id, full_name, email, phone_number, user_type, created_at'; // never the password

// A user plus their customer or provider row (whichever they have).
const PROFILE = `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.user_type, u.created_at,
    c.customer_id, c.loyalty_points,
    sp.provider_id, sp.store_name, sp.national_id, sp.rating, sp.verification_status
  FROM users u
  LEFT JOIN customers c ON c.user_id = u.user_id
  LEFT JOIN service_providers sp ON sp.user_id = u.user_id`;

module.exports = {
  create: ({ full_name, email, password, phone_number, user_type }, db) => one(
    `INSERT INTO users (full_name, email, password, phone_number, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLS}`,
    [full_name, email?.toLowerCase().trim(), password, phone_number, user_type],
    db
  ),

  // Includes the password hash — only for checking login.
  findByEmailWithPassword: (email) => one('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase().trim()]),

  findProfile: (userId) => one(`${PROFILE} WHERE u.user_id = $1`, [userId]),

  // Admin list, e.g. ?user_type=provider&verification_status=pending
  findProfiles: ({ user_type, verification_status }) => many(
    `${PROFILE} WHERE ($1::text IS NULL OR u.user_type = $1) AND ($2::text IS NULL OR sp.verification_status = $2)
     ORDER BY u.created_at DESC`,
    [user_type, verification_status]
  ),

  // Partial update: fields left out keep their value.
  update: (userId, { full_name, phone_number }) => one(
    `UPDATE users SET full_name = COALESCE($1, full_name), phone_number = COALESCE($2, phone_number)
     WHERE user_id = $3 RETURNING ${COLS}`,
    [full_name, phone_number, userId]
  ),

  remove: (userId) => one('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]), // everything they own cascades
};
