const router = require('express').Router();
const VerificationDocument = require('../models/VerificationDocument');
const { auth, role } = require('../middleware/auth');

router.use(auth);

// Providers see their own documents; admins see all, or one provider's with ?provider_id=
router.get('/', role('provider', 'admin'), async (req, res) => {
  const provider_id = req.user.user_type === 'admin' ? req.query.provider_id : req.user.provider_id;
  res.json(await VerificationDocument.findAll({ provider_id }));
});

// Body: document_type (id_card | criminal_record | birth_certificate), file_url
router.post('/', role('provider'), async (req, res) => {
  res.status(201).json(await VerificationDocument.create({ ...req.body, provider_id: req.user.provider_id }));
});

router.delete('/:id', role('provider'), async (req, res) => {
  const doc = await VerificationDocument.findById(req.params.id);
  if (doc?.provider_id !== req.user.provider_id) return res.status(404).json({ message: 'Document not found' });
  await VerificationDocument.remove(doc.document_id);
  res.status(204).end();
});

module.exports = router;
