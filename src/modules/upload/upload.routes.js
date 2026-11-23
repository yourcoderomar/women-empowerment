const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { Router } = require('express');
const { auth, role } = require('../../middleware/auth.middleware');
const { httpError } = require('../../db/connection');

const DIR = path.join(__dirname, '../../../uploads');
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
fs.mkdirSync(DIR, { recursive: true });

// POST /api/uploads: body is the raw image (Content-Type image/jpeg|png|webp, max 2 MB). Returns { url }.
// ponytail: local disk, move to object storage if the API runs on several machines.
const router = Router();
router.post('/', auth, role('provider'), express.raw({ type: Object.keys(TYPES), limit: '2mb' }), async (req, res) => {
  const ext = TYPES[req.headers['content-type']];
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) throw httpError(400, 'Send a JPEG, PNG or WebP image');
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.promises.writeFile(path.join(DIR, name), req.body);
  res.status(201).json({ url: `/uploads/${name}` });
});

module.exports = { router, DIR };
