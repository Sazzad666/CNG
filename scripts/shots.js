'use strict';
// Screenshots of pages at four widths, and a check that nothing scrolls sideways.
// Usage: node scripts/shots.js [baseUrl] [outDir] [path ...]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const base = process.argv[2] || 'http://localhost:3000';
const out = process.argv[3] || path.join(__dirname, '..', '.shots');
const pages = process.argv.slice(4).length ? process.argv.slice(4) : ['/'];
const WIDTHS = [390, 768, 1024, 1440];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  let bad = 0;
  for (const p of pages) {
    for (const w of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
      await page.goto(base + p, { waitUntil: 'networkidle' });
      // scroll through so lazy images and reveals run, then back to the top
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(900);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const name = (p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '_')) + `-${w}.png`;
      await page.screenshot({ path: path.join(out, name), fullPage: true });
      if (over > 0) { bad++; console.log(`OVERFLOW ${p} @${w}: ${over}px`); }
      await page.close();
    }
  }
  await browser.close();
  console.log(bad ? `${bad} overflow problem(s)` : 'no horizontal overflow');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
