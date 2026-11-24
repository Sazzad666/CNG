'use strict';
const { pool } = require('../db');

const COLS = ['type', 'name', 'phone', 'email', 'service', 'budget', 'message', 'website', 'answers',
  'source_page', 'utm_source', 'utm_medium', 'utm_campaign', 'referrer', 'ip_hash'];

/** Saves a validated lead. → new id */
async function insertLead(data) {
  const row = { ...data, answers: data.answers ? JSON.stringify(data.answers) : null };
  const [r] = await pool.query(
    `INSERT INTO leads (${COLS.join(', ')}) VALUES (${COLS.map(() => '?').join(', ')})`,
    COLS.map((c) => (row[c] === undefined ? null : row[c])),
  );
  return r.insertId;
}

/** Same phone and type within `minutes` → that lead's id, else null. Stops double submits. */
async function findRecentDuplicate(phone, type, minutes = 2) {
  const [[row]] = await pool.query(
    'SELECT id FROM leads WHERE phone = ? AND type = ? AND created_at >= NOW() - INTERVAL ? MINUTE ORDER BY id DESC LIMIT 1',
    [phone, type, minutes],
  );
  return row ? row.id : null;
}

async function savePartial(answers, lastStep) {
  const [r] = await pool.query('INSERT INTO estimate_partials (answers, last_step) VALUES (?, ?)', [JSON.stringify(answers), lastStep]);
  return r.insertId;
}

async function markAlert(id, result) {
  if (result.sent) await pool.query('UPDATE leads SET alert_sent = 1 WHERE id = ?', [id]);
  await pool.query('INSERT INTO lead_events (lead_id, kind, detail) VALUES (?, ?, ?)',
    [id, 'alert', result.sent ? 'Alert email sent' : `Alert email not sent (${result.reason})`]);
}

module.exports = { insertLead, findRecentDuplicate, savePartial, markAlert };
