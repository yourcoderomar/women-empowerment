const { many, one } = require('../db');

// Basic CRUD for one table, shared by most models.
//   editable: columns a request may set on create and update
//   fixed:    columns set once on create by the server (owner ids etc.), never changed by update
// Only listed columns are ever written, so extra fields in a request body are ignored.
module.exports = (table, id, editable, fixed = []) => {
  const pick = (data, allowed) => allowed.filter((c) => data[c] !== undefined);

  const model = {
    // Equality filters on any column, e.g. findAll({ user_id: 3 })
    findAll: (filters = {}) => {
      const cols = pick(filters, [id, ...editable, ...fixed]);
      const where = cols.length ? 'WHERE ' + cols.map((c, i) => `${c} = $${i + 1}`).join(' AND ') : '';
      return many(`SELECT * FROM ${table} ${where} ORDER BY ${id} DESC`, cols.map((c) => filters[c]));
    },

    findById: (value) => one(`SELECT * FROM ${table} WHERE ${id} = $1`, [value]),

    create: (data, db) => {
      const cols = pick(data, [...editable, ...fixed]);
      return one(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
        cols.map((c) => data[c]),
        db
      );
    },

    // Partial update: fields left out keep their value; null clears a field.
    update: (value, data) => {
      const cols = pick(data, editable);
      if (!cols.length) return model.findById(value);
      return one(
        `UPDATE ${table} SET ${cols.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE ${id} = $1 RETURNING *`,
        [value, ...cols.map((c) => data[c])]
      );
    },

    remove: (value) => one(`DELETE FROM ${table} WHERE ${id} = $1 RETURNING *`, [value]),
  };
  return model;
};
