// ?v=pro (2-step · Sales hero): the three events with prices in the phone's first screen, the discount starts on scroll,
// a hero row picks that event in the 2-step form, and a mock booking is credited to 'pro'. Server in PAYMENT_MODE=mock.
const { chromium, devices } = require('playwright');
const { execSync } = require('child_process');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch();
  for (const [name, dev] of [['phone', devices['iPhone 13']], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await b.newContext(dev), p = await ctx.newPage(), errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL + '/?v=pro'); await p.waitForTimeout(1200);
    const vh = p.viewportSize().height, rows = await p.$$eval('.ph-row', (r) => r.map((e) => e.getBoundingClientRect().top));
    rows.length === 3 ? ok(`${name}: three event rows in the hero`) : bad(`${name}: rows ${rows.length}`);
    rows.filter((t) => t < vh).length >= (name === 'phone' ? 2 : 3) ? ok(`${name}: ${rows.filter((t) => t < vh).length} events visible without scrolling`) : bad(`${name}: rows at ${rows}`);
    /এক্সপার্টের সাথে ১:১/.test(await p.textContent('h1')) ? ok(`${name}: benefit headline`) : bad('headline');
    !/VIP নিন|>অফিস</.test(await p.content()) ? ok(`${name}: pass names are Elite / VIP / Economy`) : bad('old VIP/অফিস labels');
    !(await ctx.cookies()).some((c) => c.name === 'gve_offer') ? ok(`${name}: no discount before scrolling`) : bad('discount on load');
    for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, 150); await p.waitForTimeout(250); }
    await p.waitForTimeout(1500);
    (await ctx.cookies()).some((c) => c.name === 'gve_offer') ? ok(`${name}: discount starts on scroll`) : bad('no discount after scroll');
    /<s>/.test(await p.innerHTML('[data-ph-price="dream_dhaka"]')) ? ok(`${name}: hero prices switch to the discount`) : bad('hero price: ' + await p.innerHTML('[data-ph-price="dream_dhaka"]'));
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    await p.click('.ph-row[data-pick-pass="dream_dhaka"]'); await p.waitForTimeout(1500);
    (await p.isChecked('#bookForm input[name="pass"][value="dream_dhaka"]')) ? ok(`${name}: hero row picks VIP – Dhaka Office in the form`) : bad('row did not pick the pass');
    const mail = 'pro' + name + String(Date.now()).slice(-7) + '@example.com';
    await p.fill('#email', mail); await p.locator('#email').blur(); await p.waitForTimeout(800);
    await p.click('#submitBtn');
    try {
      await p.waitForURL('**/payment/mock**', { timeout: 10000 }); await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**', { timeout: 10000 });
      /৬০০/.test(await p.textContent('main')) ? ok(`${name}: paid ৳600 (discount price)`) : bad('ticket price');
      const v = execSync(`mysql -uroot gve_local -N -e "SELECT variant FROM leads WHERE email='${mail}'"`).toString().trim();
      v === 'pro' ? ok(`${name}: booking credited to the Sales hero page`) : bad('variant: ' + v);
    } catch (e) { bad(`${name}: booking failed: ` + e.message.split('\n')[0]); }
    errs.length ? bad(`${name}: browser errors: ` + errs.join(' | ')) : ok(`${name}: no browser errors`);
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
