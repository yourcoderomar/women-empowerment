const crud = require('./crud');

module.exports = crud('categories', 'category_id', ['category_name', 'description', 'parent_category_id']);
