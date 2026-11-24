// Lead center: create one of each kind of lead through the public API, then check the admin list classifies them.
// Usage: GVE_URL=http://127.0.0.1:3100/expo node .claude/skills/run-gip-expo/checks-leadcenter.cjs   (server in PAYMENT_MODE=mock)
const { chromium } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
const tag = String(Date.now()).slice(-6);
const ph = (n) => '01' + (6 + n) + tag + n + '0';           // unique, valid 11-digit BD mobile numbers
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(); const p = await ctx.newPage();
  try {
    await p.goto(URL + '/?v=pro');
    const csrf = await p.getAttribute('#bookForm input[name="csrf"]', 'value');
    const api = (path, data) => p.request.post(URL + path, { data: { csrf, ...data }, headers: { Origin: new (require('url').URL)(URL).origin, Accept: 'application/json' } }).then((r) => r.json());
    // 1) step-1 contact only (email), never books
    const email = `contact${tag}@example.com`;
    (await api('/api/lead', { email, pass: 'gold', qty: 2 })).ok ? ok('step-1 contact saved') : fail('step-1 contact');
    // 2) call-back request, never books
    const cb = ph(1);
    (await api('/api/callback', { phone: cb, source: 'landing' })).ok ? ok('call-back saved') : fail('call-back');
    // 3) booking abandoned at the payment page
    const ab = ph(2);
    const r3 = await api('/api/book', { form: 'quick', pass: 'dream_dhaka', qty: 1, phone: ab, email: `ab${tag}@example.com` });
    r3.ok && /payment\/mock/.test(r3.redirect) ? ok('booking started, payment not finished') : fail('abandoned booking: ' + JSON.stringify(r3));
    // 4) asked for a call-back, then booked and paid
    const both = ph(3);
    await api('/api/callback', { phone: both, source: 'exit' });
    const r4 = await api('/api/book', { form: 'one', full_name: 'Karim Both', pass: 'dream_sylhet', qty: 1, phone: both, email: `both${tag}@example.com` });
    await p.goto(new (require('url').URL)(r4.redirect, URL).href); await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**');
    ok('call-back person then paid');

    // admin
    await p.goto(URL + '/admin/login'); await p.fill('#username', process.env.GVE_ADMIN_USER || 'owner'); await p.fill('#password', process.env.GVE_ADMIN_PASS || 'SuperSecret123');
    await p.click('button:has-text("Sign in")'); await p.waitForURL(URL + '/admin');
    const rowOf = async (q) => { await p.goto(URL + '/admin/all?q=' + encodeURIComponent(q)); return (await p.textContent('tbody')).replace(/\s+/g, ' '); };
    (await rowOf(email)).includes('Contact only') ? ok('contact listed as "Contact only"') : fail('contact row');
    (await rowOf(cb.slice(1))).includes('Wants a call-back') ? ok('call-back listed as "Wants a call-back"') : fail('call-back row');
    (await rowOf(ab.slice(1))).includes('Payment not finished') ? ok('abandoned booking listed as "Payment not finished"') : fail('abandoned row');
    const t4 = await rowOf(both.slice(1));
    t4.includes('Paid') && t4.includes('also asked for a call') && !t4.includes('Wants a call-back') ? ok('paid person who asked for a call appears once, as the booking') : fail('merged row: ' + t4.slice(0, 200));
    await p.goto(URL + '/admin/all?show=callback&q=' + cb.slice(1)); await p.click('button:has-text("Mark called")'); await p.waitForURL('**/admin/all**');
    (await rowOf(cb.slice(1))).includes('Called') ? ok('"Mark called" from the Lead center works and returns to it') : fail('mark called');
    const csv = await (await p.request.get(URL + '/admin/all.csv')).text();
    csv.includes(email) && csv.includes(both) ? ok('CSV has every kind of lead') : fail('CSV incomplete');
    const counts = await p.evaluate(() => [...document.querySelectorAll('main a.rounded-2xl p.text-2xl')].map((e) => +e.textContent));
    counts[0] === counts.slice(1).reduce((a, x) => a + x, 0) ? ok('tab counts add up (' + counts.join(' / ') + ')') : fail('counts: ' + counts.join(' / '));
  } catch (e) { fail(e.message); }
  await b.close(); process.exit(fails ? 1 : 0);
})();
