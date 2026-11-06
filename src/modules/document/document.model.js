const Model = require('../../core/Model');

class DocumentModel extends Model {
  constructor() {
    super('verification_documents', 'document_id', ['document_type', 'file_url'], ['provider_id']);
  }
}

module.exports = new DocumentModel();
