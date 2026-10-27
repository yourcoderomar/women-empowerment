const crud = require('../../utils/crud.factory');

module.exports = crud('customers', 'customer_id', [], ['user_id']);
