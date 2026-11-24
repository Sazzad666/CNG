'use strict';
// Renders the running site into a static, browsable copy (flat .html files with relative links).
// The homepage becomes index.html with its document wrapper removed, so it can be the front page of a
// published Artifact (which supplies its own <html>/<head>/<body>). Forms don't post here: they go to the
// matching thank-you page.
// Usage: node scripts/export-preview.js [baseUrl] [outDir]
const fs = require('fs');
const path = require('path');

const base = process.argv[2] || 'http://localhost:3000';
const out = path.resolve(process.argv[3] || '.preview');
const content = require('../src/content');
const ROOT = path.join(__dirname, '..');

const pages = [
  ['/', 'index'], ['/services', 'services'], ...content.services().map((s) => [`/services/${s.key}`, `services-${s.key}`]),
  ['/work', 'work'], ...content.projects().map((p) => [`/work/${p.slug}`, `work-${p.slug}`]),
  ['/about', 'about'], ['/estimate', 'estimate'], ['/contact', 'contact'],
  ['/thank-you?type=enquiry', 'thank-you-enquiry'], ['/thank-you?type=estimate', 'thank-you-estimate'], ['/thank-you?type=audit', 'thank-you-audit'],
  ['/privacy', 'privacy'], ['/credits', 'credits'], ['/this-page-does-not-exist', 'not-found'],
];
const fileFor = new Map(pages.map(([u, n]) => [u, n + '.html']));

function mapHref(href) {
  const [p, hash] = href.split('#');
  const [pathname, query] = p.split('?');
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return '#';
  if (pathname === '/thank-you') return fileFor.get(p) || 'thank-you-enquiry.html';
  const f = fileFor.get(pathname);
  if (!f) return href;
  return f + (query ? '?' + query : '') + (hash ? '#' + hash : '');
}

function rewrite(html) {
  return html
    .replace(/(["\s,(])\/(img|css|js|fonts|brand|vendor)\//g, '$1$2/')
    .replace(/href="(\/[^"]*)"/g, (m, h) => `href="${mapHref(h)}"`)
    .replace(/<link rel="preload"[^>]*>/g, '')
    .replace('</body>', '<script src="js/preview.js"></script>\n</body>');
}

(async () => {
  fs.rmSync(out, { recursive: true, force: true });
  for (const d of ['img', 'css', 'js', 'fonts', 'brand', 'vendor']) fs.mkdirSync(path.join(out, d), { recursive: true });
  for (const d of ['img', 'js', 'fonts', 'brand']) for (const f of fs.readdirSync(path.join(ROOT, 'public', d))) {
    if (f.startsWith('_')) continue;
    fs.copyFileSync(path.join(ROOT, 'public', d, f), path.join(out, d, f));
  }
  fs.writeFileSync(path.join(out, 'css', 'app.css'), fs.readFileSync(path.join(ROOT, 'public/css/app.css'), 'utf8').replace(/url\(\/fonts\//g, 'url(../fonts/'));
  fs.copyFileSync(path.join(ROOT, 'node_modules/motion/dist/motion.js'), path.join(out, 'vendor', 'motion.js'));
  fs.writeFileSync(path.join(out, 'js', 'preview.js'), `/* Preview only: forms have no server here, so a submit goes to the matching thank-you page. */
(function () {
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.matches || !f.matches('[data-lead-form]')) return;
    var est = f.querySelector('[data-est-submit]');
    if (est && est.hidden) return; // estimator steps 1-4: let it move to the next step
    e.preventDefault(); e.stopImmediatePropagation();
    var type = (f.querySelector('input[name="type"]') || {}).value || 'enquiry';
    var s = f.querySelector('.form-status');
    if (s) { s.hidden = false; s.style.color = '#C6F432'; s.textContent = 'Preview: on the live site this is saved to your admin inbox. Opening the thank-you page...'; }
    setTimeout(function () { location.href = 'thank-you-' + type + '.html'; }, 1100);
  }, true);
})();
`);
  for (const [url, name] of pages) {
    const res = await fetch(base + url);
    let html = rewrite(await res.text());
    if (name === 'index') {
      // front page of the Artifact: keep the head's contents and the body's contents, drop the wrapper tags
      html = html.replace(/<!doctype html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<head>\s*/i, '')
        .replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '')
        .replace(/<\/head>\s*/i, '').replace(/<body[^>]*>/i, '').replace(/<\/body>\s*<\/html>\s*$/i, '');
    }
    fs.writeFileSync(path.join(out, name + '.html'), html);
  }
  console.log(`${pages.length} pages exported to ${out}`);
})().catch((e) => { console.error(e); process.exit(1); });
