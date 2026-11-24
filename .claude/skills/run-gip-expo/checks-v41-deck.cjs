const { chromium, devices } = require('playwright');
const OUT = '/tmp/gve-shots/v41'; require('fs').mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:3000';
const quiet = () => { try { ['gve_optin', 'gve_skip', 'gve_toast_off', 'gve_exit'].forEach((k) => sessionStorage.setItem(k, '1')); } catch (e) {} };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [form, deckSel, card] of [['steps', '#bookForm [data-deck]', '#bookForm [data-deck] > [data-venue]'], ['quick', '#quickForm [data-deck]', '#quickForm [data-deck] > [data-venue]']]) {
    const p = await (await b.newContext({ ...devices['Galaxy S9+'] })).newPage();
    p.on('pageerror', (e) => errs.push(form + ' ' + e.message)); await p.addInitScript(quiet);
    await p.goto(BASE + '/?form=' + form); await p.waitForTimeout(1200);
    await p.evaluate((s) => { const d = document.querySelector(s); scrollTo(0, scrollY + d.getBoundingClientRect().top - 140); }, deckSel); await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + '/' + form + '-0-open.png' });
    await p.click(card + ' >> nth=1'); await p.waitForTimeout(250);
    await p.screenshot({ path: OUT + '/' + form + '-1-moving.png' });
    await p.waitForTimeout(900);
    await p.evaluate((s) => { const d = document.querySelector(s); scrollTo(0, scrollY + d.getBoundingClientRect().top - 140); }, deckSel); await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + '/' + form + '-2-stacked.png' });
    const st = await p.evaluate((s) => { const d = document.querySelector(s); return { stacked: d.classList.contains('is-stacked'), front: (d.querySelector('.is-front') || {}).dataset?.venue, more: (d.nextElementSibling || {}).textContent, h: Math.round(d.getBoundingClientRect().height) }; }, deckSel);
    console.log(form, 'after pick', JSON.stringify(st));
    // tap the top peeking edge: that venue comes to the front
    const back = await p.$(card + '.is-back');
    await p.evaluate(() => { const t = document.getElementById('rewardToast'); if (t) t.classList.add('hidden'); }); const r = await back.boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + 6); await p.waitForTimeout(1000);
    console.log(form, 'after edge tap', JSON.stringify(await p.evaluate((s) => ({ front: (document.querySelector(s + ' .is-front') || {}).dataset?.venue, checked: (document.querySelector(s + ' input:checked') || {}).value }), deckSel)));
    // fan out with the button, then pick the first
    await p.evaluate((s) => { const m = document.querySelector(s).closest('form').querySelector('.deck-more'); m.scrollIntoView({ block: 'center' }); m.click(); }, deckSel); await p.waitForTimeout(800);
    console.log(form, 'after fan', await p.evaluate((s) => document.querySelector(s).classList.contains('is-stacked'), deckSel));
    await p.screenshot({ path: OUT + '/' + form + '-3-fanned.png' });
    await p.close();
  }
  console.log('errors:', errs.length ? errs : 'none'); await b.close();
})();
