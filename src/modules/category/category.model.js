const Model = require('../../core/Model');

class CategoryModel extends Model {
  constructor() {
    super('categories', 'category_id', ['category_name', 'description', 'parent_category_id'], []);
  }
}

module.exports = new CategoryModel();
