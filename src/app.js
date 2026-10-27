const express = require('express');
const itemRoutes = require('./modules/item/item.routes');
const notFound = require('./middleware/not-found.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/user/user.routes'));
app.use('/api/addresses', require('./modules/address/address.routes'));
app.use('/api/categories', require('./modules/category/category.routes'));
app.use('/api/providers', require('./modules/provider/provider.routes'));
app.use('/api/documents', require('./modules/document/document.routes'));
app.use('/api/foods', itemRoutes(require('./modules/item/food.model'), 'Food item'));
app.use('/api/crafts', itemRoutes(require('./modules/item/craft.model'), 'Craft item'));
app.use('/api/services', itemRoutes(require('./modules/item/service.model'), 'Service'));
app.use('/api/slots', require('./modules/slot/slot.routes'));
app.use('/api/orders', require('./modules/order/order.routes'));
app.use('/api/payments', require('./modules/payment/payment.routes'));
app.use('/api/reviews', require('./modules/review/review.routes'));
app.use('/api/conversations', require('./modules/chat/chat.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
