'use strict';
const crypto = require('crypto');
const express = require('express');
const config = require('../config');
const { validateLead, TYPES } = require('./validate');
const store = require('./store');
const { sendLeadAlert } = require('./notify');

const router = express.Router();
const MIN_FILL_MS = 2000;

// Per-address limit: 10 lead posts per 10 minutes (one process; a restart clears it).
const LIMIT = 10, WINDOW = 10 * 60e3, hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.delete(hits.keys().next().value);
  return list.length > LIMIT;
}
const ipHash = (ip) => crypto.createHash('sha256').update(config.sessionSecret + '|' + (ip || '')).digest('hex');
const wantsJson = (req) => req.is('application/json') || (req.get('accept') || '').includes('application/json');

const THANKS = {
  enquiry: { title: 'Thanks — we’ve got your enquiry.', lead: `We’ll call you within one business day from ${config.site.phone}.` },
  estimate: { title: 'Thanks — your project is with us.', lead: 'You’ll get your quote by email within 24 hours, and we may call to clarify a detail or two.' },
  audit: { title: 'Thanks — your free audit is booked.', lead: 'You’ll get your audit within 2 business days, sent to the phone or email you gave us.' },
};

router.post('/api/leads', async (req, res, next) => {
  try {
    const body = req.body || {};
    const type = TYPES.includes(body.type) ? body.type : 'enquiry';
    const redirect = `/thank-you?type=${type}`;
    const success = () => (wantsJson(req) ? res.json({ ok: true, redirect }) : res.redirect(303, redirect));

    if (limited(req.ip)) {
      const message = `Too many submissions from your network. Please try again in a few minutes, or call us on ${config.site.phone}.`;
      return wantsJson(req) ? res.status(429).json({ ok: false, message }) : res.status(429).send(message);
    }
    // Bots: a filled hidden field, or a form sent faster than a person can type. Pretend it worked.
    const t = Number(body._t);
    if (body.company_site || !t || Date.now() - t < MIN_FILL_MS) return success();

    const v = validateLead(type, body);
    if (!v.ok) {
      if (wantsJson(req)) return res.status(422).json({ ok: false, errors: v.errors });
      return res.status(422).render('contact', { formType: type, values: body, errors: v.errors, meta: { title: 'Check your details — Click & Grow' } });
    }

    if (await store.findRecentDuplicate(v.data.phone, type)) return success();
    const lead = { ...v.data, ip_hash: ipHash(req.ip) };
    lead.id = await store.insertLead(lead);
    success();
    // After the response: the alert never delays or loses the lead.
    sendLeadAlert(lead).then((r) => store.markAlert(lead.id, r)).catch((e) => console.error('alert bookkeeping failed:', e.message));
  } catch (e) { next(e); }
});

router.post('/api/estimate-partial', async (req, res, next) => {
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const step = Number(body && body.last_step);
    const answers = body && body.answers;
    if (limited(req.ip) || !answers || typeof answers !== 'object' || !(step >= 1 && step <= 5) || JSON.stringify(answers).length > 8000) {
      return res.json({ ok: true });
    }
    await store.savePartial(answers, step);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/thank-you', (req, res) => {
  const type = THANKS[req.query.type] ? req.query.type : 'enquiry';
  res.set('X-Robots-Tag', 'noindex').render('thank-you', { type, thanks: THANKS[type], meta: { title: 'Thank you — Click & Grow' } });
});

router._resetLimits = () => hits.clear();
module.exports = router;
