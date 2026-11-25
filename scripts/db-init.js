'use strict';
// Creates the tables (idempotent). Usage: npm run db:init
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { db } = require('../src/config');

(async () => {
  const conn = await mysql.createConnection({ ...db, multipleStatements: true, charset: 'utf8mb4' });
  await conn.query(fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8'));
  await conn.end();
  console.log(`Schema ready in database "${db.database}".`);
})().catch((e) => { console.error(e.message); process.exit(1); });
