const Controller = require('../../core/Controller');
const Category = require('./category.model');

// Categories need nothing beyond the basic CRUD that Controller already provides.
module.exports = new Controller(Category, 'Category');
