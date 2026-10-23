const crud = require('./crud');

module.exports = crud('customers', 'customer_id', [], ['user_id']);
