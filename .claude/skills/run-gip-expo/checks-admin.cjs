// Admin crawl: every tab loads, every action works, nothing leaves the base path.
// Usage: GVE_URL=http://127.0.0.1:3100/expo node .claude/skills/run-gip-expo/checks-admin.cjs
const { chromium } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const BASE = new (require('url').URL)(URL).pathname.replace(/\/$/, '');
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('response', (r) => { if (r.status() >= 500) errs.push(r.status() + ' ' + r.url()); });
  p.on('request', (r) => { const u = new (require('url').URL)(r.url()); if (u.host === new (require('url').URL)(URL).host && BASE && !u.pathname.startsWith(BASE)) errs.push('left base path: ' + u.pathname); });
  try {
    await p.goto(URL + '/admin'); await p.waitForURL('**/admin/login**'); ok('/admin redirects to login when signed out');
    await p.fill('#username', process.env.GVE_ADMIN_USER || 'owner'); await p.fill('#password', process.env.GVE_ADMIN_PASS || 'SuperSecret123');
    await p.click('button:has-text("Sign in")'); await p.waitForURL(URL + '/admin'); ok('login');
    for (const t of ['', '/checkin', '/insights', '/callbacks', '/emails', '/offer', '/form', '/content', '/team', '/account', '/all']) {
      const r = await p.goto(URL + '/admin' + t);
      r.status() === 200 ? ok('admin' + (t || ' (leads)') + ' 200') : fail('admin' + t + ' ' + r.status());
    }
    for (const t of ['/export.csv', '/emails.csv', '/all.csv']) {
      const r = await p.request.get(URL + '/admin' + t);
      r.status() === 200 && /csv/.test(r.headers()['content-type'] || '') ? ok(t + ' downloads CSV') : fail(t + ' ' + r.status());
    }
    // open the newest lead and change its stage through the JSON endpoint (admin.js)
    await p.goto(URL + '/admin');
    const link = await p.$('a[href*="/admin/leads/"]');
    if (link) {
      await link.click(); await p.waitForLoadState('networkidle');
      const id = p.url().match(/leads\/(\d+)/)[1];
      const res = await p.evaluate(async ([base, id]) => {
        const csrf = document.querySelector('meta[name="csrf-token"]').content;
        const r = await fetch(base + '/admin/leads/' + id, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ activity_type: 'note', activity_body: 'Test note from the admin crawl' }) });
        return r.json();
      }, [BASE, id]);
      res.ok ? ok('lead ' + id + ': note added via JSON') : fail('lead note: ' + JSON.stringify(res));
      await p.reload(); (await p.textContent('#timeline')).includes('Test note from the admin crawl') ? ok('note shows in the timeline') : fail('note missing from timeline');
    } else fail('no lead to open (run a booking test first)');
    // a request without the CSRF token is refused
    const bad = await p.request.post(URL + '/admin/offer', { form: { offer_hours: '24' } });
    bad.status() === 419 ? ok('admin POST without CSRF token refused (419)') : fail('admin POST without CSRF: ' + bad.status());
    await p.goto(URL + '/admin'); await p.click('button:has-text("Log out")'); await p.waitForURL('**/admin/login**'); ok('logout');
    const after = await p.goto(URL + '/admin/emails'); /login/.test(after.url()) ? ok('signed out: admin pages need login again') : fail('admin reachable after logout');
    errs.length ? fail('errors: ' + errs.join(' | ')) : ok('no browser errors, no 5xx, no request outside ' + (BASE || '/'));
  } catch (e) { fail(e.message); }
  await b.close(); process.exit(fails ? 1 : 0);
})();
