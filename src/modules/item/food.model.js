const ItemModel = require('./item.model');

class FoodModel extends ItemModel {
  constructor() {
    super('food_items', 'food_item_id', [
      'category_id', 'title', 'description', 'price', 'stock_quantity', 'is_available', 'preparation_time_min', 'nutrition_facts',
    ], 'price');
  }
}

module.exports = new FoodModel();
