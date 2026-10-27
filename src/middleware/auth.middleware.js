const jwt = require('jsonwebtoken');
const ServiceProvider = require('../modules/provider/provider.model');

// req.user = { user_id, user_type, customer_id, provider_id } (the id that doesn't apply is null)
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Login required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

const role = (...types) => (req, res, next) =>
  types.includes(req.user.user_type) ? next() : res.status(403).json({ message: `Only ${types.join(' or ')} accounts can do this` });

// Providers can only sell once an admin has accepted their verification documents.
async function verifiedProvider(req, res, next) {
  const provider = await ServiceProvider.findById(req.user.provider_id);
  if (provider?.verification_status !== 'accepted') {
    return res.status(403).json({ message: 'Your provider account must be verified by an admin first' });
  }
  next();
}

module.exports = { auth, role, verifiedProvider };
