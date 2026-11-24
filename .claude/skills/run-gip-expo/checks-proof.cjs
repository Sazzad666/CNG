// ?v=steps (2-step · Proof first): the guide line and the pulse always name the next thing, every step moves on by itself,
// the phone bar follows, a wrong email is caught, Enter shows Pay (the buyer taps it), and the booking is credited to 'steps'. Server in PAYMENT_MODE=mock.
const { chromium, devices } = require('playwright');
const { execSync } = require('child_process');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
const guide = (p) => p.textContent('[data-guide-t]');
const pulsing = (p) => p.evaluate(() => { const e = document.querySelector('.is-next'); return e ? e.dataset.target : null; });
(async () => {
  const b = await chromium.launch();
  for (const [name, dev] of [['phone', devices['iPhone 13']], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await b.newContext(dev), p = await ctx.newPage(), errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL + '/?v=steps'); await p.waitForTimeout(2400);
    const vh = p.viewportSize().height, tabsTop = await p.$eval('.pf-tabs', (e) => e.getBoundingClientRect().top);
    tabsTop < vh ? ok(`${name}: ticket tabs start in the first screen (${Math.round(tabsTop)}px)`) : bad(`${name}: tabs at ${tabsTop}`);
    /রিজেক্ট/.test(await p.textContent('h1')) ? ok(`${name}: headline speaks to the fear of rejection`) : bad('headline');
    (await p.locator('.pf-visas img').count()) >= 3 ? ok(`${name}: visa copies in the hero`) : bad('no visa copies');
    /টিকিট বাছুন/.test(await guide(p)) ? ok(`${name}: guide 1 "${await guide(p)}"`) : bad('guide 1: ' + await guide(p));
    (await pulsing(p)) === 'tabs' ? ok(`${name}: the tabs pulse`) : bad('pulse 1: ' + await pulsing(p));
    !(await ctx.cookies()).some((c) => c.name === 'gve_offer') ? ok(`${name}: no discount before a pick`) : bad('discount on load');

    await p.click('.pf-tab[data-k="dream_dhaka"]'); await p.waitForTimeout(1600);
    (await ctx.cookies()).some((c) => c.name === 'gve_offer') ? ok(`${name}: the first pick opens the discount`) : bad('no discount after pick');
    /এগিয়ে যান/.test(await guide(p)) ? ok(`${name}: guide 2 "${await guide(p)}"`) : bad('guide 2: ' + await guide(p));
    (await pulsing(p)) === 'next' ? ok(`${name}: "এগিয়ে যান" pulses`) : bad('pulse 2: ' + await pulsing(p));
    const nb = await p.$eval('[data-next]', (e) => e.getBoundingClientRect());
    nb.top >= 0 && nb.bottom <= vh ? ok(`${name}: the next button was brought into view`) : bad(`${name}: next button off screen (${Math.round(nb.top)})`);
    /৬০০/.test(await p.textContent('[data-d-price]')) ? ok(`${name}: VIP at ৳600`) : bad('price: ' + await p.textContent('[data-d-price]'));
    await p.click('[data-plus]'); await p.waitForTimeout(300);
    /১,২০০/.test(await p.textContent('[data-sum-t]')) ? ok(`${name}: 2 people = ৳1,200`) : bad('sum: ' + await p.textContent('[data-sum-t]'));
    await p.click('[data-minus]'); await p.waitForTimeout(300);

    await p.click('[data-next]'); await p.waitForTimeout(900);
    (await p.evaluate(() => document.activeElement.id)) === 'pfEmail' ? ok(`${name}: step 2 opens with the email focused`) : bad('focus: ' + await p.evaluate(() => document.activeElement.id));
    /ইমেইল লিখুন/.test(await guide(p)) ? ok(`${name}: guide 3 "${await guide(p)}"`) : bad('guide 3: ' + await guide(p));
    await p.fill('#pfEmail', 'wrong@'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    !(await p.isHidden('[data-err="email"]')) ? ok(`${name}: a wrong email is caught: "${await p.textContent('[data-err="email"]')}"`) : bad('no email error');
    const mail = 'proof' + name + String(Date.now()).slice(-7) + '@gmail.com';
    await p.fill('#pfEmail', mail); await p.waitForTimeout(300);
    (await p.getAttribute('[data-target="email"]', 'class')).includes('is-ok') ? ok(`${name}: a valid email gets a tick`) : bad('no tick');
    /পে করুন/.test(await guide(p)) ? ok(`${name}: guide 4 "${await guide(p)}"`) : bad('guide 4: ' + await guide(p));
    await p.locator('#pfEmail').blur(); await p.waitForTimeout(1200);
    (await pulsing(p)) === 'pay' ? ok(`${name}: the pay button pulses`) : bad('pulse 4: ' + await pulsing(p));
    if (name === 'phone') {
      await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(800);
      const bt = await p.textContent('[data-bar-go]');
      /পে করুন/.test(bt) && (await p.getAttribute('[data-bar]', 'class')).includes('is-on') ? ok(`phone: the bar follows: "${bt}"`) : bad('bar: ' + bt);
      await p.click('[data-bar-go]');
    } else { await p.focus('#pfEmail'); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
      !p.url().includes('/payment') ? ok(`${name}: Enter on the email shows Pay instead of paying`) : bad('Enter paid directly');
      await p.locator('#bookForm button[type=submit]').click(); }
    try {
      await p.waitForURL('**/payment/mock**', { timeout: 10000 }); await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**', { timeout: 10000 });
      /৬০০/.test(await p.textContent('main')) ? ok(`${name}: paid ৳600, e-ticket shown`) : bad('ticket price');
      const v = execSync(`mysql -uroot gve_local -N -e "SELECT variant FROM leads WHERE email='${mail}'"`).toString().trim();
      v === 'steps' ? ok(`${name}: booking credited to the Proof-first page`) : bad('variant: ' + v);
    } catch (e) { bad(`${name}: booking failed: ` + e.message.split('\n')[0]); }
    errs.length ? bad(`${name}: browser errors: ` + errs.join(' | ')) : ok(`${name}: no browser errors`);
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
