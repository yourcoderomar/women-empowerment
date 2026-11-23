const ItemModel = require('./item.model');

class FoodModel extends ItemModel {
  constructor() {
    super('food_items', 'food_item_id', [
      'category_id', 'title', 'description', 'price', 'stock_quantity', 'is_available', 'preparation_time_min', 'nutrition_facts', 'image_url',
    ], 'price');
  }
}

module.exports = new FoodModel();
