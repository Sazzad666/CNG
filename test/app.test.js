'use strict';
const { closeDb } = require('./helpers');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

after(closeDb);

test('home page renders the brand and phone', async () => {
  const r = await request(app).get('/');
  assert.equal(r.status, 200);
  assert.match(r.text, /Click &amp; Grow|Click & Grow/);
  assert.match(r.text, /\+880 1732-508485/);
  assert.ok(r.headers['content-security-policy']);
});

test('healthz checks the database', async () => {
  const r = await request(app).get('/healthz');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true });
});

test('unknown page is a 404', async () => {
  const r = await request(app).get('/nope');
  assert.equal(r.status, 404);
  assert.match(r.text, /Page not found/);
});
