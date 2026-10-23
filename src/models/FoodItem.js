const item = require('./item');

module.exports = item('food_items', 'food_item_id', [
  'category_id', 'title', 'description', 'price', 'stock_quantity', 'is_available', 'preparation_time_min', 'nutrition_facts',
], 'price');
