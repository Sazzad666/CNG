'use strict';
const { closeDb } = require('./helpers');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

after(closeDb);

test('home has every section, in order, with one h1', async () => {
  const r = await request(app).get('/');
  const ids = ['hero', 'garden', 'harvest', 'seasons', 'pots', 'estimate-teaser', 'testimonials', 'plant'];
  let last = -1;
  for (const id of ids) {
    const at = r.text.indexOf(`id="${id}"`);
    assert.ok(at > last, `#${id} present and after the previous section`);
    last = at;
  }
  assert.ok(r.text.indexOf('<header') < r.text.indexOf('id="hero"'));
  assert.ok(r.text.lastIndexOf('<footer') > r.text.indexOf('id="plant"'));
  assert.equal((r.text.match(/<h1[\s>]/g) || []).length, 1);
});

test('every enquiry opener still works without JavaScript', async () => {
  for (const url of ['/', '/services/web-design', '/work']) {
    const r = await request(app).get(url);
    const openers = r.text.match(/<a [^>]*data-open-enquiry[^>]*>/g) || [];
    assert.ok(openers.length >= 2, url);
    for (const tag of openers) assert.match(tag, /href="(\/contact[^"]*|#cta|#plant)"/, tag);
  }
});

test('logo is animated only in the header, with unique ids', async () => {
  const r = await request(app).get('/');
  assert.equal((r.text.match(/data-logo-animate/g) || []).length, 1);
  assert.equal((r.text.match(/id="cg-logo"/g) || []).length, 0);
});

test('demo testimonials and clients are tagged as samples', async () => {
  const r = await request(app).get('/');
  const testimonials = r.text.slice(r.text.indexOf('id="testimonials"'), r.text.indexOf('id="faq"'));
  assert.ok((testimonials.match(/Sample/g) || []).length >= 1);
});

test('the enquiry panel and the mobile action bar are on every public page', async () => {
  for (const url of ['/', '/about', '/services']) {
    const r = await request(app).get(url);
    assert.match(r.text, /id="enquiry-panel"/, url);
    assert.match(r.text, /data-mobile-bar/, url);
  }
});
