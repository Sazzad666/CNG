// Grades a single-page scroll animation against the failure modes seen in this project.
// usage: node check-scene.js <dir-with-index.html> <port>
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
const dir = process.argv[2], port = +process.argv[3] || 8790;
const gs = process.env.GSAP_DIST || path.join(process.cwd(), 'node_modules/gsap/dist/');
const srv = http.createServer((q, r) => { const f = path.join(dir, q.url === '/' ? 'index.html' : q.url); fs.readFile(f, (e, d) => { r.writeHead(e ? 404 : 200, { 'content-type': 'text/html; charset=utf-8' }); r.end(d || ''); }); }).listen(port);
(async () => {
  const b = await chromium.launch(); const out = {};
  async function page(w, h, rm) {
    const c = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: rm ? 'reduce' : 'no-preference', isMobile: w < 500, hasTouch: w < 500 });
    const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.route('https://cdnjs.cloudflare.com/**', r => { const u = r.request().url(); const f = /ScrollTrigger/.test(u) ? 'ScrollTrigger.min.js' : /gsap/.test(u) ? 'gsap.min.js' : null; f ? r.fulfill({ path: gs + f, contentType: 'application/javascript' }) : r.abort(); });
    await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    await p.goto(`http://localhost:${port}/`, { waitUntil: 'load' }); return p;
  }
  const p = await page(1440, 900);
  // 1. auto sequence: how many floor-like groups are fully visible after 9 s (spec: 5 by ~8 s)
  await p.waitForTimeout(9000);
  out.autoFloorsAfter9s = await p.evaluate(() => {
    const c = [...document.querySelectorAll('[data-scene-step]')];
    return c.filter(e => { const s = getComputedStyle(e); return +s.opacity > .9 && s.visibility !== 'hidden' && s.display !== 'none'; }).length;
  });
  // 2. hidden attribute respected
  out.hiddenButVisible = await p.evaluate(() => [...document.querySelectorAll('[hidden]')].filter(e => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden'; }).map(e => e.outerHTML.slice(0, 70)));
  // 3. token moves with scroll, and caption ends on the last message
  const pinned = await p.evaluate(() => { const e = document.querySelector('[data-scene-track]'); return e ? [e.getBoundingClientRect().top + scrollY, e.offsetHeight] : null; });
  out.tokenTrail = []; out.captions = [];
  if (pinned) for (const f of [0, .25, .5, .75, 1]) {
    await p.evaluate(([t, h, f]) => scrollTo(0, t + (h - innerHeight) * f), [pinned[0], pinned[1], f]);
    await p.waitForTimeout(1300);
    out.tokenTrail.push(await p.evaluate(() => { const t = document.querySelector('[data-scene-token]'); if (!t) return null; const r = t.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; }));
    out.captions.push(await p.evaluate(() => { const c = document.querySelector('[data-scene-caption][aria-current="true"]'); return c ? c.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) : null; }));
  }
  out.errorsDesktop = p.errs;
  // 4. phone overflow
  const m = await page(390, 844); await m.waitForTimeout(1500);
  out.phoneOverflowPx = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth); out.errorsPhone = m.errs;
  // 5. reduced motion: is the story readable (token at end or all captions shown) and are loops off?
  const r = await page(1440, 900, true); await r.waitForTimeout(1500);
  out.reducedMotion = await r.evaluate(() => ({ runningCssAnims: document.getAnimations().filter(a => a.playState === 'running').length, gsapTweens: window.gsap ? gsap.globalTimeline.getChildren(true, true, false).filter(t => t.isActive()).length : 'n/a' }));
  out.errorsReduced = r.errs;
  console.log(JSON.stringify(out, null, 1)); await b.close(); srv.close();
})();
