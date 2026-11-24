'use strict';
const { resetDb, closeDb } = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const app = require('../server');
const { pool } = require('../src/db');

let server, base, browser;
before(async () => {
  await resetDb();
  server = app.listen(0); base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser.close(); server.close(); await closeDb(); });

async function fresh() { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); return ctx.newPage(); }

test('completing the estimator for a website saves an estimate lead with its answers', async () => {
  const page = await fresh();
  await page.goto(base + '/estimate');
  await page.waitForTimeout(2100); // the form refuses submissions faster than a person could fill it
  await page.getByRole('checkbox', { name: /Web design/ }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('radio', { name: '6–15 pages' }).check();
  await page.getByRole('radio', { name: 'Yes, an online store' }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('checkbox', { name: /Copywriting/ }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('radio', { name: /Within a month/ }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  const est = page.locator('[data-estimator]');
  await est.getByLabel('Your name').fill('Rahim Uddin');
  await est.getByLabel('Mobile number').fill('01812-345678');
  await est.getByRole('textbox', { name: 'Email' }).fill('rahim@example.com');
  await page.getByRole('button', { name: /Send my project/ }).click();
  await page.waitForURL(/\/thank-you\?type=estimate/);
  const [[row]] = await pool.query("SELECT * FROM leads WHERE type = 'estimate'");
  const answers = typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers;
  assert.deepEqual(answers.services, ['web-design']);
  assert.equal(answers.pages, '6-15');
  assert.equal(answers.ecommerce, 'yes');
  assert.deepEqual(answers.extras, ['copywriting']);
  assert.equal(answers.timeline, 'month');
  assert.equal(row.service, 'web-design');
});

test('Next is blocked until step 1 has an answer, with a message', async () => {
  const page = await fresh();
  await page.goto(base + '/estimate');
  await page.getByRole('button', { name: 'Next' }).click();
  await assert.doesNotReject(page.getByText('Pick at least one to continue.').waitFor({ timeout: 2000 }));
  await assert.doesNotReject(page.getByText('Step 1 of 5').waitFor({ timeout: 1000 }));
});

test('arriving with ?service= starts at step 2 with that service chosen, and Back works', async () => {
  const page = await fresh();
  await page.goto(base + '/estimate?service=apps');
  await page.getByText('Step 2 of 5').waitFor({ timeout: 2000 });
  await page.getByRole('radio', { name: 'Both' }).waitFor();
  await page.getByRole('button', { name: 'Back' }).click();
  assert.equal(await page.getByRole('checkbox', { name: /App development/ }).isChecked(), true);
});

test('leaving after step 2 records an anonymous drop-off', async () => {
  const page = await fresh();
  await page.goto(base + '/estimate?service=branding');
  await page.getByText('Step 2 of 5').waitFor();
  await page.getByRole('radio', { name: 'Full brand identity' }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.goto('about:blank');
  await new Promise((r) => setTimeout(r, 500));
  const [rows] = await pool.query('SELECT * FROM estimate_partials');
  assert.ok(rows.length >= 1);
  assert.ok(rows.some((r) => r.last_step >= 2));
});
