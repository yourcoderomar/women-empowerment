// Turns any error into a JSON response. Express 5 forwards async errors here automatically.
module.exports = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  if (err.status) return res.status(err.status).json({ message: err.message }); // httpError from a model
  if (err.errno === 1062) return res.status(409).json({ message: `Already exists: ${err.sqlMessage}` });
  // MySQL errors caused by bad input: missing value, wrong type, out of range, too long, not in the ENUM list,
  // a foreign key pointing nowhere (or still in use), a CHECK rule broken (3819 MySQL, 4025 MariaDB).
  if ([1048, 1264, 1265, 1292, 1366, 1406, 1451, 1452, 3819, 4025].includes(err.errno)) {
    return res.status(400).json({ message: err.sqlMessage });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};
