module.exports = (req, res) => res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
