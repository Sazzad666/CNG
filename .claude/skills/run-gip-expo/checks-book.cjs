// Event page (/?form=book): pick a date, add people, step 2 (ticket preview fills), pay reaches the mock gateway.
// Run with the server in PAYMENT_MODE=mock.
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch();
  for (const [name, opts] of [['phone', devices['iPhone 13']], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const p = await (await b.newContext(opts)).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL + '/?form=book'); await p.waitForTimeout(1000);
    (await p.locator('.b-date').count()) >= 1 ? ok(`${name}: date tiles on the page`) : bad(`${name}: no date tiles`);
    (await p.isDisabled('[data-next]')) ? ok(`${name}: next waits for a date`) : bad(`${name}: next enabled with no date`);
    await p.click('.b-date[data-k="dream_dhaka"]'); await p.waitForTimeout(1200);
    (await p.isVisible('[data-ticket]')) ? ok(`${name}: the ticket appears for the date`) : bad(`${name}: no ticket`);
    await p.click('[data-plus]'); await p.waitForTimeout(400);
    /২ জন/.test(await p.textContent('[data-sum-k]')) ? ok(`${name}: + adds a person: ${await p.textContent('[data-sum-t]')}`) : bad(`${name}: qty`);
    await p.click('[data-next]'); await p.waitForTimeout(800);
    (await p.isVisible('#bEmail')) ? ok(`${name}: step 2 shows the email`) : bad(`${name}: step 2`);
    const mail = 'bk' + String(Date.now()).slice(-8) + '@gmail.com';
    await p.fill('#bEmail', mail); await p.waitForTimeout(300);
    (await p.textContent('[data-tix-mail]')).trim() === mail ? ok(`${name}: the ticket preview shows the email`) : bad(`${name}: preview`);
    await p.click('#bPay');
    try { await p.waitForURL('**/payment/mock**', { timeout: 10000 }); ok(`${name}: reached payment`); } catch (e) { bad(`${name}: no payment page: ${await p.textContent('[data-alert]')}`); }
    errs.length ? bad(`${name}: browser errors ${errs.join(' | ')}`) : ok(`${name}: no browser errors`);
    await p.context().close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
