const Model = require('../../core/Model');

class CustomerModel extends Model {
  constructor() {
    super('customers', 'customer_id', [], ['user_id']);
  }
}

module.exports = new CustomerModel();
