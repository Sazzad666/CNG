// Wrong email on every booking form (UX audit 01–05, 07): a real tap on Pay after "rahim@gmail" always gets an answer
// (aria-invalid, one message: the styled "gmail.com?" fix, the help and plain error hidden), the field turns red,
// nothing is submitted, and the page does not shift while scrolling (CLS < 0.1).
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
const F = {
  pro: ['.ph-row[data-pick-pass="dream_dhaka"]', null, '#email', '#submitBtn'],
  steps: ['.pf-tab[data-k="dream_dhaka"]', '[data-next]', '#pfEmail', '#bookForm button[type=submit]'],
  express: ['.qf-venue[data-venue="dream_dhaka"]', null, '#qfEmail', '#quickForm button[type=submit]'],
  simple: ['.qf-venue[data-venue="dream_dhaka"]', null, '#qfEmail', '#qfSubmit'],
  book: ['.b-date[data-k="dream_dhaka"]', '[data-next]', '#bEmail', '#bPay'],
};
(async () => {
  const b = await chromium.launch();
  for (const [v, [pick, next, email, pay]] of Object.entries(F)) {
    const p = await (await b.newContext(devices['iPhone 13'])).newPage();
    await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(URL + '/?v=' + v); await p.waitForTimeout(1200);
    for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, 900); await p.waitForTimeout(250); }
    const cls = await p.evaluate(() => window.__cls);
    cls < 0.1 ? ok(`${v}: layout shift ${cls.toFixed(3)}`) : bad(`${v}: layout shift ${cls.toFixed(3)}`);
    await p.locator(pick).first().scrollIntoViewIfNeeded(); await p.click(pick); await p.waitForTimeout(700);
    if (next) { await p.click(next); await p.waitForTimeout(500); }
    await p.fill(email, 'rahim@gmail'); await p.waitForTimeout(200);
    await p.locator(pay).first().tap(); await p.waitForTimeout(900);
    const r = await p.evaluate((s) => {
      const e = document.querySelector(s), fix = document.getElementById(e.id + 'Fix'), cs = getComputedStyle(e);
      const shown = (x) => x && x.offsetParent !== null && x.textContent.trim();
      const extra = (e.getAttribute('aria-describedby') || '').split(/\s+/).map((i) => document.getElementById(i)).filter((x) => x && x !== fix && shown(x) && /ঠিক নেই/.test(x.textContent));
      const btn = fix && fix.querySelector('button'), bs = btn && getComputedStyle(btn);
      return { path: location.pathname, inv: e.getAttribute('aria-invalid'), fix: !!shown(fix), linked: (e.getAttribute('aria-describedby') || '').includes(e.id + 'Fix'),
        dup: extra.length, red: cs.borderTopColor === 'rgb(212, 42, 65)', styled: bs ? bs.backgroundColor === 'rgb(15, 42, 33)' && parseFloat(bs.minHeight) >= 44 : false };
    }, email);
    r.path === '/' && r.inv === 'true' ? ok(`${v}: tap on Pay with a wrong email is answered, not submitted`) : bad(`${v}: ${JSON.stringify(r)}`);
    r.fix && r.linked && r.styled ? ok(`${v}: styled "gmail.com?" fix, read by screen readers`) : bad(`${v}: fix ${JSON.stringify(r)}`);
    !r.dup ? ok(`${v}: one message (no duplicate error under the fix)`) : bad(`${v}: duplicate message`);
    r.red ? ok(`${v}: field turns red`) : bad(`${v}: field not red`);
    await p.click(`#${await p.evaluate((s) => document.querySelector(s).id, email)}Fix button`); await p.waitForTimeout(400);
    (await p.inputValue(email)) === 'rahim@gmail.com' && (await p.evaluate((s) => document.querySelector(s).getAttribute('aria-invalid'), email)) !== 'true' ? ok(`${v}: one tap fixes it to rahim@gmail.com`) : bad(`${v}: fix did not apply`);
    await p.context().close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
