// Payment failed / cancelled → retry page: booking kept, real seat hold, try again, email the link, pay.
// Usage: GVE_URL=http://127.0.0.1:3100/expo node .claude/skills/run-gip-expo/checks-retry.cjs   (PAYMENT_MODE=mock, MAIL_DEBUG=1)
const { chromium, devices } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const SHOTS = process.env.GVE_SHOTS || '/tmp/gve-shots';
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
const expect = (c, m, x) => (c ? ok(m) : fail(m + (x ? ' :: ' + String(x).slice(0, 200) : '')));
(async () => {
  require('fs').mkdirSync(SHOTS, { recursive: true });
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  try {
    await p.goto(URL + '/?form=quick');
    const csrf = await p.getAttribute('#quickForm input[name="csrf"]', 'value');
    const email = 'retry' + String(Date.now()).slice(-8) + '@example.com';
    const r = await (await p.request.post(URL + '/api/book', { data: { csrf, form: 'quick', pass: 'dream_dhaka', qty: 2, email },
      headers: { Origin: new (require('url').URL)(URL).origin, Accept: 'application/json' } })).json();
    await p.goto(new (require('url').URL)(r.redirect, URL).href);
    await p.click('text=Fail'); await p.waitForURL('**/payment/retry**');
    ok('failed payment opens the retry page');
    const txt = (await p.textContent('main')).replace(/\s+/g, ' ');
    expect(/পেমেন্টটা হয়নি/.test(txt) && /বুকিং রাখা আছে/.test(txt), 'calm message: payment did not go through, booking kept', txt);
    expect(/সিট আরও [০-৯]+ মিনিট ধরে রাখা আছে/.test(txt), 'real seat hold shown in minutes', txt);
    expect(txt.includes(email), 'shows where the e-ticket will go');
    expect(await p.locator('button:has-text("পে করুন")').count() >= 2 && await p.locator('text=পেমেন্ট লিংক ইমেইলে পাঠান').count() === 1,
      'three actions: try again, another method, email the link');
    await p.screenshot({ path: SHOTS + '/retry-1.png', fullPage: true });
    await p.click('text=পেমেন্ট লিংক ইমেইলে পাঠান'); await p.waitForURL('**mailed=1**');
    ok('payment link emailed (see the server log)');
    const t = new (require('url').URL)(p.url()).searchParams.get('t');
    // tampered link
    const bad = await p.request.get(URL + '/payment/retry?t=' + encodeURIComponent(t.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'))));
    expect(bad.status() === 410, 'an edited link is refused (410)', bad.status());
    // try again → pay
    await p.click('button:has-text("পে করুন") >> nth=0'); await p.waitForURL('**/payment/mock**');
    ok('try again goes straight to the payment page, nothing retyped');
    await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**');
    ok('paid on the second try: ticket ' + p.url().match(/ticket\/([A-Z0-9]{8})/)[1]);
    await p.goto(URL + '/payment/retry?t=' + encodeURIComponent(t)); await p.waitForURL('**/ticket/**');
    ok('the old link of a paid booking opens the ticket');
    // cancelled
    const r2 = await (await p.request.post(URL + '/api/book', { data: { csrf, form: 'quick', pass: 'dream_sylhet', qty: 1, email: 'c' + email },
      headers: { Origin: new (require('url').URL)(URL).origin, Accept: 'application/json' } })).json();
    await p.goto(new (require('url').URL)(r2.redirect, URL).href); await p.click('text=Cancel'); await p.waitForURL('**/payment/retry**');
    expect(/পেমেন্ট বাতিল হয়েছে/.test(await p.textContent('h1')), 'cancelled payment: its own calm heading');
    expect(!errs.length, 'no browser errors', errs.join(' | '));
  } catch (e) { fail(e.message.split('\n')[0]); }
  await b.close(); process.exit(fails ? 1 : 0);
})();
