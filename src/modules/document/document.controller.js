const Controller = require('../../core/Controller');
const Document = require('./document.model');

class DocumentController extends Controller {
  // Providers see their own documents; admins see all, or one provider's with ?provider_id=
  async list(req, res) {
    const provider_id = req.user.user_type === 'admin' ? req.query.provider_id : req.user.provider_id;
    res.json(await this.model.findAll({ provider_id }));
  }

  // Body: document_type (id_card | criminal_record | birth_certificate), file_url
  async create(req, res) {
    res.status(201).json(await this.model.create({ ...req.body, provider_id: req.user.provider_id }));
  }

  // Providers can only delete their own documents.
  async remove(req, res) {
    const doc = await this.model.findById(req.params.id);
    if (doc?.provider_id !== req.user.provider_id) return this.notFound(res);
    return super.remove(req, res);
  }
}

module.exports = new DocumentController(Document, 'Document');
