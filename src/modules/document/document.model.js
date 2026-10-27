const crud = require('../../utils/crud.factory');

module.exports = crud('verification_documents', 'document_id', ['document_type', 'file_url'], ['provider_id']);
