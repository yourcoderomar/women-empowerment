const ItemModel = require('./item.model');

class CraftModel extends ItemModel {
  constructor() {
    super('craft_items', 'craft_item_id', [
      'category_id', 'title', 'description', 'price', 'stock_quantity', 'customizable', 'material_used',
    ], 'price');
  }
}

module.exports = new CraftModel();
