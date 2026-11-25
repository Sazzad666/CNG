'use strict';
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const config = require('../config');
const { pool } = require('../db');
const auth = require('./auth');
const store = require('../leads/store');

const router = express.Router();
const sessionStore = new MySQLStore({ createDatabaseTable: true, clearExpired: true, checkExpirationInterval: 15 * 60e3 }, pool);

router.use('/admin', session({
  name: 'cg_admin', secret: config.sessionSecret, store: sessionStore, resave: false, saveUninitialized: false, rolling: true,
  cookie: { httpOnly: true, sameSite: 'strict', secure: config.isProd, maxAge: 60 * 60e3, path: '/admin' },
}), auth.loadUser, auth.csrf, (req, res, next) => {
  res.set('Cache-Control', 'no-store').set('X-Robots-Tag', 'noindex, nofollow');
  res.locals.STATUSES = store.STATUSES;
  res.locals.serviceLabel = (k) => (config.site.services.find((s) => s.key === k) || {}).label || k || '—';
  next();
});

router.get('/admin/login', (req, res) => {
  if (req.user) return res.redirect('/admin');
  res.render('admin/login', { error: null, username: '' });
});
router.post('/admin/login', async (req, res, next) => {
  try {
    const r = await auth.login(req.body.username, req.body.password, req.ip);
    if (r.error) return res.status(401).render('admin/login', { error: r.error, username: req.body.username || '' });
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.adminId = r.user.id;
      res.redirect(302, '/admin');
    });
  } catch (e) { next(e); }
});
router.post('/admin/logout', (req, res) => req.session.destroy(() => res.redirect('/admin/login')));

router.use('/admin', auth.requireStaff);

router.get('/admin', async (req, res, next) => {
  try { res.render('admin/dashboard', { c: await store.countsBy() }); } catch (e) { next(e); }
});

router.get('/admin/leads', async (req, res, next) => {
  try { res.render('admin/leads', { f: req.query, list: await store.listLeads(req.query) }); } catch (e) { next(e); }
});

const CSV_COLS = ['id', 'created_at', 'type', 'status', 'name', 'phone', 'email', 'service', 'budget', 'website', 'message', 'answers', 'source_page', 'utm_source', 'utm_medium', 'utm_campaign', 'referrer'];
const csvCell = (v) => {
  if (v == null) return '';
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;   // stop spreadsheet formula injection
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
router.get('/admin/leads.csv', async (req, res, next) => {
  try {
    const rows = await store.allLeads(req.query);
    const body = [CSV_COLS.join(','), ...rows.map((r) => CSV_COLS.map((c) => csvCell(r[c])).join(','))].join('\n');
    const day = new Date().toISOString().slice(0, 10);
    res.set('Content-Type', 'text/csv; charset=utf-8').set('Content-Disposition', `attachment; filename="click-and-grow-leads-${day}.csv"`);
    res.send('﻿' + body + '\n');
  } catch (e) { next(e); }
});

router.get('/admin/leads/:id(\\d+)', async (req, res, next) => {
  try {
    const lead = await store.getLead(Number(req.params.id));
    if (!lead) return res.status(404).render('admin/message', { title: 'Lead not found', text: 'It may have been removed.' });
    res.render('admin/lead', { lead });
  } catch (e) { next(e); }
});
router.post('/admin/leads/:id(\\d+)', async (req, res, next) => {
  try {
    await store.updateLead(Number(req.params.id), { status: req.body.status, note: req.body.note }, req.user.id);
    res.redirect(303, `/admin/leads/${req.params.id}`);
  } catch (e) { next(e); }
});

router.sessionStore = sessionStore;
module.exports = router;
