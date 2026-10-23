const crud = require('./crud');

module.exports = crud('payment_transactions', 'transaction_id', ['payment_status'], ['order_id', 'user_id', 'amount', 'payment_method']);
