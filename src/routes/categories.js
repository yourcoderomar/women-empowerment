const router = require('express').Router();
const Category = require('../models/Category');
const { auth, role } = require('../middleware/auth');

router.get('/', async (req, res) => res.json(await Category.findAll(req.query)));

router.get('/:id', async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
});

router.post('/', auth, role('admin'), async (req, res) => res.status(201).json(await Category.create(req.body)));

router.patch('/:id', auth, role('admin'), async (req, res) => {
  const category = await Category.update(req.params.id, req.body);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
});

router.delete('/:id', auth, role('admin'), async (req, res) => {
  if (!(await Category.remove(req.params.id))) return res.status(404).json({ message: 'Category not found' });
  res.status(204).end();
});

module.exports = router;
