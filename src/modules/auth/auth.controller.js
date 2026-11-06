const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { transaction } = require('../../db/connection');
const Controller = require('../../core/Controller');
const User = require('../user/user.model');
const Customer = require('../user/customer.model');
const Provider = require('../provider/provider.model');

class AuthController extends Controller {
  // The login token: who the user is and which customer / provider row they have.
  sign(profile) {
    return jwt.sign(
      { user_id: profile.user_id, user_type: profile.user_type, customer_id: profile.customer_id, provider_id: profile.provider_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Body: full_name, email, password, phone_number, user_type (customer | provider | admin)
  //   providers also send store_name (+ optional national_id); admins must send admin_secret matching ADMIN_SECRET.
  async register(req, res) {
    const { password, user_type = 'customer', store_name, national_id, admin_secret } = req.body;
    if (!['customer', 'provider', 'admin'].includes(user_type)) return res.status(400).json({ message: 'user_type must be customer, provider or admin' });
    if (user_type === 'admin' && (!process.env.ADMIN_SECRET || admin_secret !== process.env.ADMIN_SECRET)) {
      return res.status(403).json({ message: 'Wrong admin_secret' });
    }
    if (!password || String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (user_type === 'provider' && !store_name) return res.status(400).json({ message: 'store_name is required for providers' });

    const hash = await bcrypt.hash(String(password), 10);
    // The user and their customer / provider row are saved together, or not at all.
    const { user_id } = await transaction(async (db) => {
      const user = await this.model.create({ ...req.body, user_type, password: hash }, db);
      if (user_type === 'customer') await Customer.create({ user_id: user.user_id }, db);
      if (user_type === 'provider') await Provider.create({ user_id: user.user_id, store_name, national_id }, db);
      return user;
    });
    const profile = await this.model.findProfile(user_id);
    res.status(201).json({ token: this.sign(profile), user: profile });
  }

  async login(req, res) {
    const { email, password } = req.body;
    const user = await this.model.findByEmailWithPassword(email);
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ message: 'Wrong email or password' });
    }
    const profile = await this.model.findProfile(user.user_id);
    res.json({ token: this.sign(profile), user: profile });
  }

  async me(req, res) {
    res.json(await this.model.findProfile(req.user.user_id));
  }
}

module.exports = new AuthController(User, 'User');
