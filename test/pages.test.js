'use strict';
const { closeDb } = require('./helpers');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const content = require('../src/content');

after(closeDb);

const PAGES = ['/', '/services', '/services/web-design', '/services/branding', '/services/video', '/services/apps', '/services/growth',
  '/work', '/work/meridian-residences', '/about', '/estimate', '/contact', '/privacy', '/credits'];

test('every public page renders with its own title and a description', async () => {
  const titles = new Set();
  for (const url of PAGES) {
    const r = await request(app).get(url);
    assert.equal(r.status, 200, url);
    const title = (r.text.match(/<title>([^<]+)<\/title>/) || [])[1];
    assert.ok(title, url + ' has a title');
    assert.ok(!titles.has(title), url + ' title is unique: ' + title);
    titles.add(title);
    assert.match(r.text, /<meta name="description" content="[^"]{30,}"/, url);
    assert.equal((r.text.match(/<h1[\s>]/g) || []).length, 1, url + ' has exactly one h1');
  }
});

test('unknown service and project are 404s', async () => {
  assert.equal((await request(app).get('/services/tacos')).status, 404);
  assert.equal((await request(app).get('/work/nope')).status, 404);
});

test('a service page has the enquiry form with that service pre-selected', async () => {
  const r = await request(app).get('/services/branding');
  assert.match(r.text, /data-lead-form/);
  assert.match(r.text, /<option value="branding" selected>/);
  for (const item of content.service('branding').items) assert.ok(r.text.includes(`id="${item.id}"`), item.id);
});

test('every project page is marked as a sample', async () => {
  for (const p of content.projects()) {
    const r = await request(app).get('/work/' + p.slug);
    assert.equal(r.status, 200);
    assert.match(r.text, /Sample project/);
  }
});

test('sitemap lists every public page; robots blocks admin', async () => {
  const s = await request(app).get('/sitemap.xml');
  assert.match(s.headers['content-type'], /xml/);
  for (const url of PAGES.filter((u) => u !== '/credits')) assert.ok(s.text.includes(`<loc>http://localhost:3000${url === '/' ? '/' : url}</loc>`), url);
  for (const p of content.projects()) assert.ok(s.text.includes('/work/' + p.slug));
  const r = await request(app).get('/robots.txt');
  assert.match(r.text, /Disallow: \/admin/);
  assert.match(r.text, /Sitemap: http:\/\/localhost:3000\/sitemap.xml/);
});

test('home page carries LocalBusiness data with the phone', async () => {
  const r = await request(app).get('/');
  const json = JSON.parse(r.text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(json['@type'], 'ProfessionalService');
  assert.equal(json.telephone, '+8801732508485');
  assert.equal(json.address.addressLocality, 'Dhaka');
});

test('credits page lists every photographer', async () => {
  const r = await request(app).get('/credits');
  for (const c of require('../content/credits.json')) assert.ok(r.text.includes(c.author.replace(/&/g, '&amp;')), c.author);
});
