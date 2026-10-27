const ServiceProvider = require('./provider.model');
const FoodItem = require('../item/food.model');
const CraftItem = require('../item/craft.model');
const DomesticService = require('../item/service.model');

// Verified providers, optional search by store name: GET /api/providers?q=sweet
exports.list = async (req, res) => res.json(await ServiceProvider.search(req.query.q));

// Public profile with everything the provider sells.
exports.get = async (req, res) => {
  const provider = await ServiceProvider.findPublic(req.params.id);
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  const filter = { provider_id: provider.provider_id };
  const [foods, crafts, services] = await Promise.all([FoodItem.search(filter), CraftItem.search(filter), DomesticService.search(filter)]);
  res.json({ ...provider, foods, crafts, services });
};

exports.updateMe = async (req, res) => {
  res.json(await ServiceProvider.update(req.user.provider_id, req.body));
};

// Admin: accept or reject a provider after checking their documents.
exports.setVerification = async (req, res) => {
  const provider = await ServiceProvider.setVerification(req.params.id, req.body.verification_status);
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  res.json(provider);
};
