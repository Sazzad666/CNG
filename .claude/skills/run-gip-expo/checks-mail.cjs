// Phase 4: email queue, recovery sequence, tracking links, unsubscribe, bounces, pre-expo emails, admin pages.
// Runs the scheduler and the queue IN THIS PROCESS (with a moved clock) against the same database as the server,
// and checks the links over HTTP against the server.
// Usage: GVE_URL=http://127.0.0.1:3100/expo node .claude/skills/run-gip-expo/checks-mail.cjs   (server: PAYMENT_MODE=mock, MAIL_DEBUG=1, DB from .env)
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
process.env.BASE_URL = URL; process.env.MAIL_DEBUG = '1'; process.env.MAIL_PER_MINUTE = '100000'; process.env.MAIL_PER_DAY = '1000000';
const path = require('path'); const ROOT = path.resolve(__dirname, '../../..'); process.chdir(ROOT);
const { pool } = require(ROOT + '/src/db');
const settings = require(ROOT + '/src/settings');
const Q = require(ROOT + '/src/mailqueue');
const rec = require(ROOT + '/src/recovery');
const mailer = require(ROOT + '/src/mailer');
const { chromium } = require('playwright');
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
const expect = (c, m, x) => (c ? ok(m) : fail(m + (x ? ' :: ' + String(x).slice(0, 220) : '')));
const quiet = (fn) => async (...a) => { const l = console.log; console.log = () => {}; try { return await fn(...a); } finally { console.log = l; } };
const run = quiet(rec.run), tick = quiet(Q.tick);
const rows = async (email) => (await pool.query('SELECT * FROM mail_queue WHERE to_email = ? ORDER BY id', [email]))[0];
const ORIGIN = new (require('url').URL)(URL).origin;

(async () => {
  await settings.load();
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const tag = String(Date.now()).slice(-7);
  try {
    await p.goto(URL + '/?form=quick'); const csrf = await p.getAttribute('#quickForm input[name="csrf"]', 'value');
    const api = (u, data) => p.request.post(URL + u, { data: { csrf, ...data }, headers: { Origin: ORIGIN, Accept: 'application/json' } });
    // ---- recovery for an unpaid booking ----
    const A = `mailA${tag}@example.com`;
    expect((await api('/api/book', { form: 'quick', pass: 'dream_dhaka', qty: 2, email: A })).ok(), 'booking started (left unpaid)');
    await tick();
    expect((await rows(A)).some((m) => m.kind === 'registered' && m.status === 'sent'), '"registration received" goes out through the queue');
    await pool.query("UPDATE leads SET created_at = NOW() - INTERVAL 20 MINUTE WHERE email = ?", [A]);
    await run(); await tick();
    let r1 = (await rows(A)).find((m) => m.kind === 'rec1');
    expect(r1 && r1.status === 'sent' && r1.promo === 1, 'after 15 min: recovery 1 "আপনার সিট ধরে রাখা আছে" sent');
    const h = JSON.parse(r1.headers || '{}');
    expect(/\/u\//.test(h['List-Unsubscribe'] || '') && h['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click' && /আনসাবস্ক্রাইব/.test(r1.body_html), 'promotional mail: one-click unsubscribe header + footer link');
    expect(/payment%2Fretry|payment\/retry/.test(r1.body_html) && /\/m\/c\//.test(r1.body_html) && /\/m\/o\/[a-f0-9]{16}\.gif/.test(r1.body_html) && r1.body_text.includes('পে করুন'), 'one-tap payment link (counted click), open image, plain-text part');
    await run(); expect((await rows(A)).filter((m) => m.kind === 'rec1').length === 1, 'a step is never repeated');
    await pool.query("UPDATE leads SET created_at = NOW() - INTERVAL 4 HOUR WHERE email = ?", [A]);
    await run(); await tick(); await run(); await tick();
    expect((await rows(A)).filter((m) => /^rec/.test(m.kind)).map((m) => m.kind).join() === 'rec1,rec2', 'after 3 h: recovery 2, then nothing more (step 3 waits for promo codes)');
    // ---- click + open counting, signed links only ----
    const click = r1.body_html.match(/href="([^"]*\/m\/c\/[^"]+)"/)[1].replace(/&amp;/g, '&');
    const cr = await p.request.get(click, { maxRedirects: 0 });
    expect(cr.status() === 302 && /payment\/retry/.test(cr.headers().location), 'click link redirects to the payment page');
    const bad = await p.request.get(click.replace(/s=[^&]+/, 's=forged'), { maxRedirects: 0 });
    expect(bad.status() === 302 && !/payment/.test(bad.headers().location), 'a forged click link goes to the home page (no open redirect)');
    await p.request.get(r1.body_html.match(/src="([^"]*\/m\/o\/[^"]+)"/)[1]);
    const [[t1]] = await pool.query('SELECT opened_at, clicked_at FROM mail_queue WHERE id = ?', [r1.id]);
    expect(t1.opened_at && t1.clicked_at, 'open and click recorded');
    // ---- pay: queued recovery mail is dropped ----
    await pool.query("INSERT INTO mail_queue (mid, to_email, kind, priority, promo, subject, body_text, next_at) VALUES (?, ?, 'rec2', 5, 1, 'x', 'x', NOW())", [require('crypto').randomBytes(8).toString('hex'), A]);
    await p.goto(cr.headers().location.startsWith('http') ? cr.headers().location : ORIGIN + cr.headers().location);
    await p.click('button:has-text("পে করুন") >> nth=0'); await p.waitForURL('**/payment/mock**'); await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**');
    await tick();
    expect((await rows(A)).some((m) => m.kind === 'ticket' && m.status === 'sent') && (await rows(A)).some((m) => m.kind === 'rec2' && m.status === 'skipped' && m.last_error === 'paid'), 'after paying: e-ticket sent, a waiting recovery email is dropped');
    // ---- pre-expo emails (clock moved to 2 days before the venue opens) ----
    const start = Date.parse(require(ROOT + '/config/site').passes.dream_dhaka.startsAt), realNow = Date.now;
    Date.now = () => start - 48 * 3600e3; await run(); Date.now = () => start - 2 * 3600e3; await run(); Date.now = realNow; await tick();
    const pre = (await rows(A)).filter((m) => /^pre/.test(m.kind)).map((m) => m.kind + ':' + m.status).join();
    expect(pre === 'pre3:sent,pre0:sent', '3 days before and on the morning: reminders with the ticket link', pre);
    // ---- unsubscribe (one click) ----
    const B = `mailB${tag}@example.com`;
    await api('/api/lead', { email: B, pass: 'gold', form: 'quick' });
    await pool.query('UPDATE subscribers SET created_at = NOW() - INTERVAL 3 HOUR WHERE email = ?', [B]);
    await run(); await tick();
    const c1 = (await rows(B)).find((m) => m.kind === 'contact1');
    expect(c1 && c1.status === 'sent', 'email given, no booking: gentle follow-up 1 after the set hours');
    const u = JSON.parse(c1.headers)['List-Unsubscribe'].slice(1, -1);
    const ur = await p.request.post(u, { data: 'List-Unsubscribe=One-Click', headers: { 'Content-Type': 'text/plain' } });
    expect(ur.ok(), 'one-click unsubscribe accepted');
    expect(await mailer.contactFollowUp(2, { email: B, pass: 'gold' }) === null, 'unsubscribed: no more promotional mail');
    await tick(); const tB = await mailer.paymentLink({ id: 1, email: B, full_name: 'B', pass: 'gold', qty: 1, amount: 1999 }, URL + '/');
    expect(!!tB, 'unsubscribed: transactional mail (payment link) still goes');
    // ---- hard bounce ----
    const C = `mailC${tag}@example.com`;
    Q._setTransport({ sendMail: async () => { const e = new Error('550 5.1.1 User unknown'); e.responseCode = 550; throw e; } });
    await mailer.test(C); await tick();
    Q._setTransport({ sendMail: async () => {} });
    const [[bd]] = await pool.query('SELECT COUNT(*) n FROM mail_bad WHERE email = ?', [C]);
    expect(Number(bd.n) === 1 && (await rows(C))[0].status === 'bad', 'hard bounce: address marked bad');
    expect(await mailer.test(C) === null, 'bad address: nothing more is queued for it');
    // ---- admin pages ----
    const D = `mailD${tag}@example.com`;
    await api('/api/book', { form: 'quick', pass: 'dream_sylhet', qty: 1, email: D });
    const a = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await a.goto(URL + '/admin/login'); await a.fill('#username', 'owner'); await a.fill('#password', 'SuperSecret123'); await a.click('button:has-text("Sign in")'); await a.waitForURL('**/admin');
    await a.goto(URL + '/admin/unpaid');
    const tr = a.locator('tbody tr', { hasText: D });
    expect(await tr.count() === 1, 'Unpaid queue lists the unpaid booking');
    await tr.locator('button:has-text("Send payment link")').click(); await a.waitForURL('**msg=**');
    expect((await rows(D)).some((m) => m.kind === 'paylink'), 'staff "Send payment link" queues it');
    await a.locator('tbody tr', { hasText: D }).locator('button:has-text("Contacted")').click(); await a.waitForURL('**/admin/unpaid**');
    expect(!(await a.locator('tbody tr', { hasText: D }).count()), '"Contacted" moves it to the contacted list');
    await a.goto(URL + '/admin/mail');
    expect(/SPF/.test(await a.textContent('main')) && /Queue/.test(await a.textContent('main')), 'Email health page: DNS checks and queue');
    await a.click('button:has-text("Send me a test email")'); await a.waitForURL('**msg=**');
    ok('test email queued from Email health');
    await a.goto(URL + '/admin/insights?days=7');
    expect(/Which email brings money/.test(await a.textContent('main')) && /Recovery 1/.test(await a.textContent('main')), 'Insights: results per email (sent, opened, clicked, paid after clicking)');
    const id = (await pool.query('SELECT id FROM leads WHERE email = ? ORDER BY id DESC LIMIT 1', [A]))[0][0].id;
    await a.goto(URL + '/admin/leads/' + id);
    expect(/আপনার সিট ধরে রাখা আছে/.test(await a.textContent('main')), 'lead page: message log with each email and its status');
  } catch (e) { fail(e.message.split('\n')[0]); }
  await b.close(); await pool.end(); process.exit(fails ? 1 : 0);
})();
