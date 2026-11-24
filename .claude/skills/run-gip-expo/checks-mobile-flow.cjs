// Phone flow on all five forms (iPhone 13): the tap that picks a ticket / goes to step 2 puts the cursor in the email
// during the tap (iPhone opens the keyboard only then); the email is on screen; after typing it and closing the
// keyboard without a tap, the Pay button comes into view and nothing is paid yet; no layout shift while the page loads
// on slow 4G (the Bangla fonts must not make the text jump).
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
const F = { pro: ['.ph-row[data-pick-pass="dream_dhaka"]', null, '#email', '#submitBtn'], steps: ['.pf-tab[data-k="dream_dhaka"]', '[data-next]', '#pfEmail', '#bookForm button[type=submit]'], express: ['.qf-venue[data-venue="dream_dhaka"]', null, '#qfEmail', '#quickForm button[type=submit]'], simple: ['.qf-venue[data-venue="dream_dhaka"]', null, '#qfEmail', '#qfSubmit'], book: ['.b-date[data-k="dream_dhaka"]', '[data-next]', '#bEmail', '#bPay'] };
const inView = (p, sel) => p.evaluate((s) => { const b = [...document.querySelectorAll(s)].find((x) => x.offsetParent); if (!b) return false; const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }, sel);
(async () => {
  const b = await chromium.launch();
  for (const [v, [pick, next, em, pay]] of Object.entries(F)) {
    const p = await (await b.newContext(devices['iPhone 13'])).newPage(); await p.goto(URL + '/?v=' + v); await p.waitForTimeout(1000);
    await p.locator(pick).first().scrollIntoViewIfNeeded(); await p.locator(pick).first().tap(); if (next) { await p.waitForTimeout(300); await p.locator(next).tap(); }
    (await p.evaluate((s) => document.activeElement === document.querySelector(s), em)) ? ok(`${v}: email gets the cursor during the tap`) : bad(`${v}: email not focused during the tap`);
    await p.waitForTimeout(1200);
    (await inView(p, em)) ? ok(`${v}: email on screen`) : bad(`${v}: email off screen`);
    await p.keyboard.type('flow@gmail.com', { delay: 5 }); await p.evaluate((s) => document.querySelector(s).blur(), em); await p.waitForTimeout(1500);
    (await inView(p, pay)) && !p.url().includes('/payment') ? ok(`${v}: keyboard closed: Pay comes into view, nothing paid yet`) : bad(`${v}: Pay not shown after the email (${p.url()})`);
    await p.context().close();
    const ctx = await b.newContext(devices['iPhone 13']); const q = await ctx.newPage(); const cdp = await ctx.newCDPSession(q);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await q.addInitScript(() => { window.__c = 0; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__c += e.value; })).observe({ type: 'layout-shift', buffered: true }); });
    await q.goto(URL + '/?v=' + v, { waitUntil: 'load' }); await q.waitForTimeout(2500);
    const cls = await q.evaluate(() => window.__c); cls < 0.1 ? ok(`${v}: load layout shift ${cls.toFixed(3)} on slow 4G`) : bad(`${v}: load layout shift ${cls.toFixed(3)}`);
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
