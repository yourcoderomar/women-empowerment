const VerificationDocument = require('./document.model');

// Providers see their own documents; admins see all, or one provider's with ?provider_id=
exports.list = async (req, res) => {
  const provider_id = req.user.user_type === 'admin' ? req.query.provider_id : req.user.provider_id;
  res.json(await VerificationDocument.findAll({ provider_id }));
};

// Body: document_type (id_card | criminal_record | birth_certificate), file_url
exports.create = async (req, res) => {
  res.status(201).json(await VerificationDocument.create({ ...req.body, provider_id: req.user.provider_id }));
};

exports.remove = async (req, res) => {
  const doc = await VerificationDocument.findById(req.params.id);
  if (doc?.provider_id !== req.user.provider_id) return res.status(404).json({ message: 'Document not found' });
  await VerificationDocument.remove(doc.document_id);
  res.status(204).end();
};
