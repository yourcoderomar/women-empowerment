const Category = require('./category.model');

exports.list = async (req, res) => res.json(await Category.findAll(req.query));

exports.get = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
};

exports.create = async (req, res) => res.status(201).json(await Category.create(req.body));

exports.update = async (req, res) => {
  const category = await Category.update(req.params.id, req.body);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
};

exports.remove = async (req, res) => {
  if (!(await Category.remove(req.params.id))) return res.status(404).json({ message: 'Category not found' });
  res.status(204).end();
};
