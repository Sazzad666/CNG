// Express page in the Simple form style (?xform=simple): the extras are hidden, venues are rows, and a booking
// goes through to the mock gateway. Run with the server in PAYMENT_MODE=mock.
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch();
  for (const [name, opts] of [['phone', devices['iPhone 13']], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const p = await (await b.newContext(opts)).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL + '/?form=quick&xform=simple'); await p.waitForTimeout(1200);
    (await p.evaluate(() => document.body.classList.contains('x-simple'))) ? ok(`${name}: simple style on`) : bad(`${name}: simple style missing`);
    const hidden = await p.evaluate(() => ['[data-coupon]', '[data-bank]', '.x-pickhelp', '.x-rail'].every((s) => { const e = document.querySelector(s); return !e || getComputedStyle(e).display === 'none'; }));
    hidden ? ok(`${name}: coupon, savings bank, help chips and rail hidden`) : bad(`${name}: extras still showing`);
    const rows = await p.evaluate(() => { const t = [...document.querySelectorAll('.x-tab')].map((e) => e.getBoundingClientRect()); return t.length === 3 && t[1].top > t[0].bottom - 1; });
    rows ? ok(`${name}: venues are rows`) : bad(`${name}: venues not rows`);
    await p.locator('#book').scrollIntoViewIfNeeded(); await p.click('.qf-venue[data-venue="dream_dhaka"]'); await p.waitForTimeout(1300);
    if (await p.locator('[data-gp]').isVisible().catch(() => false)) { await p.click('[data-gp-go]'); await p.waitForTimeout(600); }
    await p.fill('#qfEmail', 'simple' + String(Date.now()).slice(-8) + '@example.com'); await p.locator('#qfEmail').blur(); await p.waitForTimeout(800);
    /পে করুন/.test(await p.textContent('[data-qf-btn]')) ? ok(`${name}: pay button shows the total: ${(await p.textContent('[data-qf-btn]')).trim()}`) : bad(`${name}: pay label`);
    await p.click('#qfSubmit');
    try { await p.waitForURL('**/payment/mock**', { timeout: 10000 }); ok(`${name}: reached payment`); } catch (e) { bad(`${name}: no payment page`); }
    errs.length ? bad(`${name}: browser errors ${errs.join(' | ')}`) : ok(`${name}: no browser errors`);
    await p.context().close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
