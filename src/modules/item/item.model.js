const { query } = require('../../db/connection');
const Model = require('../../core/Model');

// Parent class of the three things providers sell: food, craft items and domestic services.
// It inherits CRUD from Model and adds search and pricing, which all three share.
class ItemModel extends Model {
  constructor(table, idColumn, fields, priceColumn) {
    super(table, idColumn, fields, ['provider_id']);
    this.priceColumn = priceColumn;
  }

  // Price of one unit. DomesticServiceModel overrides this (polymorphism).
  unitPrice(row) {
    return row[this.priceColumn];
  }

  // Public search. Only items of verified providers are shown.
  // Filters: q, category_id, provider_id, min_price, max_price, sort (newest | price | -price | -rating)
  search({ q, category_id, provider_id, min_price, max_price, sort }) {
    const where = ["sp.verification_status = 'accepted'"], params = [];
    // Adds a condition; its value fills every ? in it.
    const add = (sql, value) => { where.push(sql); params.push(...sql.split('?').slice(1).map(() => value)); };

    if (q) add('(t.title LIKE ? OR t.description LIKE ?)', `%${q}%`);
    if (category_id) add('t.category_id = ?', category_id);
    if (min_price) add(`t.${this.priceColumn} >= ?`, min_price);
    if (max_price) add(`t.${this.priceColumn} <= ?`, max_price);
    if (provider_id) add('t.provider_id = ?', provider_id);
    else if (this.fields.includes('is_available')) where.push('t.is_available'); // a provider's own page shows everything

    const order = { price: `t.${this.priceColumn}`, '-price': `t.${this.priceColumn} DESC`, '-rating': 'sp.rating DESC' }[sort] || 't.created_at DESC';
    return query(
      `SELECT t.*, sp.store_name, sp.rating AS provider_rating
       FROM ${this.table} t JOIN service_providers sp ON sp.provider_id = t.provider_id
       WHERE ${where.join(' AND ')} ORDER BY ${order}`,
      params
    );
  }
}

module.exports = ItemModel;
