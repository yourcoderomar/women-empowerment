const fs = require('fs');
const path = require('path');
const { Pool, types } = require('pg');

types.setTypeParser(1700, parseFloat); // return NUMERIC (prices, totals, ratings) as numbers, not strings
types.setTypeParser(1082, (v) => v); // return DATE as 'YYYY-MM-DD', not a timezone-shifted JS Date

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const init = () => pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// Shortcuts used by the models: all rows, or just the first one. Pass `db` to run inside a transaction.
const many = async (sql, params, db = pool) => (await db.query(sql, params)).rows;
const one = async (sql, params, db = pool) => (await db.query(sql, params)).rows[0];

// Runs fn(client) inside BEGIN/COMMIT; any error rolls everything back.
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// An error the error handler turns into this HTTP status + message.
const httpError = (status, message) => Object.assign(new Error(message), { status });

module.exports = { pool, init, many, one, transaction, httpError };
