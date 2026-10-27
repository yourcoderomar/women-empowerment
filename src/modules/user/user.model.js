const { query, one } = require('../../db/connection');

const COLS = 'user_id, full_name, email, phone_number, user_type, created_at'; // never the password

// A user plus their customer or provider row (whichever they have).
const PROFILE = `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.user_type, u.created_at,
    c.customer_id, c.loyalty_points,
    sp.provider_id, sp.store_name, sp.national_id, sp.rating, sp.verification_status
  FROM users u
  LEFT JOIN customers c ON c.user_id = u.user_id
  LEFT JOIN service_providers sp ON sp.user_id = u.user_id`;

const findById = (userId, db) => one(`SELECT ${COLS} FROM users WHERE user_id = ?`, [userId], db);

module.exports = {
  findById,

  create: async ({ full_name, email, password, phone_number, user_type }, db) => {
    const { insertId } = await query(
      'INSERT INTO users (full_name, email, password, phone_number, user_type) VALUES (?, ?, ?, ?, ?)',
      [full_name, email?.toLowerCase().trim(), password, phone_number, user_type],
      db
    );
    return findById(insertId, db);
  },

  // Includes the password hash — only for checking login.
  findByEmailWithPassword: (email) => one('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase().trim()]),

  findProfile: (userId) => one(`${PROFILE} WHERE u.user_id = ?`, [userId]),

  // Admin list, e.g. ?user_type=provider&verification_status=pending
  findProfiles: ({ user_type, verification_status }) => query(
    `${PROFILE} WHERE (? IS NULL OR u.user_type = ?) AND (? IS NULL OR sp.verification_status = ?)
     ORDER BY u.created_at DESC`,
    [user_type, user_type, verification_status, verification_status]
  ),

  // Partial update: fields left out keep their value.
  update: async (userId, { full_name, phone_number }) => {
    await query(
      'UPDATE users SET full_name = COALESCE(?, full_name), phone_number = COALESCE(?, phone_number) WHERE user_id = ?',
      [full_name, phone_number, userId]
    );
    return findById(userId);
  },

  remove: (userId) => query('DELETE FROM users WHERE user_id = ?', [userId]), // everything they own cascades
};
