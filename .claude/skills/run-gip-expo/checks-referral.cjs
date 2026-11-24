// Referral ladder (the only referral reward; no per-friend payback on top): buyer A pays, friends B and C arrive on A's
// ?r= link and pay; A's e-ticket shows the ladder, check-in lists the rewards to give, Admin › Referrals records them
// (step 2 gets a voucher code made automatically) and the e-ticket then shows the voucher code. Run with the server in PAYMENT_MODE=mock and an admin 'owner' / 'SuperSecret123' (local test data).
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
async function buy(b, link, mail, k) {
  const p = await (await b.newContext(devices['iPhone 13'])).newPage();
  await p.goto(URL + link); await p.waitForTimeout(900);
  await p.click(`.b-date[data-k="${k}"]`); await p.waitForTimeout(900); await p.click('[data-next]'); await p.waitForTimeout(500);
  await p.fill('#bEmail', mail); await p.locator('#bEmail').blur(); await p.waitForTimeout(600); await p.click('#bPay');
  await p.waitForURL('**/payment/mock**', { timeout: 10000 }); await p.click('button[value="pay"]'); await p.waitForURL('**/ticket/**', { timeout: 10000 });
  return p;
}
(async () => {
  const b = await chromium.launch(), stamp = String(Date.now()).slice(-8);
  // two-sided: the friend gets ৳100 off on top of the offer (Admin › Referrals)
  const ad0 = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await ad0.goto(URL + '/admin/login'); await ad0.fill('#username', 'owner'); await ad0.fill('#password', 'SuperSecret123'); await ad0.click('button:has-text("Sign in")'); await ad0.waitForURL(URL + '/admin');
  await ad0.goto(URL + '/admin/referrals'); await ad0.fill('input[name="referral_off"]', '100'); await ad0.click('form[action$="/referrals/settings"] button'); await ad0.waitForTimeout(500);
  const a = await buy(b, '/?v=book', 'refa' + stamp + '@gmail.com', 'dream_dhaka');
  const link = await a.getAttribute('[data-copy]', 'data-copy').catch(() => null);
  link && /[?&]r=/.test(link) ? ok('buyer A has a share link: ' + link) : bad('no share link on the e-ticket');
  /বন্ধুকে আনুন/.test(await a.textContent('#tkRefT').catch(() => '')) && !(await a.locator('[data-box]').count()) ? ok('share box: ladder only, no per-friend payback box (no double reward)') : bad('share box: ' + await a.textContent('#tkRefT').catch(() => ''));
  const path = link.replace(/^https?:\/\/[^/]+/, '').replace(/^\/expo/, '');
  // the friend's page: who sent them, the discount already applied, and the referral line beside pay
  { const fp = await (await b.newContext(devices['iPhone 13'])).newPage(); await fp.goto(URL + path.replace('/?', '/?v=book&')); await fp.waitForTimeout(800);
    const w = await fp.textContent('[data-ref-welcome]').catch(() => '');
    /পাঠিয়েছেন/.test(w) && /১০০/.test(w) ? ok('friend sees who sent them and the ৳100 applied: ' + w.replace(/\s+/g, ' ').trim()) : bad('no welcome banner: ' + w);
    /বন্ধু আনলে|বন্ধুকে আনলে/.test(await fp.textContent('.rcv')) ? ok('referral reward mentioned beside the pay button') : bad('no referral line');
    await fp.context().close(); }
  const f = await buy(b, path.replace('/?', '/?v=book&'), 'refb' + stamp + '@gmail.com', 'dream_sylhet');
  await new Promise((r) => setTimeout(r, 800));
  const q = require('child_process').execSync(`mysql -uroot gve_local -N -e "SELECT COUNT(*) FROM mail_queue WHERE kind='ref_friend' AND to_email='refa${stamp}@gmail.com'"`).toString().trim();
  q === '1' ? ok('buyer A is emailed: your friend bought') : bad('no ref_friend email queued (' + q + ')');
  /৳৩৯৯/.test(await f.textContent('main')) ? ok('friend paid ৳399 (৳499 offer − ৳100 friend discount)') : bad('friend price: ' + (await f.textContent('main')).replace(/\s+/g, ' ').slice(0, 200));
  await a.reload(); await a.waitForTimeout(500);
  { const c = await a.locator('.tk-ref-n', { hasText: 'বুক করেছেন' }).textContent().catch(() => ''); /১ জন/.test(c) ? ok('A sees 1 friend bought: ' + c.trim()) : bad('A count: ' + c); }
  // the reward ladder: 1 friend = step 1 won, the next step named
  const lad = await a.textContent('.tk-lad').catch(() => '');
  (await a.locator('.tk-lad li.is-done').count()) === 1 && /আর ১ জন/.test(lad) ? ok('ladder: step 1 won, "' + (await a.textContent('.tk-lad-h')).trim() + '"') : bad('ladder: ' + lad.replace(/\s+/g, ' ').slice(0, 160));
  // the share image: drawn on the page, shown to save or share
  await a.click('[data-share-img]'); await a.waitForTimeout(2500);
  const src = await a.getAttribute('[data-share-prev]', 'src'), dims = await a.evaluate(async () => { const i = document.querySelector('[data-share-prev]'); try { await i.decode(); } catch (e) {} return i.naturalWidth + 'x' + i.naturalHeight; });
  /^blob:/.test(src || '') && dims === '1080x1920' ? ok('share image made: ' + dims) : bad('share image: ' + src + ' ' + dims);
  const ad = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await ad.goto(URL + '/admin/login'); await ad.fill('#username', 'owner'); await ad.fill('#password', 'SuperSecret123'); await ad.click('button:has-text("Sign in")'); await ad.waitForURL(URL + '/admin');
  const aCode = a.url().match(/ticket\/([A-Z0-9]{8})/)[1];
  await ad.goto(URL + '/admin/checkin?code=' + aCode);
  /Referral rewards to give/.test(await ad.textContent('main')) ? ok('check-in shows the rewards to give: ' + (await ad.textContent('[data-ladder-won]')).replace(/\s+/g, ' ').trim()) : bad('check-in: no rewards');
  // one reward, not two: ticking the old payback while the ladder is on keeps payback off
  await ad.goto(URL + '/admin/referrals'); await ad.check('input[name="ref_payback_on"]'); await ad.click('form[action$="/referrals/settings"] button'); await ad.waitForTimeout(500);
  const pb = require('child_process').execSync(`mysql -uroot gve_local -N -e "SELECT v FROM settings WHERE k='ref_payback_on'"`).toString().trim();
  pb === '0' && /Payback stays off/.test(await ad.textContent('main')) ? ok('payback cannot be switched on with the ladder (no double reward)') : bad('payback setting: ' + pb);
  // step 1 handed over: recorded, then shown at check-in
  const row = () => ad.locator('div.p-5', { hasText: 'refa' + stamp }).first();
  await row().locator('[data-rewards] form input[name="note"]').first().fill('upgraded at desk'); await row().locator('[data-rewards] button:has-text("Record given")').first().click(); await ad.waitForTimeout(600);
  /Recorded:/.test(await ad.textContent('main')) && (await row().locator('[data-given]').count()) === 1 ? ok('step 1 reward recorded as given') : bad('record step 1: ' + (await ad.textContent('main')).replace(/\s+/g, ' ').slice(0, 300));
  // a second friend pays: step 2 (৳2,000 voucher) won; recorded with a code made automatically
  const f2 = await buy(b, path.replace('/?', '/?v=book&'), 'refc' + stamp + '@gmail.com', 'dream_sylhet'); await f2.context().close();
  await ad.goto(URL + '/admin/referrals');
  const todo = await row().locator('[data-rewards] form button:has-text("Record given")').count();
  todo === 1 ? ok('2 friends: the ৳2,000 voucher waits to be given') : bad('step 2 forms: ' + todo);
  await row().locator('[data-rewards] form button:has-text("Record given")').first().click(); await ad.waitForTimeout(600);
  const vcode = ((await ad.textContent('main')).match(/code (V[A-Z0-9]{6})/) || [])[1];
  vcode && /৳2,000/.test(await ad.textContent('[data-vsum-n]')) ? ok('voucher recorded with code ' + vcode + '; rewards given worth ৳2,000') : bad('voucher: ' + (await ad.textContent('main')).replace(/\s+/g, ' ').slice(0, 300));
  (await ad.textContent('[data-voucher-log]').catch(() => '')).includes(vcode || '##') ? ok('voucher listed in Rewards given') : bad('voucher log');
  await ad.goto(URL + '/admin/checkin?code=' + aCode);
  /given \(V/.test(await ad.textContent('[data-ladder-won]')) ? ok('check-in shows the voucher as given') : bad('check-in after: ' + (await ad.textContent('[data-ladder-won]')).replace(/\s+/g, ' '));
  await a.reload(); await a.waitForTimeout(400);
  (await a.textContent('.tk-lad')).includes(vcode || '##') ? ok('e-ticket shows the voucher code') : bad('ticket voucher: ' + (await a.textContent('.tk-lad')).replace(/\s+/g, ' ').slice(0, 300));
  await ad0.goto(URL + '/admin/referrals'); await ad0.fill('input[name="referral_off"]', '100'); await ad0.click('form[action$="/referrals/settings"] button');
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
