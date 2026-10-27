const { query, one } = require('../db/connection');

// Basic CRUD for one table, shared by most models.
//   editable: columns a request may set on create and update
//   fixed:    columns set once on create by the server (owner ids etc.), never changed by update
// Only listed columns are ever written, so extra fields in a request body are ignored.
module.exports = (table, id, editable, fixed = []) => {
  const pick = (data, allowed) => allowed.filter((c) => data[c] !== undefined);

  const model = {
    // Equality filters on any column, e.g. findAll({ user_id: 3 }). 'true' / 'false' from a URL match BOOLEAN columns.
    findAll: (filters = {}) => {
      const cols = pick(filters, [id, ...editable, ...fixed]);
      const where = cols.length ? 'WHERE ' + cols.map((c) => `${c} = ?`).join(' AND ') : '';
      const values = cols.map((c) => ({ true: 1, false: 0 })[filters[c]] ?? filters[c]);
      return query(`SELECT * FROM ${table} ${where} ORDER BY ${id} DESC`, values);
    },

    findById: (value, db) => one(`SELECT * FROM ${table} WHERE ${id} = ?`, [value], db),

    create: async (data, db) => {
      const cols = pick(data, [...editable, ...fixed]);
      const { insertId } = await query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
        cols.map((c) => data[c]),
        db
      );
      return model.findById(insertId, db);
    },

    // Partial update: fields left out keep their value; null clears a field.
    update: async (value, data) => {
      const cols = pick(data, editable);
      if (cols.length) {
        await query(`UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE ${id} = ?`, [...cols.map((c) => data[c]), value]);
      }
      return model.findById(value);
    },

    // Returns the deleted row (undefined if there was none).
    remove: async (value) => {
      const row = await model.findById(value);
      if (row) await query(`DELETE FROM ${table} WHERE ${id} = ?`, [value]);
      return row;
    },
  };
  return model;
};
