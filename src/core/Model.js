const { query, one } = require('../db/connection');

// Parent class of every model. It gives each table the five basic CRUD operations:
//   findAll, findById, create, update, remove
// A child class only says which table it uses, and adds its own methods for anything special.
//
//   table            the table name, e.g. 'categories'
//   idColumn         its primary key, e.g. 'category_id'
//   fields           columns a request may set on create AND update
//   createOnlyFields columns set once on create (owner ids etc.), never changed by update
//
// Only listed columns are ever written, so extra fields sent in a request body are ignored.
class Model {
  constructor(table, idColumn, fields = [], createOnlyFields = []) {
    this.table = table;
    this.idColumn = idColumn;
    this.fields = fields;
    this.createOnlyFields = createOnlyFields;
    this.columns = '*'; // what SELECT returns; a child can hide columns (see UserModel)
  }

  // The allowed columns that `data` actually has a value for.
  pick(data, allowed) {
    return allowed.filter((column) => data[column] !== undefined);
  }

  // READ all rows, optionally filtered, e.g. findAll({ user_id: 3 })
  findAll(filters = {}) {
    const columns = this.pick(filters, [this.idColumn, ...this.fields, ...this.createOnlyFields]);
    const where = columns.length ? 'WHERE ' + columns.map((c) => `${c} = ?`).join(' AND ') : '';
    // 'true' / 'false' from a URL (?is_booked=false) become 1 / 0 for BOOLEAN columns.
    const values = columns.map((c) => ({ true: 1, false: 0 })[filters[c]] ?? filters[c]);
    return query(`SELECT ${this.columns} FROM ${this.table} ${where} ORDER BY ${this.idColumn} DESC`, values);
  }

  // READ one row by id (undefined if there is none). Pass `db` to run inside a transaction.
  findById(id, db) {
    return one(`SELECT ${this.columns} FROM ${this.table} WHERE ${this.idColumn} = ?`, [id], db);
  }

  // CREATE a row and return it.
  async create(data, db) {
    const columns = this.pick(data, [...this.fields, ...this.createOnlyFields]);
    const { insertId } = await query(
      `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      columns.map((c) => data[c]),
      db
    );
    return this.findById(insertId, db);
  }

  // UPDATE some fields and return the row. Fields left out keep their value; null clears a field.
  async update(id, data) {
    const columns = this.pick(data, this.fields);
    if (columns.length) {
      await query(
        `UPDATE ${this.table} SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE ${this.idColumn} = ?`,
        [...columns.map((c) => data[c]), id]
      );
    }
    return this.findById(id);
  }

  // DELETE a row and return it (undefined if it did not exist).
  async remove(id) {
    const row = await this.findById(id);
    if (row) await query(`DELETE FROM ${this.table} WHERE ${this.idColumn} = ?`, [id]);
    return row;
  }
}

module.exports = Model;
