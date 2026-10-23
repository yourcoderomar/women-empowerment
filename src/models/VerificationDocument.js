const crud = require('./crud');

module.exports = crud('verification_documents', 'document_id', ['document_type', 'file_url'], ['provider_id']);
