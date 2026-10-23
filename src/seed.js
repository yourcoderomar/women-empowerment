// Fills the database with demo data (wipes existing data first). Run: npm run seed
const fs = require('fs');
const path = require('path');
const { pool, init } = require('./db');

(async () => {
  await init();
  await pool.query(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));
  console.log('Demo data loaded. Log in with e.g. sara@example.com / password123');
  await pool.end();
})();
