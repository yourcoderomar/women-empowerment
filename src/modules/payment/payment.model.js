const Model = require('../../core/Model');

class PaymentModel extends Model {
  constructor() {
    super('payment_transactions', 'transaction_id', ['payment_status'], ['order_id', 'user_id', 'amount', 'payment_method']);
  }
}

module.exports = new PaymentModel();
