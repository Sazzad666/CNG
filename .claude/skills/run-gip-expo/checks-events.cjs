// Admin › Events & prices: per-event prices, discount switch, batch, capacity, seats, close time, and the discount on page load.
// Sets Elite to ৳4,000 / ৳1,500 and Economy's discount off, checks the public pages and a checkout, then puts the defaults back.
// Run with the server in PAYMENT_MODE=mock and an admin 'owner' / 'SuperSecret123' (local test data).
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
const DEF = { price_gold: 5000, offer_price_gold: 1999, price_dream_dhaka: 1500, offer_price_dream_dhaka: 600, price_dream_sylhet: 1000, offer_price_dream_sylhet: 499 };
async function save(ad, vals, ticks) {
  await ad.goto(URL + '/admin/events');
  for (const [k, v] of Object.entries(vals)) await ad.fill(`input[name="${k}"]`, String(v));
  for (const [k, on] of Object.entries(ticks || {})) await ad.setChecked(`input[name="${k}"]`, on);
  await ad.click('button:has-text("Save events")'); await ad.waitForLoadState();
  return ad.textContent('main');
}
const data = async (p, id) => JSON.parse(await p.textContent('#' + id));
(async () => {
  const b = await chromium.launch();
  const ad = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await ad.goto(URL + '/admin/login'); await ad.fill('#username', 'owner'); await ad.fill('#password', 'SuperSecret123'); await ad.click('button:has-text("Sign in")'); await ad.waitForURL(URL + '/admin');
  await ad.goto(URL + '/admin/offer'); /\/admin\/events/.test(ad.url()) ? ok('old Offer link opens Events & prices') : bad('redirect: ' + ad.url());
  (await ad.locator('nav a:has-text("Events & prices")').count()) ? ok('tab is called Events & prices') : bad('tab name');
  ['price_gold', 'offer_price_gold', 'discount_on_gold', 'seats_on_sale_gold', 'batch_gold', 'capacity_gold', 'reg_close_gold', 'offer_on', 'offer_auto', 'offer_restart'].every(Boolean) &&
    (await Promise.all(['price_gold', 'offer_price_gold', 'discount_on_gold', 'seats_on_sale_gold', 'batch_gold', 'capacity_gold', 'reg_close_gold', 'offer_on', 'offer_auto', 'offer_restart'].map((n) => ad.locator(`[name="${n}"]`).count()))).every((n) => n === 1)
    ? ok('one screen: prices, discount, seats, batch, capacity, close time and the timer') : bad('missing fields');
  (await ad.isChecked('[name="offer_on"]')) && (await ad.isChecked('[name="offer_auto"]')) && (await ad.isChecked('[name="offer_restart"]')) ? ok('discount on, on page load, restarting: all on by default') : bad('defaults');

  // a discount price above the regular price is refused
  /discount price must be/.test(await save(ad, { offer_price_gold: 6000 })) ? ok('refuses a discount price above the regular price') : bad('no error for offer > price');

  const t = await save(ad, { price_gold: 4000, offer_price_gold: 1500 }, { discount_on_dream_sylhet: false });
  /Saved/.test(t) && /63% off/.test(t) ? ok('saved Elite ৳4,000 / ৳1,500 (63% off shown)') : bad('save: ' + t.replace(/\s+/g, ' ').slice(0, 200));

  // a fresh visitor gets the discount on load
  const ctx = await b.newContext(devices['iPhone 13']), p = await ctx.newPage();
  await p.goto(URL + '/?v=book'); await p.waitForTimeout(600);
  const c = (await ctx.cookies()).find((x) => x.name === 'gve_offer');
  !c ? ok('discount not started on page load (starts on scroll / first date tap)') : bad('offer cookie set on load');
  const d = await data(p, 'b-data');
  !d.offer.claimed && d.offer.canClaim ? ok('page data: discount ready to open') : bad('offer state: ' + JSON.stringify(d.offer));
  d.passes.gold.price === 4000 && d.passes.gold.offerPrice === 1500 ? ok('Elite shows ৳4,000 → ৳1,500') : bad('gold: ' + JSON.stringify(d.passes.gold));
  d.passes.dream_sylhet.offerPrice === 1000 ? ok('Economy discount off: sells at ৳1,000') : bad('sylhet: ' + JSON.stringify(d.passes.dream_sylhet));
  d.passes.dream_dhaka.offerPrice === 600 ? ok('VIP unchanged at ৳600') : bad('dhaka: ' + JSON.stringify(d.passes.dream_dhaka));
  // the price the server charges matches
  await p.click('.b-date[data-k="gold"]'); await p.waitForTimeout(900); await p.click('[data-next]'); await p.waitForTimeout(500);
  await p.fill('#bEmail', 'ev' + Date.now() + '@gmail.com'); await p.locator('#bEmail').blur(); await p.waitForTimeout(600); await p.click('#bPay');
  await p.waitForURL('**/payment/mock**', { timeout: 10000 });
  /1,?500|১,৫০০/.test(await p.textContent('body')) ? ok('checkout charges ৳1,500 for Elite') : bad('mock pay page: ' + (await p.textContent('body')).replace(/\s+/g, ' ').slice(0, 200));
  // Express page also gets it on load
  const x = await (await b.newContext(devices['iPhone 13'])).newPage(); await x.goto(URL + '/?v=express'); await x.waitForTimeout(500);
  const xd = JSON.parse(await x.textContent('script[type="application/json"]'));
  !xd.offer.claimed ? ok('Express: no discount on load') : bad('express offer on load: ' + JSON.stringify(xd.offer));
  await x.mouse.wheel(0, 700); await x.waitForTimeout(1500);
  (await x.context().cookies()).some((k) => k.name === 'gve_offer') ? ok('Express: discount starts on scroll') : bad('no offer after scrolling');

  // put everything back
  const back = await save(ad, DEF, { discount_on_dream_sylhet: true });
  /Saved/.test(back) ? ok('defaults restored') : bad('restore');
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
