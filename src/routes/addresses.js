const router = require('express').Router();
const UserAddress = require('../models/UserAddress');
const { auth } = require('../middleware/auth');

router.use(auth);

// Loads the address and checks it belongs to the logged-in user.
async function mine(req, res, next) {
  req.address = await UserAddress.findById(req.params.id);
  if (req.address?.user_id !== req.user.user_id) return res.status(404).json({ message: 'Address not found' });
  next();
}

router.get('/', async (req, res) => res.json(await UserAddress.findAll({ user_id: req.user.user_id })));
router.get('/:id', mine, (req, res) => res.json(req.address));
router.post('/', async (req, res) => res.status(201).json(await UserAddress.create({ ...req.body, user_id: req.user.user_id })));
router.patch('/:id', mine, async (req, res) => res.json(await UserAddress.update(req.params.id, req.body)));
router.delete('/:id', mine, async (req, res) => {
  await UserAddress.remove(req.params.id);
  res.status(204).end();
});

module.exports = router;
