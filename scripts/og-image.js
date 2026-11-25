'use strict';
// Renders public/brand/og.png (1200x630) from the brand fonts and logo. Usage: node scripts/og-image.js [baseUrl]
const { chromium } = require('playwright');
const path = require('path');
const base = process.argv[2] || 'http://localhost:3000';
const html = `<!doctype html><html><head><link rel="stylesheet" href="${base}/css/app.css"></head>
<body style="margin:0;width:1200px;height:630px;background:#0B0F0C;overflow:hidden">
<div style="position:absolute;inset:0;background-image:linear-gradient(rgba(243,241,234,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(243,241,234,.05) 1px,transparent 1px);background-size:60px 60px"></div>
<div style="position:absolute;right:-140px;top:-160px;width:620px;height:620px;border-radius:999px;background:rgba(198,244,50,.13);filter:blur(80px)"></div>
<div style="position:absolute;left:80px;top:72px"><img src="${base}/brand/logo-dark.svg" style="height:74px;margin-left:-16px"></div>
<h1 class="font-display" style="position:absolute;left:80px;bottom:150px;margin:0;color:#F3F1EA;font-size:84px;font-weight:700;line-height:1;letter-spacing:-.02em">Websites & brands<br>that help you <em class="accent" style="color:#C6F432">grow.</em></h1>
<p style="position:absolute;left:80px;bottom:78px;margin:0;color:rgba(243,241,234,.7);font:500 28px 'Inter Tight',sans-serif">Digital agency in Dhaka · +880 1732-508485</p>
</body></html>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  // served from the site itself so fonts and the logo load from the same origin
  const fs = require('fs');
  const tmp = path.join(__dirname, '..', 'public', 'brand', '_og.html');
  fs.writeFileSync(tmp, html.split(base).join(''));
  try { await p.goto(base + '/brand/_og.html', { waitUntil: 'networkidle' }); } finally { fs.unlinkSync(tmp); }
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(__dirname, '..', 'public', 'brand', 'og.png') });
  await b.close();
  console.log('og.png written');
})();
