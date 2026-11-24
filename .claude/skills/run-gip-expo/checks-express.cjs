// Express page (/?form=quick, views/express.ejs): live seat lines, the next-field guide and its scroll,
// page buttons landing on the card, a booking through the mock gateway, the finish-registration sheet.
// Run with the server in PAYMENT_MODE=mock. Seat lines read "মাত্র Xটি সিট বাকি" only when Admin › Offer seats on sale is ≤ 25.
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const SHOTS = (process.env.GVE_SHOTS || '/tmp/gve-shots') + '/express';
require('fs').mkdirSync(SHOTS, { recursive: true });
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
const IGNORE = /ytimg|youtube|fbevents|facebook/;
(async () => {
  const b = await chromium.launch();
  for (const [name, opts] of [['phone', devices['iPhone 13']], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errs.push(m.text()); });
    const st = () => p.evaluate(() => ({ y: Math.round(scrollY), next: [...document.querySelectorAll('#quickForm .x-next')].map((e) => e.dataset.q).join(','), say: document.querySelector('[data-say]').textContent, ow: document.documentElement.scrollWidth - innerWidth }));
    const onScreen = async (sel) => { const r = await p.locator(sel).boundingBox(), vh = p.viewportSize().height; return r && r.y >= 0 && r.y + r.height <= vh; };
    await p.goto(URL + '/?form=quick'); await p.waitForTimeout(1500);
    let s = await st();
    s.next === 'venue' && s.ow === 0 ? ok(`${name}: guide starts on the venue, no sideways scroll`) : bad(`${name}: start ${JSON.stringify(s)}`);
    const seatLines = await p.$$eval('#quickForm [data-seat-txt]', (els) => els.map((e) => e.textContent));
    console.log(`INFO ${name} seat lines: ${seatLines.join(' | ')}`);
    await p.screenshot({ path: `${SHOTS}/${name}-0.png` });
    await p.locator('#book').scrollIntoViewIfNeeded();
    await p.click('.qf-venue[data-venue="dream_dhaka"]'); await p.waitForTimeout(900);
    if (await p.locator('[data-gp]').isVisible()) { await p.click('[data-gp-go]'); await p.waitForTimeout(900); }
    s = await st();
    s.next === 'email' && (await onScreen('#qfEmail')) ? ok(`${name}: venue picked -> guide on email, field on screen (y=${s.y})`) : bad(`${name}: after venue ${JSON.stringify(s)}`);
    (await p.locator('#quickForm [data-pr="dream_dhaka"] s').count()) ? ok(`${name}: offer unlocked, prices struck`) : console.log('INFO offer not unlocked (already claimed or campaign closed)');
    await p.click('[data-qf-plus]'); await p.waitForTimeout(300);
    /২ জন/.test(await p.textContent('[data-qf-btn]')) ? ok(`${name}: total in the pay button: ${await p.textContent('[data-qf-btn]')}`) : bad(`${name}: qty`);
    await p.fill('#qfEmail', 'xp' + String(Date.now()).slice(-8));
    await p.click('#quickForm .em-chip[data-dom="gmail.com"]'); await p.waitForTimeout(1400);
    s = await st();
    s.next === 'pay' && (await onScreen('#qfSubmit')) ? ok(`${name}: @gmail.com tap -> guide on pay, button on screen`) : bad(`${name}: after email ${JSON.stringify(s)}`);
    await p.screenshot({ path: `${SHOTS}/${name}-1.png` });
    // a button far down the page lands back on the card
    if (await p.evaluate(() => document.body.classList.contains('x-co-lock'))) { await p.click('[data-co-close]'); await p.waitForTimeout(500); }   // phones: close the checkout sheet first, as a visitor would
    await p.evaluate(() => document.querySelector('#passes').scrollIntoView()); await p.waitForTimeout(500);
    if (await p.locator('.x-sheet.x-show').count()) { console.log(`INFO ${name}: sheet opened on scroll`); await p.click('.x-sheet .x-ghost'); await p.waitForTimeout(400); }
    await p.locator('#passes [data-pick-pass="gold"]').click(); await p.waitForTimeout(1600);
    const picked = await p.evaluate(() => (document.querySelector('#quickForm input[name="pass"]:checked') || {}).value);
    picked === 'gold' && (await onScreen('#qfSubmit')) ? ok(`${name}: "VIP পাস নিন" picks VIP and returns to the pay button`) : bad(`${name}: pass button ${picked}`);
    // sheet
    if (await p.evaluate(() => document.body.classList.contains('x-co-lock'))) { await p.click('[data-co-close]'); await p.waitForTimeout(500); }   // phones: close the checkout sheet first, as a visitor would
    await p.evaluate(() => window.__rsOpen('test')); await p.waitForTimeout(800);
    /পেমেন্ট বাকি/.test(await p.textContent('[data-sh-title]')) && /পে করে শেষ করুন/.test(await p.textContent('[data-sh-go-label]'))
      ? ok(`${name}: sheet shows "${await p.textContent('[data-sh-title]')}" / "${await p.textContent('[data-sh-go-label]')}"`) : bad(`${name}: sheet`);
    await p.screenshot({ path: `${SHOTS}/${name}-sheet.png` });
    await p.click('[data-sh-go]'); await p.waitForTimeout(900);
    await p.click('#qfSubmit');
    try { await p.waitForURL('**/payment/mock**', { timeout: 10000 }); await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**', { timeout: 10000 }); ok(`${name}: booked, ticket ${p.url().match(/ticket\/([A-Z0-9]{8})/)[1]}`); }
    catch (e) { bad(`${name}: booking ${e.message.split('\n')[0]} ${await p.textContent('#qfAlert').catch(() => '')}`); }
    errs.length ? bad(`${name}: browser errors: ${errs.join(' | ')}`) : ok(`${name}: no browser errors`);
    await ctx.close();
  }
  // a fresh visitor books from the sheet
  const p = await (await b.newContext(devices['iPhone 13'])).newPage();
  await p.goto(URL + '/?form=quick'); await p.waitForTimeout(1200);
  await p.evaluate(() => window.__rsOpen('test')); await p.waitForTimeout(700);
  (await p.locator('[data-sh-fresh]:not([hidden])').count()) ? ok('fresh visitor: sheet asks for venue + email') : bad('fresh sheet');
  await p.screenshot({ path: `${SHOTS}/fresh-sheet.png` });
  await p.click('.x-vchip:has(input[value="dream_sylhet"])');
  await p.fill('#shEmail2', 'xpfresh' + String(Date.now()).slice(-6) + '@example.com');
  await p.click('[data-sh-start]'); await p.waitForTimeout(900);
  const v = await p.evaluate(() => (document.querySelector('#quickForm input[name="pass"]:checked') || {}).value);
  v === 'dream_sylhet' && /পেমেন্ট বাকি/.test(await p.textContent('[data-sh-title]')) ? ok('fresh visitor: sheet filled the form and now offers Pay') : bad('fresh start ' + v);
  // group price (Admin › Promo codes, default 3+ tickets = ৳500 off the whole booking) and the savings bank
  const g = await (await b.newContext(devices['iPhone 13'])).newPage();
  await g.goto(URL + '/?form=quick'); await g.waitForTimeout(1200);
  await g.locator('#book').scrollIntoViewIfNeeded(); await g.click('.qf-venue[data-venue="dream_dhaka"]'); await g.waitForTimeout(1300); if (await g.locator('[data-gp]').isVisible()) { await g.click('[data-gp-go]'); await g.waitForTimeout(900); }
  const hasGroup = await g.locator('[data-group]').count();
  if (!hasGroup) console.log('INFO group price is off (Admin › Promo codes)');
  else {
    await g.click('[data-qf-plus]'); await g.click('[data-qf-plus]'); await g.waitForTimeout(1500);
    const r = await g.evaluate(() => ({ won: document.querySelector('[data-group]').classList.contains('x-won'), total: document.querySelector('[data-qf-total]').textContent, parts: document.querySelector('[data-bank-parts]').textContent }));
    r.won && /ফ্যামিলি প্যাক/.test(r.parts) ? ok(`group price: 3 tickets -> "${r.total}", bank "${r.parts}"`) : bad('group price ' + JSON.stringify(r));
  }
  await b.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
