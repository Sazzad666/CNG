// Admin › Form switches on both pages. Run with the server started AFTER setting, in the server's database:
//   INSERT INTO settings (k,v) VALUES ('email_on','0'),('auto_scroll','0') ON DUPLICATE KEY UPDATE v=VALUES(v);
// Checks: no email field, the phone is required, a booking with only a phone reaches the ticket, and picking a venue
// marks the next field without moving the page (a few px from content growing above is fine; the guide would move hundreds). Delete the two rows afterwards (both default to on).
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch();
  const pages = [
    ['main', '/?v=pro', { venue: 'label[data-venue="dream_dhaka"]', phone: '#phone', email: '#email', pay: '#submitBtn', next: '#bookForm .next' }],
    ['express', '/?form=quick', { venue: '.qf-venue[data-venue="dream_dhaka"]', phone: '#qfPhone', email: '#qfEmail', pay: '#qfSubmit', next: '#quickForm .x-next' }],
  ];
  for (const [name, path, S] of pages) {
    const p = await (await b.newContext(devices['iPhone 13'])).newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL + path); await p.waitForTimeout(1300);
    const type = await p.getAttribute(S.email, 'type');
    type === 'hidden' ? ok(`${name}: no email field`) : bad(`${name}: email field is ${type}`);
    await p.locator(S.venue).scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
    const y0 = await p.evaluate(() => scrollY);
    await p.click(S.venue); await p.waitForTimeout(1300);
    const y1 = await p.evaluate(() => scrollY), next = await p.$$eval(S.next, (els) => els.map((e) => e.dataset.q || e.dataset.osQ).join(','));
    Math.abs(y1 - y0) < 40 && next === 'email' ? ok(`${name}: auto-scroll off: the contact step is marked, the page stayed (${y0} -> ${y1})`) : bad(`${name}: scroll ${y0} -> ${y1}, next ${next}`);
    await p.click(S.pay); await p.waitForTimeout(500);
    (await p.getAttribute(S.phone, 'aria-invalid')) === 'true' ? ok(`${name}: the phone is required`) : bad(`${name}: an empty phone was accepted`);
    await p.fill(S.phone, '017' + String(Date.now()).slice(-8)); await p.waitForTimeout(300);
    await p.click(S.pay);
    try { await p.waitForURL('**/payment/mock**', { timeout: 10000 }); await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**', { timeout: 10000 }); ok(`${name}: booked with a phone only, ticket ${p.url().match(/ticket\/([A-Z0-9]{8})/)[1]}`); }
    catch (e) { bad(`${name}: booking failed ${e.message.split('\n')[0]}`); }
    errs.length ? bad(`${name}: browser errors ${errs.join(' | ')}`) : ok(`${name}: no browser errors`);
  }
  await b.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
