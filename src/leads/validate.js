'use strict';
// Pure validation for the three lead types. No I/O.
const site = require('../../config/site');

const TYPES = ['enquiry', 'estimate', 'audit'];
const SERVICE_KEYS = new Set(site.services.map((s) => s.key));
const BUDGET_KEYS = new Set(site.budgets.map((b) => b.key));
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

const MSG = {
  name: 'Please tell us your name.',
  phone: 'Enter a Bangladeshi mobile number, like 01712-345678.',
  email: 'That email doesn’t look right. Check for a typo.',
  emailRequired: 'We need an email to send your quote.',
  service: 'Choose a service from the list.',
  budget: 'Choose a budget range from the list.',
  website: 'Enter your website address, like yourbrand.com.',
  answers: 'Answer at least the first question so we can price it properly.',
};

/** '+880 1732-508485', '০১৭৩২৫০৮৪৮৫' … → '01732508485', or null if it isn't a BD mobile number. */
function normalizeBdPhone(input) {
  if (input == null) return null;
  let s = String(input).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).replace(/\D/g, '');
  if (s.startsWith('880')) s = s.slice(2);
  else if (s.startsWith('88') && s.length === 13) s = s.slice(2);
  return /^01[3-9]\d{8}$/.test(s) ? s : null;
}

/** Trim, collapse to null when empty, and cut to `max` characters (by code point, so emoji and Bangla stay whole). */
function clean(v, max) {
  if (v == null) return null;
  const s = String(v).replace(/\s+/g, (m) => (m.includes('\n') ? '\n' : ' ')).trim();
  if (!s) return null;
  const chars = [...s];
  return chars.length > max ? chars.slice(0, max).join('').trim() : s;
}

function normalizeWebsite(v) {
  const s = clean(v, 300);
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : 'https://' + s;
  try {
    const u = new URL(withScheme);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname) || /\s/.test(s)) return null;
    return withScheme.replace(/\/$/, '');
  } catch (_) { return null; }
}

function parseAnswers(v) {
  if (v == null || v === '') return null;
  let o = v;
  if (typeof v === 'string') { try { o = JSON.parse(v); } catch (_) { return null; } }
  if (!o || typeof o !== 'object' || Array.isArray(o) || !Object.keys(o).length) return null;
  const json = JSON.stringify(o);
  return json.length <= 8000 ? o : null;
}

/** → { ok: true, data } | { ok: false, errors } */
function validateLead(type, body) {
  body = body || {};
  if (!TYPES.includes(type)) return { ok: false, errors: { type: 'Unknown form.' } };
  const errors = {};

  const name = clean(body.name, 120);
  if (!name) errors.name = MSG.name;

  const phone = normalizeBdPhone(body.phone);
  if (!phone) errors.phone = MSG.phone;

  let email = clean(body.email, 190);
  if (email) {
    email = email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = MSG.email;
  } else if (type === 'estimate') errors.email = MSG.emailRequired;

  const service = clean(body.service, 40);
  if (service && !SERVICE_KEYS.has(service)) errors.service = MSG.service;
  const budget = clean(body.budget, 20);
  if (budget && !BUDGET_KEYS.has(budget)) errors.budget = MSG.budget;

  let website = null;
  if (type === 'audit' || body.website) {
    website = normalizeWebsite(body.website);
    if (!website && type === 'audit') errors.website = MSG.website;
  }

  let answers = null;
  if (type === 'estimate') {
    answers = parseAnswers(body.answers);
    if (!answers) errors.answers = MSG.answers;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      type, name, phone, email: email || null, service: service || null, budget: budget || null,
      message: clean(body.message, 2000), website, answers,
      source_page: clean(body.source_page, 300), utm_source: clean(body.utm_source, 120),
      utm_medium: clean(body.utm_medium, 120), utm_campaign: clean(body.utm_campaign, 120),
      referrer: clean(body.referrer, 300),
    },
  };
}

module.exports = { normalizeBdPhone, validateLead, TYPES, MSG };
