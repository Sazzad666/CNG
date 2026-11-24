const { chromium, devices } = require('playwright');
const OUT = '/tmp/gve-shots/v39'; require('fs').mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:3000';
const quiet = () => { try { sessionStorage.setItem('gve_optin', '1'); sessionStorage.setItem('gve_skip', '1'); sessionStorage.setItem('gve_toast_off', '1'); } catch (e) {} };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ ...devices['Galaxy S9+'] });
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.addInitScript(quiet); return p; };
  const wt = (p) => p.evaluate(() => ({ won: [...document.querySelectorAll('[data-wt-step].is-won')].map((n) => n.dataset.wtStep), say: (document.querySelector('[data-wt-say]') || {}).textContent, all: document.querySelector('[data-wt]').classList.contains('wt-all'), note: (document.querySelector('.earn-note.show') || {}).textContent || '' }));

  // Express: first visit, then a reload (offer already claimed) -> "ছাড় যুক্ত হয়েছে" both times
  let p = await page(); await p.goto(BASE + '/?form=quick'); await p.waitForTimeout(1600);
  console.log('quick load 1', JSON.stringify(await wt(p)));
  await p.reload(); await p.waitForTimeout(1300);
  console.log('quick load 2', JSON.stringify(await wt(p)));
  await p.locator('#quickForm').scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, -90));
  await p.screenshot({ path: OUT + '/quick-0.png' });
  await p.click('.qf-venue >> nth=0'); await p.waitForTimeout(700);
  console.log('quick venue', JSON.stringify(await wt(p)));
  await p.fill('#quickForm input[name=phone]', '01712345678'); await p.waitForTimeout(1200);
  console.log('quick phone', JSON.stringify(await wt(p)));
  await p.evaluate(() => document.querySelector('#quickForm').scrollIntoView()); await p.evaluate(() => scrollBy(0, -90)); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/quick-done.png' });
  await p.close();

  // 2-step
  p = await page(); await p.goto(BASE + '/?v=pro'); await p.waitForTimeout(1200);
  await p.locator('#bookForm').scrollIntoViewIfNeeded(); await p.evaluate(() => document.querySelector('#book').scrollIntoView()); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/steps-0.png' });
  console.log('steps load', JSON.stringify(await wt(p)));
  await p.click('#bookForm .pt >> nth=1'); await p.waitForTimeout(800);
  console.log('steps venue', JSON.stringify(await wt(p)));
  await p.click('.flag-tile >> nth=0'); await p.waitForTimeout(300);
  const c1 = await p.$('#bookForm #email') ? '#email' : '#phone';
  await p.fill('#bookForm ' + c1, c1 === '#email' ? 'test@example.com' : '01712345678'); await p.waitForTimeout(800);
  console.log('steps contact', JSON.stringify(await wt(p)));
  await p.evaluate(() => document.querySelector('#book').scrollIntoView()); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/steps-1.png' });
  await p.click('[data-next]'); await p.waitForTimeout(900);
  await p.fill('#full_name', 'Rahim Uddin');
  if (c1 === '#email') await p.fill('#phone', '01712345678');
  await p.waitForTimeout(1300);
  console.log('steps ready', JSON.stringify(await wt(p)));
  await p.evaluate(() => document.querySelector('#book').scrollIntoView()); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/steps-ready.png' });
  await p.close();

  // gallery tile + after-pay on the venue page
  p = await page(); await p.goto(BASE + '/events?venue=SHERATON'); await p.waitForTimeout(800);
  await p.locator('.gal').scrollIntoViewIfNeeded(); await p.waitForTimeout(1800);
  console.log('gallery tile text:', JSON.stringify(await p.evaluate(() => { const el = document.querySelector('.gal-more-in'); return [...el.children].filter((c) => !c.classList.contains('sr-only')).map((c) => c.textContent).join(' '); })));
  await p.locator('.gal').screenshot({ path: OUT + '/gal.png' });
  console.log('after-pay:', (await p.textContent('.ap')).replace(/\s+/g, ' ').trim());
  console.log('scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth));
  await p.close();
  console.log('errors:', errs.length ? errs : 'none'); await b.close();
})();
