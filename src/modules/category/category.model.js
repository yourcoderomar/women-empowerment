const crud = require('../../utils/crud.factory');

module.exports = crud('categories', 'category_id', ['category_name', 'description', 'parent_category_id']);
