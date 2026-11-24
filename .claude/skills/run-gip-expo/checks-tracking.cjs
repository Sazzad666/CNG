// Phase 3: Meta pixel + Conversions API, funnel log, booking limit with staff exemption.
// Needs the server under test started with META_API_BASE=http://127.0.0.1:3911 (this script plays Meta there),
// PAYMENT_MODE=mock and MAIL_DEBUG=1. Optional: GVE_LIMIT_URL = a second server started with BOOKING_LIMIT=2 and
// META_API_BASE pointing at a closed port (Meta down).
// Usage: GVE_URL=http://127.0.0.1:3100/expo [GVE_LIMIT_URL=http://127.0.0.1:3200/expo] node .claude/skills/run-gip-expo/checks-tracking.cjs
const http = require('http');
const crypto = require('crypto');
const { chromium } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const LIMIT_URL = (process.env.GVE_LIMIT_URL || '').replace(/\/$/, '');
const PIXEL = '123456789012345', TOKEN = 'EAAtest' + 'x'.repeat(40) + 'Z9k2';
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
const expect = (c, m, x) => (c ? ok(m) : fail(m + (x ? ' :: ' + String(x).slice(0, 240) : '')));
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');

// --- stand-in for Meta's Conversions API ---
const server = [];
const fake = http.createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c));
  req.on('end', () => { try { const j = JSON.parse(body); (j.data || []).forEach((e) => server.push({ ...e, _path: req.url, _test: j.test_event_code })); } catch (_) {}
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"events_received":1}'); });
}).listen(3911);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 6000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = fn(); if (v) return v; await wait(150); } return null; };

async function login(page, base) {
  await page.goto(base + '/admin/login'); await page.fill('#username', process.env.GVE_ADMIN_USER || 'owner'); await page.fill('#password', process.env.GVE_ADMIN_PASS || 'SuperSecret123');
  await page.click('button:has-text("Sign in")'); await page.waitForURL('**/admin');
}
async function setTracking(page, base, on) {
  await page.goto(base + '/admin/tracking');
  if (on) { await page.check('input[name=meta_on]'); await page.fill('#mPixel', PIXEL); await page.fill('#mToken', TOKEN); await page.fill('#mTest', 'TEST123'); }
  else { await page.uncheck('input[name=meta_on]'); await page.fill('#mPixel', ''); if (await page.locator('input[name=meta_token_clear]').count()) await page.check('input[name=meta_token_clear]'); await page.fill('#mTest', ''); }
  await page.click('button:has-text("Save tracking settings")'); await page.waitForURL('**saved=1**');
}

(async () => {
  const b = await chromium.launch();
  const admin = await (await b.newContext()).newPage();
  try {
    await login(admin, URL);
    await setTracking(admin, URL, true);
    const html = await admin.content();
    expect(!html.includes(TOKEN) && html.includes('…' + TOKEN.slice(-4)), 'admin page never shows the access token in full (only its last 4 characters)');

    // --- visitor: the pixel script is replaced by a recorder; Meta's network is never touched ---
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route('https://connect.facebook.net/**', (r) => r.fulfill({ contentType: 'application/javascript',
      // like Meta's fbevents.js: attaches callMethod to the existing fbq and replays its queue
      body: '(function(){var f=window.fbq;f.callMethod=function(){window.__rec([].slice.call(arguments));};(f.queue||[]).forEach(function(a){f.callMethod.apply(null,a);});f.queue=[];})();' }));
    const calls = [];                                   // every pixel call, kept across page navigations
    await ctx.exposeBinding('__rec', (_src, a) => { calls.push(a); });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const resp = await p.goto(URL + '/?form=quick&fbclid=TESTCLICK');
    const csp = resp.headers()['content-security-policy'] || '';
    expect(/script-src[^;]*https:\/\/connect\.facebook\.net/.test(csp) && !/script-src[^;]*'unsafe-inline'/.test(csp), 'CSP allows Meta\'s script host only, still no inline scripts');
    expect(await p.getAttribute('meta[name="gve-pixel"]', 'content') === PIXEL, 'page carries the pixel id');
    await p.waitForTimeout(1200);
    const fb = async () => calls;
    expect((await fb()).some((c) => c[0] === 'init' && c[1] === PIXEL) && (await fb()).some((c) => c[1] === 'PageView'), 'pixel: init + PageView');
    await p.click('.qf-venue[data-venue="dream_dhaka"]'); await p.waitForTimeout(800);
    expect((await fb()).some((c) => c[1] === 'ViewContent' && c[2].content_ids[0] === 'dream_dhaka'), 'pixel: ViewContent when a venue is picked');
    const email = 'trk' + Date.now() + '@example.com';
    await p.fill('#qfEmail', email); await p.locator('#qfEmail').blur();
    const bLead = await until(async () => null) || (await (async () => { for (let i = 0; i < 30; i++) { const x = (await fb()).find((c) => c[1] === 'Lead'); if (x) return x; await wait(200); } })());
    const sLead = await until(() => server.find((e) => e.event_name === 'Lead' && e.user_data.em && e.user_data.em[0] === sha(email)));
    expect(bLead && sLead && bLead[3] && bLead[3].eventID === sLead.event_id, 'Lead: browser and server share one event id (Meta counts it once)', JSON.stringify([bLead && bLead[3], sLead && sLead.event_id]));
    expect(sLead && sLead._test === 'TEST123' && /\/123456789012345\/events\?access_token=/.test(sLead._path), 'server sends to the pixel with the test code while it is set');
    expect(sLead && sLead.user_data.fbc && /TESTCLICK/.test(sLead.user_data.fbc) && sLead.user_data.client_user_agent && !JSON.stringify(sLead).includes(email), 'server event: click id kept, user agent sent, email only hashed');
    await p.click('#qfSubmit'); await p.waitForURL('**/payment/mock**');
    const bIC = (await fb()).find((c) => c[1] === 'InitiateCheckout');
    const sIC = await until(() => server.find((e) => e.event_name === 'InitiateCheckout' && e.custom_data && e.custom_data.content_ids[0] === 'dream_dhaka' && bIC && e.event_id === bIC[3].eventID));
    expect(bIC && sIC && sIC.custom_data.currency === 'BDT' && sIC.custom_data.value > 0, 'InitiateCheckout: same id in browser and server, value in BDT');
    await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**');
    const sP = await until(() => server.find((e) => e.event_name === 'Purchase' && e.user_data.em && e.user_data.em[0] === sha(email)));
    expect(sP && sP.custom_data.value === sIC.custom_data.value && /^purchase-\d+$/.test(sP.event_id), 'Purchase sent by the server after payment, with the paid amount', JSON.stringify(sP && sP.custom_data));
    expect(!(await fb()).some((c) => c[1] === 'Purchase'), 'the browser never sends Purchase');
    expect(!errs.length, 'no browser errors', errs.join(' | '));

    // --- funnel in Insights ---
    await admin.goto(URL + '/admin/insights?days=7&device=phone');
    const row = (await admin.locator('section[aria-labelledby="sfT"] tbody tr', { hasText: 'Express' }).textContent()).replace(/\s+/g, ' ');
    const nums = (row.match(/\d+/g) || []).map(Number);
    expect(nums.length >= 5 && nums.slice(0, 5).every((n) => n >= 1), 'Insights: the Express funnel on phones counts view, venue, email, pay and paid', row);

    // --- tracking off: no pixel at all ---
    await setTracking(admin, URL, false);
    await p.goto(URL + '/?form=quick');
    expect(!(await p.locator('meta[name="gve-pixel"]').count()), 'tracking off: no pixel on the page');
    await ctx.close();
  } catch (e) { fail(e.message.split('\n')[0]); }

  // --- booking limit + staff exemption + Meta down (second server) ---
  if (LIMIT_URL) {
    try {
      const a2 = await (await b.newContext()).newPage(); await login(a2, LIMIT_URL); await setTracking(a2, LIMIT_URL, true);
      const v = await (await b.newContext()).newPage(); await v.goto(LIMIT_URL + '/?form=quick');
      const csrf = await v.getAttribute('#quickForm input[name="csrf"]', 'value');
      const book = (page, c) => page.request.post(LIMIT_URL + '/api/book', { data: { csrf: c, form: 'quick', pass: 'dream_dhaka', qty: 1, email: 'lim' + Date.now() + Math.random().toString(36).slice(2, 6) + '@example.com' },
        headers: { Origin: new (require('url').URL)(LIMIT_URL).origin, Accept: 'application/json' } });
      const t0 = Date.now(); const s1 = (await book(v, csrf)).status(), s2 = (await book(v, csrf)).status(), s3 = (await book(v, csrf)).status();
      expect(s1 === 200 && s2 === 200 && s3 === 429, `BOOKING_LIMIT=2: third booking from one address refused (${s1}, ${s2}, ${s3})`);
      expect(Date.now() - t0 < 8000, 'with Meta unreachable, bookings still answer quickly');
      await a2.goto(LIMIT_URL + '/?form=quick'); const c2 = await a2.getAttribute('#quickForm input[name="csrf"]', 'value');
      const s4 = (await book(a2, c2)).status();
      expect(s4 === 200, 'signed-in staff are not limited (walk-in bookings)', s4);
      await setTracking(a2, LIMIT_URL, false);
    } catch (e) { fail('limit: ' + e.message.split('\n')[0]); }
  }
  fake.close(); await b.close(); process.exit(fails ? 1 : 0);
})();
