// Speed on a budget Android over slow 4G: largest contentful paint (LCP) and layout shift (CLS) per page.
// Throttling: CPU 4x slower, 150 ms round trip, 1.6 Mbit/s down, 750 kbit/s up (Lighthouse's "slow 4G" mobile profile).
// Usage: GVE_URL=http://127.0.0.1:3100/expo node .claude/skills/run-gip-expo/checks-speed.cjs [runs]
// Exit 1 if any page misses LCP <= 2.5 s or CLS < 0.1 (median of the runs).
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const RUNS = Number(process.argv[2] || 3);
const PAGES = (process.env.GVE_SPEED_PAGES || '/?v=pro,/?form=quick').split(',');
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
(async () => {
  const b = await chromium.launch();
  let bad = 0;
  for (const path of PAGES) {
    const lcp = [], cls = [], bytes = [];
    for (let i = 0; i < RUNS; i++) {
      const ctx = await b.newContext({ ...devices['Moto G4'] });
      const p = await ctx.newPage();
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let total = 0; p.on('response', async (r) => { try { const h = await r.headerValue('content-length'); total += Number(h || 0); } catch (_) {} });
      await p.addInitScript(() => {
        window.__lcp = 0; window.__cls = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      });
      await p.goto(URL + path, { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(2500);                         // late shifts (fonts, timers, sticky bars) count too
      const m = await p.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls }));
      lcp.push(m.lcp); cls.push(m.cls); bytes.push(total);
      await ctx.close();
    }
    const L = med(lcp), C = med(cls), ok = L <= 2500 && C < 0.1;
    if (!ok) bad++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${path.padEnd(24)} LCP ${(L / 1000).toFixed(2)} s   CLS ${C.toFixed(3)}   ~${Math.round(med(bytes) / 1024)} KB (runs: LCP ${lcp.map((x) => (x / 1000).toFixed(2)).join('/')})`);
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
