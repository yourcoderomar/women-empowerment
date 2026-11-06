const Controller = require('../../core/Controller');
const Provider = require('./provider.model');
const FoodItem = require('../item/food.model');
const CraftItem = require('../item/craft.model');
const DomesticService = require('../item/service.model');

class ProviderController extends Controller {
  // Verified providers, optional search by store name: GET /api/providers?q=sweet
  async list(req, res) {
    res.json(await this.model.search(req.query.q));
  }

  // Public profile with everything the provider sells.
  async get(req, res) {
    const provider = await this.model.findPublic(req.params.id);
    if (!provider) return this.notFound(res);
    const filter = { provider_id: provider.provider_id };
    const [foods, crafts, services] = await Promise.all([FoodItem.search(filter), CraftItem.search(filter), DomesticService.search(filter)]);
    res.json({ ...provider, foods, crafts, services });
  }

  async updateMe(req, res) {
    res.json(await this.model.update(req.user.provider_id, req.body));
  }

  // Admin: accept or reject a provider after checking their documents.
  async setVerification(req, res) {
    const provider = await this.model.setVerification(req.params.id, req.body.verification_status);
    if (!provider) return this.notFound(res);
    res.json(provider);
  }
}

module.exports = new ProviderController(Provider, 'Provider');
