const express = require('express');
const items = require('./routes/items');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/foods', items(require('./models/FoodItem'), 'Food item'));
app.use('/api/crafts', items(require('./models/CraftItem'), 'Craft item'));
app.use('/api/services', items(require('./models/DomesticService'), 'Service'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/conversations', require('./routes/conversations'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Express 5 forwards async errors here automatically.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  if (err.status) return res.status(err.status).json({ message: err.message }); // httpError from a model
  if (err.code === '23505') return res.status(409).json({ message: `Already exists: ${err.detail}` });
  // Postgres classes 22 (bad data, e.g. "abc" as an id) and 23 (constraint violations) are client errors.
  if (/^2[23]/.test(err.code)) return res.status(400).json({ message: err.detail || err.message });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

module.exports = app;
