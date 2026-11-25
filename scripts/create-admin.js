'use strict';
// Create or reset a staff login. Usage: npm run create-admin -- <username> "<Full Name>" [email]
// The password is asked for on the terminal (never passed as an argument).
const readline = require('readline');
const { pool } = require('../src/db');
const { hash, strongPassword } = require('../src/admin/auth');

const [username, fullName, email] = process.argv.slice(2);
if (!username) { console.error('Usage: npm run create-admin -- <username> "<Full Name>" [email]'); process.exit(1); }

function ask(q) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl._writeToOutput = (s) => { if (s.startsWith(q)) rl.output.write(s); };
    rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); resolve(a); });
  });
}

(async () => {
  const p = process.env.ADMIN_PASSWORD || await ask('Password (12+ chars, upper, lower, digit): ');
  if (!strongPassword(p)) throw new Error('Password too weak: use 12+ characters with upper case, lower case and a digit.');
  await pool.query(
    `INSERT INTO admins (username, full_name, email, password_hash) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), password_hash = VALUES(password_hash), is_active = 1, failed_attempts = 0, locked_until = NULL`,
    [username, fullName || username, email || null, await hash(p)],
  );
  console.log(`Admin "${username}" is ready. Sign in at /admin/login`);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
