// Phone with the on-screen keyboard open (visible area 390x400), on the two live forms (Express and the main page):
// the field being typed in stays in view and no fixed bar covers it, Enter on a finished email goes on to payment
// (the optional phone sits behind "+ মোবাইল নম্বরও দিন", so the email is the last field), and the Express bottom bar
// stays hidden while a field is focused.
// Usage: GVE_URL=http://127.0.0.1:3100 node .claude/skills/run-gip-expo/checks-keyboard.cjs   (PAYMENT_MODE=mock)
const { chromium } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
const expect = (c, m, x) => (c ? ok(m) : fail(m + (x ? ' :: ' + String(x).slice(0, 200) : '')));
(async () => {
  const b = await chromium.launch();
  const ctx = () => b.newContext({ viewport: { width: 390, height: 400 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  // is the focused field fully visible, and not under a fixed/sticky bar that is showing?
  const clear = (p) => p.evaluate(() => {
    const el = document.activeElement, r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) return 'out of view: ' + Math.round(r.top) + '..' + Math.round(r.bottom);
    for (const bar of document.querySelectorAll('header, [data-bar], #mobileBar, [data-pick], [data-proof]')) {
      const cs = getComputedStyle(bar); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || !/fixed|sticky/.test(cs.position)) continue;
      if (bar.matches('[data-bar], [data-pick]') && !bar.classList.contains('x-show')) continue;
      const q = bar.getBoundingClientRect(); if (!q.height) continue;
      if (q.top < r.bottom && q.bottom > r.top) return 'covered by ' + (bar.id || bar.className.split(' ')[0] || bar.tagName);
    }
    return '';
  });
  const forms = [
    ['/?form=quick', '.qf-venue[data-venue="dream_dhaka"]', '#qfEmail', '[data-optph]'],
    ['/?v=pro', 'label[data-venue="dream_dhaka"]', '#email', '[data-os-optph]'],
  ];
  try {
    for (const [path, venue, email, opt] of forms) {
      const p = await (await ctx()).newPage();
      await p.goto(URL + path); await p.waitForTimeout(1200);
      await p.locator(venue).scrollIntoViewIfNeeded(); await p.click(venue); await p.waitForTimeout(1200);
      await p.focus(email); await p.waitForTimeout(500);
      let why = await clear(p); expect(!why, `${path} ${email}: in view with the keyboard open`, why);
      expect(await p.locator(opt).count() && !(await p.locator(opt).evaluate((d) => d.open)), `${path}: the optional phone waits behind its link`);
      // the phone, once opened, also stays in view
      await p.locator(opt).evaluate((d) => { d.open = true; });
      const ph = path.includes('quick') ? '#qfPhone' : '#phone';
      await p.focus(ph); await p.waitForTimeout(500);
      why = await clear(p); expect(!why, `${path} ${ph}: in view with the keyboard open`, why);
      await p.locator(opt).evaluate((d) => { d.open = false; });
      if (path.includes('quick')) {
        await p.focus(email); await p.waitForTimeout(300);
        expect(!(await p.locator('[data-bar]').evaluate((e) => e.classList.contains('x-show'))), `${path}: the bottom bar stays hidden while a field is focused`);
      }
      // Enter on a finished email = keyboard closes, Pay is shown and focused; Enter again pays
      await p.fill(email, 'kb' + String(Date.now()).slice(-8) + '@example.com');
      await p.focus(email); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
      expect(!p.url().includes('/payment') && await p.evaluate(() => document.activeElement && document.activeElement.type === 'submit'), `${path}: Enter on the finished email shows the Pay button (no payment yet)`);
      await p.keyboard.press('Enter');
      try { await p.waitForURL('**/payment/mock**', { timeout: 10000 }); ok(`${path}: Enter on Pay goes on to payment`); }
      catch (e) { fail(`${path}: Enter on Pay did not reach payment (${p.url()})`); }
      await p.context().close();
    }
  } catch (e) { fail(e.message.split('\n')[0]); }
  await b.close(); process.exit(fails ? 1 : 0);
})();
