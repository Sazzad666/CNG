'use strict';
// Admin sign-in (ported from the Expo site, one role). Lockout per account and per address.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const MAX_ATTEMPTS = 5, LOCK_MINUTES = 15;
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO8sNvoh4oQYH0B7uW5FKX0wqT8wK0Vf.';
const IP_MAX = 20, IP_WINDOW = 15 * 60e3, ipFails = new Map();

function strongPassword(p) { return typeof p === 'string' && p.length >= 12 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p); }
function ipBlocked(ip) {
  const e = ipFails.get(ip);
  if (e && Date.now() - e.first > IP_WINDOW) { ipFails.delete(ip); return false; }
  return !!e && e.n >= IP_MAX;
}
function ipFail(ip) {
  const e = ipFails.get(ip);
  if (!e || Date.now() - e.first > IP_WINDOW) ipFails.set(ip, { n: 1, first: Date.now() }); else e.n++;
  if (ipFails.size > 5000) ipFails.delete(ipFails.keys().next().value);
}

/** → { user } | { error } */
async function login(username, password, ip) {
  if (ipBlocked(ip)) return { error: 'Too many failed sign-ins from this network. Try again in 15 minutes.' };
  const generic = { error: 'Invalid username or password.' };
  const u = String(username || '').trim(), p = String(password || '');
  const [[a]] = await pool.query('SELECT *, (locked_until IS NOT NULL AND locked_until > NOW()) is_locked FROM admins WHERE username = ? OR email = ? LIMIT 1', [u, u]);
  if (!a) { await bcrypt.compare(p, DUMMY_HASH); ipFail(ip); return generic; }
  if (!a.is_active) { ipFail(ip); return generic; }
  if (a.is_locked) return { error: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.` };
  if (!(await bcrypt.compare(p, a.password_hash))) {
    const fails = a.failed_attempts + 1;
    if (fails >= MAX_ATTEMPTS) await pool.query('UPDATE admins SET failed_attempts = 0, locked_until = NOW() + INTERVAL ? MINUTE WHERE id = ?', [LOCK_MINUTES, a.id]);
    else await pool.query('UPDATE admins SET failed_attempts = ? WHERE id = ?', [fails, a.id]);
    ipFail(ip);
    return generic;
  }
  await pool.query('UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = ? WHERE id = ?', [ip, a.id]);
  ipFails.delete(ip);
  return { user: a };
}

async function loadUser(req, res, next) {
  try {
    req.user = null;
    if (req.session && req.session.adminId) {
      const [[a]] = await pool.query('SELECT id, username, full_name, is_active FROM admins WHERE id = ?', [req.session.adminId]);
      if (a && a.is_active) req.user = { id: a.id, username: a.username, name: a.full_name || a.username };
      else req.session.adminId = null;
    }
    res.locals.user = req.user;
    next();
  } catch (e) { next(e); }
}

function requireStaff(req, res, next) {
  if (req.user) return next();
  res.redirect('/admin/login');
}

/** Per-session token in a hidden field on every admin form. */
function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrf = req.session.csrf;
  if (req.method === 'POST') {
    const t = String((req.body && req.body._csrf) || '');
    const ok = t.length === req.session.csrf.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(req.session.csrf));
    if (!ok) return res.status(403).send('This form expired. Go back, refresh the page and try again.');
  }
  next();
}

const hash = (p) => bcrypt.hash(p, 12);

module.exports = { login, loadUser, requireStaff, csrf, strongPassword, hash };
