'use strict';
const { resetDb, closeDb } = require('./helpers');
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { pool } = require('../src/db');
const { hash } = require('../src/admin/auth');
const store = require('../src/leads/store');

const PASS = 'Correct-Horse-42';
let adminId;

async function seed() {
  const [r] = await pool.query('INSERT INTO admins (username, full_name, password_hash) VALUES (?, ?, ?)', ['sadia', 'Sadia Islam', await hash(PASS)]);
  adminId = r.insertId;
  const base = { email: null, service: null, budget: null, message: null, website: null, answers: null, source_page: '/', utm_source: null, utm_medium: null, utm_campaign: null, referrer: null, ip_hash: null };
  await store.insertLead({ ...base, type: 'enquiry', name: 'Rafiq Ahmed', phone: '01711111111', service: 'web-design', utm_source: 'facebook' });
  await store.insertLead({ ...base, type: 'audit', name: 'সাদিয়া ইসলাম 🌱', phone: '01822222222', website: 'https://shop.example' });
  await store.insertLead({ ...base, type: 'estimate', name: '<script>alert(1)</script>' + 'x'.repeat(80), phone: '01933333333', email: 'est@ex.co', answers: { pages: '6-15' } });
}

async function login(agent) {
  const page = await agent.get('/admin/login');
  const csrf = page.text.match(/name="_csrf" value="([^"]+)"/)[1];
  return agent.post('/admin/login').type('form').send({ username: 'sadia', password: PASS, _csrf: csrf });
}
const csrfOf = (html) => html.match(/name="_csrf" value="([^"]+)"/)[1];

beforeEach(async () => { await resetDb(); await seed(); });
after(closeDb);

test('admin pages need a login', async () => {
  const r = await request(app).get('/admin/leads');
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/admin/login');
});

test('wrong password shows a generic error; five failures lock the account', async () => {
  const agent = request.agent(app);
  for (let i = 0; i < 5; i++) {
    const page = await agent.get('/admin/login');
    const r = await agent.post('/admin/login').type('form').send({ username: 'sadia', password: 'wrong', _csrf: csrfOf(page.text) });
    assert.match(r.text, /Invalid username or password/);
  }
  const page = await agent.get('/admin/login');
  const r = await agent.post('/admin/login').type('form').send({ username: 'sadia', password: PASS, _csrf: csrfOf(page.text) });
  assert.match(r.text, /Too many failed attempts/);
});

test('login then list shows the leads, newest first', async () => {
  const agent = request.agent(app);
  const r = await login(agent);
  assert.equal(r.status, 302);
  const list = await agent.get('/admin/leads');
  assert.equal(list.status, 200);
  assert.match(list.text, /Rafiq Ahmed/);
  assert.match(list.text, /সাদিয়া ইসলাম 🌱/);
  assert.ok(list.text.indexOf('01933333333') < list.text.indexOf('01711111111'));
});

test('filters and search', async () => {
  const agent = request.agent(app);
  await login(agent);
  const audit = await agent.get('/admin/leads?type=audit&status=new');
  assert.match(audit.text, /01822222222/);
  assert.doesNotMatch(audit.text, /01711111111/);
  const q = await agent.get('/admin/leads?q=Rafiq');
  assert.match(q.text, /01711111111/);
  assert.doesNotMatch(q.text, /01822222222/);
  const byPhone = await agent.get('/admin/leads?q=0193');
  assert.match(byPhone.text, /01933333333/);
});

test('names render escaped', async () => {
  const agent = request.agent(app);
  await login(agent);
  const list = await agent.get('/admin/leads');
  assert.doesNotMatch(list.text, /<script>alert\(1\)<\/script>/);
  assert.match(list.text, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('status change and note are recorded with the admin', async () => {
  const agent = request.agent(app);
  await login(agent);
  const [[lead]] = await pool.query("SELECT id FROM leads WHERE phone = '01711111111'");
  const page = await agent.get('/admin/leads/' + lead.id);
  assert.equal(page.status, 200);
  const r = await agent.post('/admin/leads/' + lead.id).type('form').send({ status: 'contacted', note: 'Called, wants a call back Sunday', _csrf: csrfOf(page.text) });
  assert.equal(r.status, 303);
  const [[row]] = await pool.query('SELECT status FROM leads WHERE id = ?', [lead.id]);
  assert.equal(row.status, 'contacted');
  const [events] = await pool.query('SELECT * FROM lead_events WHERE lead_id = ? ORDER BY id', [lead.id]);
  assert.equal(events.length, 2);
  assert.ok(events.every((e) => e.admin_id === adminId));
  const detail = await agent.get('/admin/leads/' + lead.id);
  assert.match(detail.text, /Called, wants a call back Sunday/);
  assert.match(detail.text, /Sadia Islam/);
});

test('post without the CSRF token is refused', async () => {
  const agent = request.agent(app);
  await login(agent);
  const [[lead]] = await pool.query("SELECT id FROM leads WHERE phone = '01711111111'");
  const r = await agent.post('/admin/leads/' + lead.id).type('form').send({ status: 'won' });
  assert.equal(r.status, 403);
});

test('CSV export has a BOM, a header row and keeps Bangla', async () => {
  const agent = request.agent(app);
  await login(agent);
  const r = await agent.get('/admin/leads.csv').buffer(true).parse((res, cb) => { const b = []; res.on('data', (c) => b.push(c)); res.on('end', () => cb(null, Buffer.concat(b))); });
  assert.equal(r.status, 200);
  assert.match(r.headers['content-type'], /text\/csv/);
  const buf = r.body;
  assert.deepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  const text = buf.toString('utf8').slice(1);
  assert.match(text.split('\n')[0], /^id,created_at,type,status,name,phone,email/);
  assert.match(text, /সাদিয়া ইসলাম 🌱/);
});

test('dashboard shows counts', async () => {
  const agent = request.agent(app);
  await login(agent);
  const r = await agent.get('/admin');
  assert.equal(r.status, 200);
  assert.match(r.text, /data-total="3"/);
});
