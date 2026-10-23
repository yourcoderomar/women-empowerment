const { many } = require('../db');
const crud = require('./crud');

// Shared model for the three things providers sell: food, craft items and domestic services.
module.exports = (table, id, editable, priceColumn) => ({
  ...crud(table, id, editable, ['provider_id']),

  // Public search. Only items of verified providers are shown.
  // Filters: q, category_id, provider_id, min_price, max_price, sort (newest | price | -price | -rating)
  search: ({ q, category_id, provider_id, min_price, max_price, sort }) => {
    const where = ["sp.verification_status = 'accepted'"], params = [];
    const add = (sql, value) => { params.push(value); where.push(sql.replaceAll('?', `$${params.length}`)); };

    if (q) add('(t.title ILIKE ? OR t.description ILIKE ?)', `%${q}%`);
    if (category_id) add('t.category_id = ?', category_id);
    if (min_price) add(`t.${priceColumn} >= ?`, min_price);
    if (max_price) add(`t.${priceColumn} <= ?`, max_price);
    if (provider_id) add('t.provider_id = ?', provider_id);
    else if (editable.includes('is_available')) where.push('t.is_available'); // a provider's own page shows everything

    const order = { price: `t.${priceColumn}`, '-price': `t.${priceColumn} DESC`, '-rating': 'sp.rating DESC' }[sort] || 't.created_at DESC';
    return many(
      `SELECT t.*, sp.store_name, sp.rating AS provider_rating
       FROM ${table} t JOIN service_providers sp ON sp.provider_id = t.provider_id
       WHERE ${where.join(' AND ')} ORDER BY ${order}`,
      params
    );
  },
});
