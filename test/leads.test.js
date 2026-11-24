'use strict';
const { resetDb, closeDb } = require('./helpers');
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { pool } = require('../src/db');
const routes = require('../src/leads/routes');
const { sendLeadAlert } = require('../src/leads/notify');

const old = () => Date.now() - 5000;
const valid = (extra = {}) => ({ type: 'enquiry', name: 'Ayesha Rahman', phone: '01732-508485', service: 'web-design', _t: old(), ...extra });
const count = async (type) => (await pool.query('SELECT COUNT(*) n FROM leads' + (type ? ' WHERE type = ?' : ''), type ? [type] : []))[0][0].n;

beforeEach(async () => { await resetDb(); routes._resetLimits(); });
after(closeDb);

test('valid JSON enquiry is saved with status new', async () => {
  const r = await request(app).post('/api/leads').send(valid());
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true, redirect: '/thank-you?type=enquiry' });
  const [[row]] = await pool.query('SELECT * FROM leads');
  assert.equal(row.status, 'new');
  assert.equal(row.phone, '01732508485');
  assert.equal(row.service, 'web-design');
  assert.equal(row.ip_hash.length, 64);
});

test('invalid phone returns 422 with a field error', async () => {
  const r = await request(app).post('/api/leads').send(valid({ phone: '12345' }));
  assert.equal(r.status, 422);
  assert.equal(r.body.ok, false);
  assert.match(r.body.errors.phone, /Bangladeshi mobile/);
  assert.equal(await count(), 0);
});

test('form-encoded post redirects to thank-you (works without JS)', async () => {
  const r = await request(app).post('/api/leads').type('form').send(valid());
  assert.equal(r.status, 303);
  assert.equal(r.headers.location, '/thank-you?type=enquiry');
  assert.equal(await count(), 1);
});

test('form-encoded invalid post re-renders the form with errors and values', async () => {
  const r = await request(app).post('/api/leads').type('form').send(valid({ phone: 'x', name: 'Keep <me>' }));
  assert.equal(r.status, 422);
  assert.match(r.text, /Bangladeshi mobile/);
  assert.match(r.text, /value="Keep &lt;me&gt;"/);
});

test('honeypot filled: pretend success, save nothing', async () => {
  const r = await request(app).post('/api/leads').send(valid({ company_site: 'http://spam.example' }));
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.equal(await count(), 0);
});

test('form sent faster than 2 seconds: pretend success, save nothing', async () => {
  const r = await request(app).post('/api/leads').send(valid({ _t: Date.now() - 500 }));
  assert.equal(r.body.ok, true);
  assert.equal(await count(), 0);
});

test('double submit within 2 minutes saves one lead', async () => {
  const a = await request(app).post('/api/leads').send(valid());
  const b = await request(app).post('/api/leads').send(valid());
  assert.equal(a.body.ok, true);
  assert.equal(b.body.ok, true);
  assert.equal(await count(), 1);
});

test('same phone, different type is a new lead', async () => {
  await request(app).post('/api/leads').send(valid());
  await request(app).post('/api/leads').send(valid({ type: 'audit', website: 'mybrand.com.bd' }));
  assert.equal(await count(), 2);
  assert.equal(await count('audit'), 1);
});

test('rate limit: the 11th post from one address in 10 minutes gets 429', async () => {
  for (let i = 0; i < 10; i++) {
    const r = await request(app).post('/api/leads').send(valid({ phone: '0171234567' + i }));
    assert.equal(r.status, 200, 'post ' + i);
  }
  const r = await request(app).post('/api/leads').send(valid({ phone: '01812345678' }));
  assert.equal(r.status, 429);
  assert.match(r.body.message, /call us/i);
});

test('no SMTP configured: lead saved, alert skipped without throwing', async () => {
  const r = await request(app).post('/api/leads').send(valid());
  assert.equal(r.body.ok, true);
  assert.equal(await count(), 1);
  const res = await sendLeadAlert({ id: 1, type: 'enquiry', name: 'A', phone: '01732508485' });
  assert.deepEqual(res, { sent: false, reason: 'smtp-not-configured' });
});

test('estimate lead stores its answers as JSON', async () => {
  const r = await request(app).post('/api/leads').send(valid({ type: 'estimate', email: 'a@b.co', answers: { services: ['web-design'], pages: '6-15' } }));
  assert.equal(r.body.redirect, '/thank-you?type=estimate');
  const [[row]] = await pool.query('SELECT answers FROM leads');
  const answers = typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers;
  assert.equal(answers.pages, '6-15');
});

test('estimate partial is saved with its last step', async () => {
  const r = await request(app).post('/api/estimate-partial').send({ answers: { services: ['apps'] }, last_step: 2 });
  assert.deepEqual(r.body, { ok: true });
  const [[row]] = await pool.query('SELECT * FROM estimate_partials');
  assert.equal(row.last_step, 2);
});

test('thank-you copy depends on the lead type', async () => {
  assert.match((await request(app).get('/thank-you?type=enquiry')).text, /call you within one business day/);
  assert.match((await request(app).get('/thank-you?type=estimate')).text, /quote by email within 24 hours/);
  assert.match((await request(app).get('/thank-you?type=audit')).text, /audit within 2 business days/);
  assert.match((await request(app).get('/thank-you')).text, /call you within one business day/);
});

test('two identical submissions at the same moment save one lead', async () => {
  const [a, b] = await Promise.all([
    request(app).post('/api/leads').send(valid({ phone: '01755555555' })),
    request(app).post('/api/leads').send(valid({ phone: '01755555555' })),
  ]);
  assert.equal(a.body.ok, true);
  assert.equal(b.body.ok, true);
  assert.equal(await count(), 1);
});
