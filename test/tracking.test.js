'use strict';
process.env.GA4_ID = 'G-TEST123';
process.env.META_PIXEL_ID = '1234567890';
const { closeDb } = require('./helpers');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

after(closeDb);

test('with GA4 and Meta IDs set, the page loads a tracking script that exists and defines gtag and fbq', async () => {
  const page = await request(app).get('/');
  const src = (page.text.match(/<script src="(\/js\/tracking\.js)"[^>]*data-ga4="G-TEST123"[^>]*data-pixel="1234567890"/) || [])[1];
  assert.ok(src, 'tracking script tag with both ids');
  const js = await request(app).get(src);
  assert.equal(js.status, 200);
  assert.match(js.text, /window\.gtag\s*=/);
  assert.match(js.text, /window\.fbq\s*=/);
  assert.match(page.headers['content-security-policy'], /googletagmanager\.com/);
  assert.match(page.headers['content-security-policy'], /connect\.facebook\.net/);
});
