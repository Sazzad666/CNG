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

async function leaveThroughTop(page) {
  await page.mouse.move(600, 300);
  await page.mouse.move(600, 5, { steps: 4 });
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientX: 600, clientY: -2, relatedTarget: null, bubbles: true })));
}
const isOpen = (page) => page.evaluate(() => { const d = document.getElementById('exit-offer'); return !!(d && d.open); });

test('leaving through the top opens the offer once; Esc closes; it stays closed after a reload', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + '/');
  await page.waitForTimeout(2200);
  await leaveThroughTop(page);
  await page.waitForTimeout(300);
  assert.equal(await isOpen(page), true);
  assert.equal(await page.evaluate(() => document.getElementById('exit-offer').contains(document.activeElement)), true);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  assert.equal(await isOpen(page), false);
  await page.reload();
  await page.waitForTimeout(2200);
  await leaveThroughTop(page);
  await page.waitForTimeout(300);
  assert.equal(await isOpen(page), false);
  await ctx.close();
});

test('it does not arm in the first two seconds', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + '/about');
  await leaveThroughTop(page);
  await page.waitForTimeout(300);
  assert.equal(await isOpen(page), false);
  await ctx.close();
});

test('never on the contact, estimate or thank-you pages', async () => {
  for (const url of ['/contact', '/estimate', '/thank-you']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base + url);
    assert.equal(await page.locator('#exit-offer').count(), 0, url);
    await ctx.close();
  }
});

test('sending the offer saves an audit lead', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + '/services');
  await page.waitForTimeout(2200);
  await leaveThroughTop(page);
  const dlg = page.locator('#exit-offer');
  await dlg.getByLabel('Your name').fill('Shirin Akter');
  await dlg.getByLabel('Mobile number').fill('01911-222333');
  await dlg.getByLabel('Your current website').fill('shirinbakes.com');
  await dlg.getByRole('button', { name: /Get my free audit/ }).click();
  await page.waitForURL(/\/thank-you\?type=audit/);
  const [[row]] = await pool.query("SELECT * FROM leads WHERE type = 'audit'");
  assert.equal(row.website, 'https://shirinbakes.com');
  assert.equal(row.source_page, '/services');
  await ctx.close();
});
