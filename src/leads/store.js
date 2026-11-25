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

// ---- Admin queries -------------------------------------------------------
const STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'];
const PAGE_SIZE = 25;

function where(f) {
  const w = [], p = [];
  if (['enquiry', 'estimate', 'audit'].includes(f.type)) { w.push('type = ?'); p.push(f.type); }
  if (STATUSES.includes(f.status)) { w.push('status = ?'); p.push(f.status); }
  if (f.service) { w.push('service = ?'); p.push(String(f.service)); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(f.from || '')) { w.push('created_at >= ?'); p.push(f.from + ' 00:00:00'); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(f.to || '')) { w.push('created_at <= ?'); p.push(f.to + ' 23:59:59'); }
  const q = String(f.q || '').trim().slice(0, 100);
  if (q) {
    const like = '%' + q.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
    w.push('(name LIKE ? OR phone LIKE ? OR email LIKE ? OR website LIKE ?)'); p.push(like, like.replace(/[\s-]/g, ''), like, like);
  }
  return { sql: w.length ? 'WHERE ' + w.join(' AND ') : '', params: p };
}

/** → { rows, total, page, pages } */
async function listLeads(f = {}) {
  const { sql, params } = where(f);
  const page = Math.max(1, parseInt(f.page, 10) || 1);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM leads ${sql}`, params);
  const [rows] = await pool.query(
    `SELECT id, type, status, name, phone, email, service, budget, website, source_page, utm_source, created_at FROM leads ${sql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Every matching lead (for CSV), newest first. */
async function allLeads(f = {}) {
  const { sql, params } = where(f);
  const [rows] = await pool.query(`SELECT * FROM leads ${sql} ORDER BY id DESC LIMIT 20000`, params);
  return rows;
}

/** → lead with .answers parsed and .events (newest first), or null */
async function getLead(id) {
  const [[lead]] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
  if (!lead) return null;
  if (typeof lead.answers === 'string') { try { lead.answers = JSON.parse(lead.answers); } catch (_) { /* keep raw */ } }
  const [events] = await pool.query(
    'SELECT e.*, COALESCE(a.full_name, a.username) admin_name FROM lead_events e LEFT JOIN admins a ON a.id = e.admin_id WHERE e.lead_id = ? ORDER BY e.id DESC',
    [id],
  );
  lead.events = events;
  return lead;
}

/** Status change and/or note, each logged with the admin who made it. */
async function updateLead(id, { status, note }, adminId) {
  const [[lead]] = await pool.query('SELECT status FROM leads WHERE id = ?', [id]);
  if (!lead) return false;
  if (STATUSES.includes(status) && status !== lead.status) {
    await pool.query('UPDATE leads SET status = ? WHERE id = ?', [status, id]);
    await pool.query('INSERT INTO lead_events (lead_id, admin_id, kind, detail) VALUES (?, ?, ?, ?)', [id, adminId, 'status', `${lead.status} → ${status}`]);
  }
  const text = String(note || '').trim().slice(0, 2000);
  if (text) await pool.query('INSERT INTO lead_events (lead_id, admin_id, kind, detail) VALUES (?, ?, ?, ?)', [id, adminId, 'note', text]);
  return true;
}

async function countsBy() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) total FROM leads');
  const [byType] = await pool.query('SELECT type k, COUNT(*) n FROM leads GROUP BY type');
  const [byStatus] = await pool.query('SELECT status k, COUNT(*) n FROM leads GROUP BY status');
  const [bySource] = await pool.query("SELECT COALESCE(NULLIF(utm_source, ''), 'direct / organic') k, COUNT(*) n FROM leads GROUP BY k ORDER BY n DESC LIMIT 8");
  const [byWeek] = await pool.query("SELECT DATE_FORMAT(created_at - INTERVAL WEEKDAY(created_at) DAY, '%Y-%m-%d') k, COUNT(*) n FROM leads WHERE created_at >= NOW() - INTERVAL 12 WEEK GROUP BY k ORDER BY k");
  const [partialsByStep] = await pool.query('SELECT last_step k, COUNT(*) n FROM estimate_partials WHERE created_at >= NOW() - INTERVAL 30 DAY GROUP BY last_step ORDER BY last_step');
  return { total, byType, byStatus, bySource, byWeek, partialsByStep };
}

Object.assign(module.exports, { listLeads, allLeads, getLead, updateLead, countsBy, STATUSES });
