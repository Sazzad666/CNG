// No JavaScript: headline, price, phone number and a working basic form on every page; legal pages; share + Event data.
// Usage: GVE_URL=http://127.0.0.1:3100/expo node .claude/skills/run-gip-expo/checks-nojs.cjs   (PAYMENT_MODE=mock)
const { chromium } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const BASE = new (require('url').URL)(URL).pathname.replace(/\/$/, '');
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
const expect = (c, m, x) => (c ? ok(m) : fail(m + (x ? ' :: ' + String(x).slice(0, 200) : '')));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  try {
    for (const path of ['/?v=pro', '/?v=steps', '/?v=express', '/?v=simple', '/?v=book']) {
      await p.goto(URL + path);
      const vis = async (sel) => p.locator(sel).first().isVisible().catch(() => false);
      const okAll = (await vis('h1')) && /৳/.test(await p.locator('form.nojs-form').first().innerText().catch(() => '')) && (await p.locator('a[href^="tel:"]:visible').count()) > 0 && (await vis('form.nojs-form')) && !(await vis('#bookForm, #quickForm, #eventForm'));
      expect(okAll, `${path}: headline, price, phone number and the basic form show; the scripted form hides`);
    }
    // book through the basic form
    await p.goto(URL + '/?v=pro');
    const f = p.locator('form.nojs-form');
    await f.locator('select[name=pass]').selectOption('dream_dhaka');
    await f.locator('input[name=email]').fill('nojs' + String(Date.now()).slice(-8) + '@example.com');
    await f.locator('select[name=qty]').selectOption('2');
    await f.locator('button[type=submit]').evaluate((e) => { document.documentElement.style.scrollBehavior = 'auto'; e.scrollIntoView({ block: 'center' }); });   // the page scrolls smoothly, which never settles for Playwright with JS off
    await f.locator('button[type=submit]').click(); await p.waitForURL('**/payment/mock**');
    ok('basic form books without JavaScript and opens the payment page');
    await p.goto(URL + '/events?venue=SYLHET');
    const g = p.locator('form.nojs-form');
    await g.locator('input[name=full_name]').fill('No Script'); await g.locator('input[name=email]').fill('x' + Date.now() + '@mailinator.com');
    await g.locator('button[type=submit]').evaluate((e) => { document.documentElement.style.scrollBehavior = 'auto'; e.scrollIntoView({ block: 'center' }); });   // the page scrolls smoothly, which never settles for Playwright with JS off
    await g.locator('button[type=submit]').click();
    await p.waitForLoadState();
    expect(/ঠিক করুন/.test(await p.textContent('h1')) && /ইমেইল/.test(await p.textContent('main')), 'a wrong email gets a readable page saying what to fix', await p.textContent('body'));

    // legal pages
    for (const [path, h] of [['/legal/terms', 'শর্তাবলি'], ['/legal/privacy', 'গোপনীয়তা'], ['/legal/refund', 'রিফান্ড']]) {
      const r = await p.goto(URL + path);
      expect(r.status() === 200 && (await p.textContent('h1')).includes(h), `${path} renders`);
    }
    const legalLinks = await (await ctx.newPage()).goto(URL + '/?form=quick').then(async (r) => (await r.text()).match(/href="[^"]*\/legal\/(terms|privacy|refund)"/g) || []);
    expect(legalLinks.length >= 3 && legalLinks.every((l) => l.includes(BASE + '/legal/')), 'legal links under the pay button and in the footer carry the base path', legalLinks.slice(0, 3));

    // share tags + Event data
    for (const path of ['/?v=pro', '/events?venue=SHERATON']) {
      await p.goto(URL + path);
      const canon = await p.getAttribute('link[rel=canonical]', 'href'), og = await p.getAttribute('meta[property="og:image"]', 'content');
      expect(/^https?:\/\//.test(canon) && canon.includes(BASE || '/') && /og\.jpg$/.test(og), `${path}: canonical and share image are absolute URLs`, canon + ' ' + og);
      const ld = JSON.parse(await p.textContent('script[type="application/ld+json"]'));
      const evs = ld['@graph'] || [ld];
      const good = evs.every((e) => e['@type'] === 'Event' && e.startDate && e.location && e.offers && /^\d+$/.test(e.offers.price) && e.offers.priceCurrency === 'BDT' && /schema\.org\/(InStock|LimitedAvailability|SoldOut)/.test(e.offers.availability));
      expect(good, `${path}: schema.org Event data for ${evs.length} venue(s) with live price and availability`);
      const img = await p.request.get(og.replace(/^https?:\/\/[^/]+/, new (require('url').URL)(URL).origin));
      expect(img.ok() && /image\/jpeg/.test(img.headers()['content-type']), 'share image is served');
    }
  } catch (e) { fail(e.message.split('\n')[0]); }
  await b.close(); process.exit(fails ? 1 : 0);
})();
