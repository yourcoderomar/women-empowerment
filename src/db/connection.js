const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// DATABASE_URL like mysql://root:@localhost:3306/women_platform (XAMPP's root has no password by default)
const options = {
  uri: process.env.DATABASE_URL,
  decimalNumbers: true, // DECIMAL (prices, totals, ratings) as numbers, not strings
  dateStrings: true, // DATE / DATETIME as text ('2026-12-01'), not timezone-shifted JS Dates
  // BOOLEAN columns are TINYINT(1) in MySQL: return them as true/false instead of 1/0
  typeCast: (field, next) => {
    if (field.type !== 'TINY' || field.length !== 1) return next();
    const v = field.string();
    return v === null ? null : v === '1';
  },
};

const pool = mysql.createPool(options);

// Strict mode on every connection: bad values (text in a number column, too-long text) are errors, not silently changed.
pool.on('connection', (conn) => conn.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION'"));

// Runs a .sql file from this folder (several statements at once).
async function runFile(name) {
  const conn = await mysql.createConnection({ ...options, multipleStatements: true });
  try {
    await conn.query(fs.readFileSync(path.join(__dirname, name), 'utf8'));
  } finally {
    await conn.end();
  }
}

const init = () => runFile('schema.sql');

// Shortcuts used by the models. Pass `db` to run inside a transaction.
//   query: SELECT → rows; INSERT/UPDATE/DELETE → { insertId, affectedRows }
//   one:   first row or undefined
const query = async (sql, params, db = pool) => (await db.query(sql, params))[0];
const one = async (sql, params, db = pool) => (await query(sql, params, db))[0];

// Runs fn(connection) inside a transaction; any error rolls everything back.
async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// An error the error handler turns into this HTTP status + message.
const httpError = (status, message) => Object.assign(new Error(message), { status });

module.exports = { pool, init, runFile, query, one, transaction, httpError };
