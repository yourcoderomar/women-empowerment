const item = require('./item.model');

module.exports = item('craft_items', 'craft_item_id', [
  'category_id', 'title', 'description', 'price', 'stock_quantity', 'customizable', 'material_used',
], 'price');
