// checks-gx.cjs — the five booking pages (views/gx). End-to-end per page on an iPhone: pick → (Ticket tabs: এগিয়ে যান) → 2 people → email → the guide shows venue and email done → pay → mock payment page. Screens the form after the pick.
const { chromium, devices } = require('playwright');
const URL = process.env.GVE_URL || 'http://127.0.0.1:3100';
const out = process.env.GVE_SHOTS || '/tmp/gve-shots', vs = (process.argv[2] || 'pro,steps,express,simple,book').split(',');
require('fs').mkdirSync(out, { recursive: true });
const PICK = { pro: '.gxr-chip[data-k="dream_dhaka"]', steps: '.rkf-sign[data-k="dream_dhaka"]', express: '.gxq-col[data-k="dream_dhaka"]', book: '.gxk-page[data-k="dream_dhaka"]' };
(async () => {
  const b = await chromium.launch(); let fail = 0;
  for (const v of vs) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', (m) => { if (m.type() === 'error' && !/ytimg|youtube/.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    try {
      await p.goto(URL + '/?v=' + v, { waitUntil: 'networkidle' });
      await p.waitForTimeout(800);
      if (v === 'simple') {
        // "ব্যাগ গোছান": start → venue (the tag goes on, step 2 comes by itself) → 2 passports → name, email, number → the bag shuts → pay
        await p.locator('.bg-go').click(); await p.waitForTimeout(500);
        await p.locator('.bg-sc[data-k="dream_dhaka"]').click(); await p.waitForTimeout(1200);   // the luggage-tag list
        await p.locator('.bg-people [data-gx-qty-set="2"]').click(); await p.waitForTimeout(500);
        const pp = await p.locator('.bg-pp.is-in').count(); if (pp !== 2) throw new Error('passports in the bag: ' + pp);
        await p.screenshot({ path: `${out}/${v}-picked.png` });
        await p.locator('[data-bg-next="2"]').click(); await p.waitForTimeout(400);
        const ph = p.locator('#bookForm input[name="phone"]:not([type="hidden"])'), num = '017990' + String(Math.floor(Math.random() * 1e5)).padStart(5, '0');
        await p.locator('#bookForm input[name="full_name"]').fill('Test Buyer');
        if (await ph.count()) { await ph.fill(''); await ph.pressSequentially('+88' + num, { delay: 5 });
          if ((await ph.inputValue()) !== num) throw new Error('phone not trimmed to 01…: ' + await ph.inputValue()); }   // only when Admin › Form › Contact asks for the phone
        await p.locator('#bookForm input[type="email"]').fill('test.buyer' + num.slice(-5) + '@gmail.com');   // the email is on by default (name → email → phone)
        await p.locator('[data-bg-next="3"]').click(); await p.waitForTimeout(1200);
        if (!(await p.locator('[data-bg-bag].is-shut').count())) throw new Error('the bag did not shut on the last step');
        const total = await p.locator('.bg-bill [data-gx-t="total"]').textContent();
        await p.screenshot({ path: `${out}/${v}-ready.png` });
        await p.locator('#bookForm [data-gx-pay]').click();
        await p.waitForURL(/payment\/mock/, { timeout: 8000 });
        const amt = await p.locator('body').innerText();
        console.log('PASS', v, 'total', total.trim(), '→ mock pay', /১,২০০|1,200|1200/.test(amt) ? '(amount 1200 seen)' : '');
        if (errs.length) { fail++; console.log('  console:', errs.join(' | ')); }
        await ctx.close(); continue;
      }
      await p.locator(PICK[v]).first().click();
      await p.waitForTimeout(900);
      if (v === 'steps') await p.waitForTimeout(800);   // one screen: the rickshaw rides on, the name comes up
      await p.locator(v === 'pro' ? '#bookForm .gxr-pax-b[data-gx-qty-set="2"]' : v === 'book' ? '#bookForm .gxk-p[data-gx-qty-set="2"]' : '#bookForm [data-gx-qty="+1"]').first().click();   // pro: the people choices; the rest: the stepper beside the total
      await p.waitForTimeout(300);
      await p.screenshot({ path: `${out}/${v}-picked.png` });
      // the contact: the email (default), plus the mobile number (+88 fixed beside it) when the admin asks for it; a pasted +880… is trimmed to the 11 digits
      const ph = p.locator('#bookForm input[name="phone"]:not([type="hidden"])'), num = '017990' + String(Math.floor(Math.random() * 1e5)).padStart(5, '0');
      if (await ph.count()) { await ph.fill(''); await ph.pressSequentially('+88' + num, { delay: 5 });
        if ((await ph.inputValue()) !== num) throw new Error('phone not trimmed to 01…: ' + await ph.inputValue()); }   // only when Admin › Form › Contact asks for the phone
      const em = p.locator('#bookForm input[type="email"]');   // Admin › Form › Contact: email + phone is the default
      if (await em.count()) await em.fill('test.buyer' + num.slice(-5) + '@gmail.com');
      await p.locator('#bookForm input[name="full_name"]').fill('Test Buyer'); await p.locator('#bookForm input[name="full_name"]').blur();   // the name is required
      await p.waitForTimeout(700);
      // the guide: the venue and email steps are green, the next one is Pay
      const guide = await p.evaluate(() => [...document.querySelectorAll('#book [data-gx-step]')].map((li) => li.dataset.gxStep + ':' + (li.classList.contains('is-done') ? 'done' : li.classList.contains('is-now') ? 'now' : '-')).join(' '));
      if (!/pass:done email:done pay:now/.test(guide)) throw new Error('guide chips: ' + guide);
      const total = await p.locator('#bookForm [data-gx-t="total"]').first().evaluate((el) => el.getAttribute('data-roll-v') || el.textContent.trim()).catch(() => null);   // the total morphs now (plain text); older builds rolled it
      await p.screenshot({ path: `${out}/${v}-ready.png` });
      await p.locator('#bookForm [data-gx-pay]').click();
      await p.waitForURL(/payment\/mock/, { timeout: 8000 });
      const amt = await p.locator('body').innerText();
      console.log('PASS', v, 'total', total, '→ mock pay', /১,২০০|1,200|1200/.test(amt) ? '(amount 1200 seen)' : '');
    } catch (e) { fail++; console.log('FAIL', v, e.message.split('\n')[0]); await p.screenshot({ path: `${out}/${v}-fail.png` }); }
    if (errs.length) { fail++; console.log('  console:', errs.join(' | ')); }
    await ctx.close();
  }
  await b.close(); process.exit(fail ? 1 : 0);
})();
