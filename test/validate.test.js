'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeBdPhone, validateLead } = require('../src/leads/validate');

test('normalizeBdPhone accepts real-world shapes', () => {
  for (const s of ['01732508485', '+880 1732-508485', '8801732508485', '01732 508485', '০১৭৩২৫০৮৪৮৫', '+88-01732-508485', ' 017 3250 8485 ']) {
    assert.equal(normalizeBdPhone(s), '01732508485', s);
  }
});

test('normalizeBdPhone rejects landlines, short numbers and junk', () => {
  for (const s of ['02-9898989', '0173250', 'abc', '', null, undefined, '01232508485', '017325084851']) {
    assert.equal(normalizeBdPhone(s), null, String(s));
  }
});

test('enquiry needs name and phone, the rest optional', () => {
  const r = validateLead('enquiry', { name: '', phone: '123' });
  assert.equal(r.ok, false);
  assert.equal(r.errors.name, 'Please tell us your name.');
  assert.equal(r.errors.phone, 'Enter a Bangladeshi mobile number, like 01712-345678.');
  const ok = validateLead('enquiry', { name: 'Ayesha Rahman', phone: '+880 1732-508485' });
  assert.equal(ok.ok, true);
  assert.equal(ok.data.phone, '01732508485');
  assert.equal(ok.data.email, null);
  assert.equal(ok.data.type, 'enquiry');
});

test('enquiry validates optional email, service and budget when present', () => {
  const r = validateLead('enquiry', { name: 'A', phone: '01732508485', email: 'nope', service: 'tacos', budget: 'lots' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.email);
  assert.ok(r.errors.service);
  assert.ok(r.errors.budget);
  const ok = validateLead('enquiry', { name: 'A', phone: '01732508485', email: ' Ayesha@Example.com ', service: 'branding', budget: '50k-150k' });
  assert.equal(ok.ok, true);
  assert.equal(ok.data.email, 'ayesha@example.com');
  assert.equal(ok.data.service, 'branding');
  assert.equal(ok.data.budget, '50k-150k');
});

test('estimate requires email and non-empty answers', () => {
  const r = validateLead('estimate', { name: 'A', phone: '01732508485', answers: {} });
  assert.equal(r.ok, false);
  assert.ok(r.errors.email);
  assert.ok(r.errors.answers);
  const ok = validateLead('estimate', { name: 'A', phone: '01732508485', email: 'a@b.co', answers: { services: ['web-design'], pages: '6-15' } });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.data.answers, { services: ['web-design'], pages: '6-15' });
});

test('estimate accepts answers as a JSON string (form post)', () => {
  const ok = validateLead('estimate', { name: 'A', phone: '01732508485', email: 'a@b.co', answers: '{"pages":"1-5"}' });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.data.answers, { pages: '1-5' });
});

test('audit requires a website and normalises a bare domain', () => {
  assert.ok(validateLead('audit', { name: 'A', phone: '01732508485' }).errors.website);
  assert.ok(validateLead('audit', { name: 'A', phone: '01732508485', website: 'not a site' }).errors.website);
  const ok = validateLead('audit', { name: 'A', phone: '01732508485', website: 'example.com' });
  assert.equal(ok.data.website, 'https://example.com');
});

test('long text is cut, Bangla and emoji survive', () => {
  const long = 'ক'.repeat(200);
  const ok = validateLead('enquiry', { name: long, phone: '01732508485', message: 'হ্যালো 👋 '.repeat(400) });
  assert.equal(ok.ok, true);
  assert.equal([...ok.data.name].length, 120);
  assert.ok([...ok.data.message].length <= 2000);
  const b = validateLead('enquiry', { name: 'সাদিয়া ইসলাম 🌱', phone: '01732508485' });
  assert.equal(b.data.name, 'সাদিয়া ইসলাম 🌱');
});

test('unknown type is rejected', () => {
  assert.equal(validateLead('spam', { name: 'A', phone: '01732508485' }).ok, false);
});

test('tracking fields are carried and trimmed', () => {
  const ok = validateLead('enquiry', { name: 'A', phone: '01732508485', source_page: '/services/branding', utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'nov', referrer: 'https://google.com/' });
  assert.equal(ok.data.source_page, '/services/branding');
  assert.equal(ok.data.utm_source, 'facebook');
  assert.equal(ok.data.referrer, 'https://google.com/');
});
