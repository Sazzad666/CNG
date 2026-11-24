'use strict';
// Test environment: a separate database, no SMTP, fast forms.
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'cng_test';
process.env.DB_USER = process.env.TEST_DB_USER || 'cng';
process.env.DB_PASS = process.env.TEST_DB_PASS || 'cng_dev_pw';
process.env.SMTP_HOST = '';
process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-123';

const TABLES = ['lead_events', 'leads', 'estimate_partials', 'admins', 'sessions'];

async function resetDb() {
  const { pool } = require('../src/db');
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of TABLES) {
    const [[exists]] = await pool.query('SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?', [t]);
    if (exists.n) await pool.query('TRUNCATE TABLE `' + t + '`');
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function closeDb() { await require('../src/db').pool.end(); }

module.exports = { resetDb, closeDb };
