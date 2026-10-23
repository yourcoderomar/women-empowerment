const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { transaction } = require('../db');
const User = require('../models/User');
const Customer = require('../models/Customer');
const ServiceProvider = require('../models/ServiceProvider');
const { auth } = require('../middleware/auth');

const sign = (p) => jwt.sign(
  { user_id: p.user_id, user_type: p.user_type, customer_id: p.customer_id, provider_id: p.provider_id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Body: full_name, email, password, phone_number, user_type (customer | provider | admin)
//   providers also send store_name (+ optional national_id); admins must send admin_secret matching ADMIN_SECRET.
router.post('/register', async (req, res) => {
  const { password, user_type = 'customer', store_name, national_id, admin_secret } = req.body;
  if (!['customer', 'provider', 'admin'].includes(user_type)) return res.status(400).json({ message: 'user_type must be customer, provider or admin' });
  if (user_type === 'admin' && (!process.env.ADMIN_SECRET || admin_secret !== process.env.ADMIN_SECRET)) {
    return res.status(403).json({ message: 'Wrong admin_secret' });
  }
  if (!password || String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (user_type === 'provider' && !store_name) return res.status(400).json({ message: 'store_name is required for providers' });

  const hash = await bcrypt.hash(String(password), 10);
  const { user_id } = await transaction(async (db) => {
    const user = await User.create({ ...req.body, user_type, password: hash }, db);
    if (user_type === 'customer') await Customer.create({ user_id: user.user_id }, db);
    if (user_type === 'provider') await ServiceProvider.create({ user_id: user.user_id, store_name, national_id }, db);
    return user;
  });
  const profile = await User.findProfile(user_id);
  res.status(201).json({ token: sign(profile), user: profile });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findByEmailWithPassword(email);
  if (!user || !(await bcrypt.compare(String(password), user.password))) {
    return res.status(401).json({ message: 'Wrong email or password' });
  }
  const profile = await User.findProfile(user.user_id);
  res.json({ token: sign(profile), user: profile });
});

router.get('/me', auth, async (req, res) => {
  res.json(await User.findProfile(req.user.user_id));
});

module.exports = router;
