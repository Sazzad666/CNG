const { chromium, devices } = require('playwright');
const OUT = '/tmp/gve-shots/v38'; require('fs').mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:3000';
const quiet = () => { try { sessionStorage.setItem('gve_optin', '1'); sessionStorage.setItem('gve_skip', '1'); sessionStorage.setItem('gve_toast_off', '1'); } catch (e) {} };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const page = async (url, opts = {}) => {
    const ctx = await b.newContext({ ...devices['Galaxy S9+'], ...opts });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(url + ' ' + e.message));
    await p.addInitScript(quiet);
    return p;
  };
  // 1) headline painted with scripts blocked (first paint = CSS only)
  for (const url of ['/?v=pro', '/?form=quick', '/events?venue=SHERATON']) {
    const p = await page(url, { javaScriptEnabled: false });
    await p.goto(BASE + url);
    const r = await p.evaluate(() => { const h = document.querySelector('h1'); const cs = getComputedStyle(h); const rc = h.getBoundingClientRect();
      const card = document.querySelector('#book'); return { h1: h.textContent.trim().slice(0, 30), opacity: cs.opacity, vis: cs.visibility, top: Math.round(rc.top), bookOpacity: card ? getComputedStyle(card.querySelector('.pass-card, .evb-price') || card).opacity : null,
        googleFonts: !!document.querySelector('link[href*="fonts.googleapis"]') }; });
    console.log('no-JS', url, JSON.stringify(r));
    await p.screenshot({ path: OUT + '/nojs-' + url.replace(/\W+/g, '_') + '.png' });
    await p.context().close();
  }
  // 2) dock sticks
  for (const url of ['/?v=pro', '/?form=quick']) {
    const p = await page(url); await p.goto(BASE + url); await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const d = [...document.querySelectorAll('.next-dock')].find((x) => x.offsetParent);
      const f = document.querySelector('#bookForm, #quickForm'); scrollTo(0, scrollY + f.getBoundingClientRect().top - 80);
      return new Promise((res) => setTimeout(() => res({ dockBottom: Math.round(d.getBoundingClientRect().bottom), vh: innerHeight }), 300)); });
    console.log('dock', url, JSON.stringify(r), r.dockBottom <= r.vh ? 'STICKS' : 'NOT STICKY');
    await p.screenshot({ path: OUT + '/dock-' + url.replace(/\W+/g, '_') + '.png' });
    await p.context().close();
  }
  // 3) venue page: discount is announced, meter shows, coins
  {
    const p = await page('/events?venue=SHERATON'); await p.goto(BASE + '/events?venue=SHERATON');
    await p.waitForTimeout(400);
    const coins = await p.evaluate(() => document.querySelectorAll('.earn-coin').length);
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => ({ note: (document.querySelector('.earn-note') || {}).textContent, meter: (document.querySelector('.earn-meter b') || {}).textContent,
      live: [...document.querySelectorAll('[role=status][aria-live]')].map((e) => e.textContent).filter(Boolean), was: document.querySelector('[data-ev-was]').className,
      cdHidden: document.querySelector('[data-ev-cd]').getAttribute('aria-hidden'), sr: document.querySelector('[data-ev-deadline]').textContent }));
    console.log('venue claim', JSON.stringify({ coinsMidFlight: coins, ...r }));
    await p.screenshot({ path: OUT + '/venue-top.png' });
    await p.click('[data-ev-plus]'); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + '/venue-plus-coins.png' }); await p.waitForTimeout(1200);
    console.log('venue +1 meter', await p.textContent('.earn-meter b'));
    // call-back
    await p.fill('#cbP-venue', '0171234'); await p.click('form[data-source=venue] .cb-btn'); await p.waitForTimeout(200);
    console.log('callback bad number err:', await p.textContent('#cbE-venue'));
    await p.fill('#cbP-venue', '01712345678'); await p.click('form[data-source=venue] .cb-btn'); await p.waitForTimeout(800);
    console.log('callback done visible:', await p.isVisible('form[data-source=venue] [data-callback-done]'));
    await p.locator('form[data-source=venue]').screenshot({ path: OUT + '/callback-done.png' });
    await p.context().close();
  }
  // 4) steps form: pick a pass -> coins + meter
  {
    const p = await page('/?v=pro'); await p.goto(BASE + '/?v=pro'); await p.waitForTimeout(900);
    const r0 = await p.evaluate(() => ({ meter: (document.querySelector('.earn-meter') || {}).className, val: (document.querySelector('.earn-meter b') || {}).textContent }));
    console.log('steps initial meter', JSON.stringify(r0));
    await p.locator('#book').scrollIntoViewIfNeeded();
    await p.screenshot({ path: OUT + '/steps-book.png' });
    await p.context().close();
  }
  // 5) quick form: express unlock note
  {
    const p = await page('/?form=quick'); await p.goto(BASE + '/?form=quick'); await p.waitForTimeout(1500);
    console.log('quick note', await p.evaluate(() => (document.querySelector('.earn-note') || {}).textContent || '(none)'));
    await p.click('.qf-venue >> nth=0'); await p.waitForTimeout(250);
    await p.screenshot({ path: OUT + '/quick-coins.png' }); await p.waitForTimeout(1200);
    console.log('quick meter', await p.evaluate(() => (document.querySelector('.earn-meter b') || {}).textContent));
    await p.screenshot({ path: OUT + '/quick-after.png' });
    await p.context().close();
  }
  // 6) reduced motion: feedback still visible
  {
    const p = await page('/events?venue=SHERATON', { reducedMotion: 'reduce' }); await p.goto(BASE + '/events?venue=SHERATON'); await p.waitForTimeout(800);
    await p.click('[data-ev-plus]');
    const r = await p.evaluate(() => { const t = document.querySelector('[data-ev-total]'); return { cls: t.className, anim: getComputedStyle(t).animationName, dur: getComputedStyle(t).animationDuration, coins: document.querySelectorAll('.earn-coin').length }; });
    console.log('reduced', JSON.stringify(r));
    await p.context().close();
  }
  console.log('errors:', errs.length ? errs : 'none'); await b.close();
})();
