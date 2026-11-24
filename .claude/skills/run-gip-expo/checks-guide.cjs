// Every form shows what to do next and pulses it; finishing a field moves on; "what you'll receive" sits under every pay button;
// on Express/Simple, picking Dhaka asks Sheraton (Elite) or Dhaka Office (VIP). Server in PAYMENT_MODE=mock.
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
const anim = (p, sel) => p.$eval(sel, (e) => getComputedStyle(e).animationName).catch(() => 'none');
(async () => {
  const b = await chromium.launch(), dev = devices['iPhone 13'];
  // ---- receive line on every page
  for (const v of ['pro', 'steps', 'express', 'simple', 'book']) {
    const p = await (await b.newContext(dev)).newPage(); await p.goto(URL + '/?v=' + v); await p.waitForTimeout(600);
    (await p.locator('.rcv').count()) === 1 && /ই-টিকিট/.test(await p.textContent('.rcv')) ? ok(`${v}: "what you'll receive" under the pay button`) : bad(`${v}: no receive line`);
    !/নিবন্ধিত নাম|\[ঠিকানা\]|\[নম্বর\]/.test(await p.content()) ? ok(`${v}: no placeholder text`) : bad(`${v}: placeholder text left`);
    !/gip-logo-white/.test(await p.content()) ? ok(`${v}: full-colour footer logo`) : bad(`${v}: half-white logo`);
    await p.context().close();
  }
  // ---- Event page: guide, pulse, auto-advance
  {
    const p = await (await b.newContext(dev)).newPage(), errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL + '/?v=book'); await p.waitForTimeout(2000);
    /দিন আসবেন/.test(await p.textContent('[data-guide-t]')) && (await anim(p, '.b-dates .b-date')) !== 'none' ? ok('book: guide 1, the dates pulse') : bad('book guide 1: ' + await p.textContent('[data-guide-t]'));
    await p.click('.b-date[data-k="dream_dhaka"]'); await p.waitForTimeout(1300);
    /এগিয়ে যান/.test(await p.textContent('[data-guide-t]')) && (await anim(p, '[data-next]')) !== 'none' ? ok('book: guide 2, "এগিয়ে যান" pulses') : bad('book guide 2');
    const r = await p.$eval('[data-next]', (e) => e.getBoundingClientRect()); r.bottom <= 844 && r.top >= 0 ? ok('book: next button brought into view') : bad('book: next off screen ' + Math.round(r.top));
    await p.click('[data-next]'); await p.waitForTimeout(900);
    (await p.evaluate(() => document.activeElement.id)) === 'bEmail' && /ইমেইল লিখুন/.test(await p.textContent('[data-guide-t]')) ? ok('book: step 2 focuses the email, guide 3') : bad('book step 2');
    await p.fill('#bEmail', 'guide' + Date.now() + '@gmail.com'); await p.locator('#bEmail').blur(); await p.waitForTimeout(1200);
    /পে করুন/.test(await p.textContent('[data-guide-t]')) && (await anim(p, '#bPay')) !== 'none' ? ok('book: valid email, guide 4, pay pulses') : bad('book guide 4');
    await p.focus('#bEmail'); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
    !p.url().includes('/payment') && (await p.evaluate(() => document.activeElement.id)) === 'bPay' ? ok('book: Enter on the email shows Pay (no payment yet)') : bad('book: Enter ' + p.url());
    await p.keyboard.press('Enter');
    try { await p.waitForURL('**/payment/mock**', { timeout: 8000 }); ok('book: Enter on Pay goes to payment'); } catch (e) { bad('book: Pay did not pay'); }
    errs.length ? bad('book errors: ' + errs.join('|')) : ok('book: no browser errors');
  }
  // ---- Sales hero: the next control pulses
  {
    const p = await (await b.newContext(dev)).newPage(); await p.goto(URL + '/?v=pro'); await p.waitForTimeout(1500);
    await p.click('.ph-row[data-pick-pass="dream_dhaka"]'); await p.waitForTimeout(1600);
    await p.locator('#email').blur().catch(() => {}); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(500);
    (await anim(p, '#email')) !== 'none' ? ok('pro: the email field pulses as the next step') : bad('pro: email not pulsing');
    /শেরাটন/.test(await p.textContent('[data-os-vipnudge-t]').catch(() => '')) ? ok('pro: Dhaka office picked, the other Dhaka venue (Sheraton) is offered') : bad('pro: no Dhaka hint');
  }
  // ---- Express / Simple: Dhaka asks which venue
  for (const v of ['express', 'simple']) {
    const p = await (await b.newContext(dev)).newPage(); await p.goto(URL + '/?v=' + v); await p.waitForTimeout(1500);
    await p.evaluate(() => document.querySelector('#book').scrollIntoView()); await p.waitForTimeout(400);
    await p.click('.x-city button[data-city="ঢাকা"]'); await p.waitForTimeout(700);
    (await p.isVisible('[data-city-ask]')) && (await p.locator('.x-ask-pulse').count()) === 2 ? ok(`${v}: Dhaka asks Sheraton or Dhaka Office, both pulse`) : bad(`${v}: Dhaka question`);
    await p.click('.qf-venue[data-venue="dream_dhaka"]'); await p.waitForTimeout(700);
    !(await p.isVisible('[data-city-ask]')) ? ok(`${v}: picking a venue closes the question`) : bad(`${v}: question stayed`);
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
