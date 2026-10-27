// Fills the database with demo data (wipes existing data first). Run: npm run seed
const { pool, init, runFile } = require('./db');

(async () => {
  await init();
  await runFile('seed.sql');
  console.log('Demo data loaded. Log in with e.g. sara@example.com / password123');
  await pool.end();
})();
