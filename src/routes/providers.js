const router = require('express').Router();
const ServiceProvider = require('../models/ServiceProvider');
const FoodItem = require('../models/FoodItem');
const CraftItem = require('../models/CraftItem');
const DomesticService = require('../models/DomesticService');
const { auth, role } = require('../middleware/auth');

// Verified providers, optional search by store name: GET /api/providers?q=sweet
router.get('/', async (req, res) => res.json(await ServiceProvider.search(req.query.q)));

// Public profile with everything the provider sells.
router.get('/:id', async (req, res) => {
  const provider = await ServiceProvider.findPublic(req.params.id);
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  const filter = { provider_id: provider.provider_id };
  const [foods, crafts, services] = await Promise.all([FoodItem.search(filter), CraftItem.search(filter), DomesticService.search(filter)]);
  res.json({ ...provider, foods, crafts, services });
});

router.patch('/me', auth, role('provider'), async (req, res) => {
  res.json(await ServiceProvider.update(req.user.provider_id, req.body));
});

// Admin: accept or reject a provider after checking their documents.
router.patch('/:id/verification', auth, role('admin'), async (req, res) => {
  const provider = await ServiceProvider.setVerification(req.params.id, req.body.verification_status);
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  res.json(provider);
});

module.exports = router;
