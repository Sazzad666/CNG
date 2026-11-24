// Phase 5: promo codes (server-side price, better of code/offer, caps, dates, passes), "কোড আছে?" on the forms, ?code= links,
// group price, retry re-check, recovery step 3 personal code, referral, broadcast, staff assignment, Sources.
// Usage: DB_NAME=gve_test GVE_URL=http://127.0.0.1:3100/expo node .claude/skills/run-gip-expo/checks-promo.cjs
// (server: PAYMENT_MODE=mock, MAIL_DEBUG=1, same DB). Saves and restores the Promo codes switches.
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
process.env.BASE_URL = URL; process.env.MAIL_DEBUG = '1'; process.env.MAIL_PER_MINUTE = '100000'; process.env.MAIL_PER_DAY = '1000000';
const path = require('path'); const ROOT = path.resolve(__dirname, '../../..'); process.chdir(ROOT);
const { pool } = require(ROOT + '/src/db');
const settings = require(ROOT + '/src/settings');
const rec = require(ROOT + '/src/recovery');
const Q = require(ROOT + '/src/mailqueue');
const { chromium, devices } = require('playwright');
const SHOTS = process.env.GVE_SHOTS || '/tmp/gve-shots';
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
const expect = (c, m, x) => (c ? ok(m) : fail(m + (x !== undefined ? ' :: ' + String(x).slice(0, 220) : '')));
const quiet = (fn) => async (...a) => { const l = console.log; console.log = () => {}; try { return await fn(...a); } finally { console.log = l; } };
const ORIGIN = new (require('url').URL)(URL).origin;
const lead = async (email) => (await pool.query('SELECT * FROM leads WHERE email = ? ORDER BY id DESC LIMIT 1', [email]))[0][0];
const bnNum = (t) => Number(String(t).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/[^0-9]/g, ''));

(async () => {
  require('fs').mkdirSync(SHOTS, { recursive: true });
  const [saved] = await pool.query("SELECT k, v FROM settings WHERE k IN ('promo_on','group_min','group_off','referral_on','referral_off','referral_reward','rec_3_off','rec_3_hours')");
  const b = await chromium.launch();
  const tag = String(Date.now()).slice(-6);
  const C = { fix: 'FIX' + tag, pct: 'PCT' + tag, cap: 'CAP' + tag, old: 'OLD' + tag, agent: 'AGT' + tag };
  const a = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  try {
    // ---- admin: switches and codes ----
    await a.goto(URL + '/admin/login'); await a.fill('#username', 'owner'); await a.fill('#password', 'SuperSecret123'); await a.click('button:has-text("Sign in")'); await a.waitForURL('**/admin');
    await a.goto(URL + '/admin/promos');
    await a.check('input[name="promo_on"]'); await a.fill('input[name="group_min"]', '3'); await a.fill('input[name="group_off"]', '100');
    await a.check('input[name="referral_on"]'); await a.fill('input[name="referral_off"]', '700'); await a.fill('input[name="referral_reward"]', '৩ জন বন্ধু বুক করলে একটা ফ্রি VIP সেশন');
    await a.fill('input[name="rec_3_off"]', '300'); await a.fill('input[name="rec_3_hours"]', '24');
    await a.click('button:has-text("Save switches")'); await a.waitForURL('**msg=**');
    ok('Promo codes switches saved (group price, referral, recovery discount)');
    const mk = async (code, kind, value, extra = {}) => {
      await a.goto(URL + '/admin/promos');
      await a.fill('input[name="code"]', code); await a.selectOption('select[name="kind"]', kind); await a.fill('input[name="value"]', String(value));
      if (extra.max) await a.fill('input[name="max_uses"]', String(extra.max));
      if (extra.source) await a.fill('input[name="source"]', extra.source);
      for (const k of extra.passes || []) await a.check(`input[name="passes"][value="${k}"]`);
      await a.check('input[name="active"]');
      await a.click('button:has-text("Create code")'); await a.waitForURL('**msg=**');
    };
    await mk(C.fix, 'fixed', 3500, { passes: ['gold'] });
    await mk(C.pct, 'percent', 70, { passes: ['dream_dhaka'] });
    await mk(C.cap, 'fixed', 700, { max: 1 });
    await mk(C.old, 'fixed', 100);
    await mk(C.agent, 'fixed', 0, { source: 'Agent: Test' });
    await pool.query("UPDATE promo_codes SET ends_at = NOW() - INTERVAL 1 DAY WHERE code = ?", [C.old]);
    expect((await a.textContent('main')).includes(C.agent), 'codes created from the admin form, listed with usage');
    await a.goto(URL + '/admin/promos'); await a.fill('input[name="code"]', C.fix); await a.fill('input[name="value"]', '5'); await a.click('button:has-text("Create code")');
    expect(/already exists/.test(await a.textContent('main')), 'duplicate code refused');

    // ---- server price ----
    const p = await (await b.newContext()).newPage();
    await p.goto(URL + '/?form=quick'); const csrf = await p.getAttribute('#quickForm input[name="csrf"]', 'value');
    const api = (u, data, pg = p, tok = csrf) => pg.request.post(URL + u, { data: { csrf: tok, ...data }, headers: { Origin: ORIGIN, Accept: 'application/json' } });
    const book = async (d, pg, tok) => { const r = await api('/api/book', { form: 'quick', qty: 1, ...d }, pg, tok); return { status: r.status(), j: await r.json() }; };
    let r = await (await api('/api/promo', { code: 'NOSUCH' + tag })).json();
    expect(!r.ok && /মিলছে না/.test(r.message), 'unknown code: plain Bengali reason', r.message);
    r = await (await api('/api/promo', { code: C.pct, pass: 'gold' })).json();
    expect(!r.ok && /শুধু/.test(r.message), 'code for another venue: says which venue it is for', r.message);
    r = await (await api('/api/promo', { code: C.old })).json();
    expect(!r.ok && /মেয়াদ শেষ/.test(r.message), 'expired code: "মেয়াদ শেষ"', r.message);
    r = await (await api('/api/promo', { code: C.fix.toLowerCase(), pass: 'gold' })).json();
    expect(r.ok && r.rule.code === C.fix && r.rule.value === 3500, 'valid code (any letter case) returns its rule');

    const e1 = `pa${tag}@example.com`;
    let o = await book({ pass: 'gold', email: e1, code: C.fix, amount: 1, unit_price: 1, price: 1 });
    let l = await lead(e1);
    // this browser has the timed offer (gold 1999); the code's price 5000 − 3500 = 1500 is lower, so it wins
    expect(o.j.ok && l.amount === 1500 && l.promo_code === C.fix && l.promo_discount === 499, 'code cheaper than the offer: 5000 − 3500 = 1500 (price fields sent by the browser ignored)', JSON.stringify([l && l.amount, l && l.promo_discount]));
    // offer claimed (the single-venue page claims it): the offer is cheaper, so it wins and the code adds nothing
    const po = await (await b.newContext()).newPage(); await po.goto(URL + '/events?venue=gold');
    const csrfO = await po.getAttribute('#eventForm input[name="csrf"]', 'value');
    const e2 = `pb${tag}@example.com`;
    o = await book({ form: 'event', full_name: 'Promo Test', pass: 'gold', email: e2, code: C.agent }, po, csrfO); l = await lead(e2);
    expect(o.j.ok && l.amount === 1999 && l.promo_discount === 0 && l.promo_code === C.agent, 'offer 1999 beats an agent code worth 0: the lower price, never both (code still recorded for the agent)', l && l.amount);
    const e3 = `pc${tag}@example.com`;
    o = await book({ form: 'event', full_name: 'Promo Test', pass: 'dream_dhaka', email: e3, code: C.pct }, po, csrfO); l = await lead(e3);
    expect(l.amount === 450 && l.promo_discount === 150, 'percent code beats the offer: 1500 − 70% = 450 (offer 600)', l && l.amount);
    const e4 = `pd${tag}@example.com`;
    o = await book({ pass: 'dream_sylhet', email: e4, qty: 3 }); l = await lead(e4);
    expect(l.amount === 1197, 'group price on top of the offer: 3 tickets → 100 less each (499 − 100) × 3 = 1197', l && l.amount);
    o = await book({ pass: 'dream_sylhet', email: `pe${tag}@example.com`, code: C.cap });
    expect(o.j.ok, 'capped code: first use accepted');
    o = await book({ pass: 'dream_sylhet', email: `pf${tag}@example.com`, code: C.cap });
    expect(o.status === 422 && /সব সুযোগ/.test(o.j.errors && o.j.errors.code), 'capped code: second booking refused with the reason on the code field', JSON.stringify(o.j));
    o = await book({ pass: 'dream_sylhet', email: `pg${tag}@example.com`, code: C.old });
    expect(o.status === 422 && o.j.errors && o.j.errors.code, 'expired code refused at booking too');

    // ---- forms: link code, apply, remove, price shown = price charged ----
    const m = await (await b.newContext({ ...devices['Pixel 5'] })).newPage();
    const errs = []; m.on('pageerror', (e) => errs.push(e.message));
    await m.goto(URL + `/?form=quick&code=${C.fix}`);
    await m.waitForSelector('#quickForm [data-promo-chip]:not([hidden])');
    expect(/লিংকের কোড/.test(await m.textContent('#quickForm [data-promo-msg]')), 'link with ?code= applies itself and says so');
    await m.locator('#quickForm label:has(input[name="pass"][value="gold"])').first().click();
    const ef = `ph${tag}@example.com`;
    await m.fill('#quickForm input[name="email"]', ef);
    await m.waitForTimeout(1800);   // let the price animation finish
    const shown = bnNum(await m.textContent('#quickForm [data-qf-total]'));
    await m.screenshot({ path: SHOTS + '/promo-quick.png', fullPage: false });
    await m.locator('#quickForm button[type="submit"]').first().click();
    await m.waitForURL('**/payment/mock**');
    l = await lead(ef);
    expect(shown === l.amount && l.promo_code === C.fix, 'Express form: the total shown with the code is exactly what the server charges', `${shown} vs ${l && l.amount}`);
    // 2-step: open the field, wrong code, right code, remove
    const s2 = await (await b.newContext({ ...devices['Pixel 5'] })).newPage();
    s2.on('pageerror', (e) => errs.push(e.message));
    await s2.goto(URL + '/?v=pro');
    const box = s2.locator('#bookForm [data-promo]');
    expect(await box.count() === 1 && await box.locator('[data-promo-box]').isHidden(), '2-step form: "কোড আছে?" link, field closed until tapped');
    await s2.evaluate(() => { const e = document.querySelector('#bookForm [data-promo-open]'); e.closest('.hidden') && e.closest('.hidden').classList.remove('hidden'); });
    await box.locator('[data-promo-open]').evaluate((e) => e.click());
    await box.locator('[data-promo-input]').fill('WRONG' + tag); await box.locator('[data-promo-apply]').evaluate((e) => e.click());
    await s2.waitForFunction(() => /মিলছে না/.test(document.querySelector('#bookForm [data-promo-msg]').textContent));
    ok('wrong code: reason shown next to the field');
    await box.locator('[data-promo-input]').fill(C.agent); await box.locator('[data-promo-apply]').evaluate((e) => e.click());
    await s2.waitForSelector('#bookForm [data-promo-chip]:not([hidden])');
    expect((await box.locator('[data-promo-code]').textContent()) === C.agent, 'right code: removable chip with the code');
    await box.locator('[data-promo-remove]').evaluate((e) => e.click());
    expect(await box.locator('[data-promo-chip]').isHidden() && /সরানো/.test(await box.locator('[data-promo-msg]').textContent()), 'remove: chip goes, says so');
    // event page: price rolls to the code price
    const ev = await (await b.newContext({ ...devices['Pixel 5'] })).newPage();
    ev.on('pageerror', (e) => errs.push(e.message));
    await ev.goto(URL + '/events?venue=DHAKA');
    const before = bnNum(await ev.textContent('[data-ev-total]'));
    await ev.locator('#eventForm [data-promo-open]').click();
    await ev.fill('#eventForm [data-promo-input]', C.pct); await ev.click('#eventForm [data-promo-apply]');
    await ev.waitForSelector('#eventForm [data-promo-chip]:not([hidden])'); await ev.waitForTimeout(1200);
    const after = bnNum(await ev.textContent('[data-ev-total]'));
    expect(before === 600 && after === 450, 'single-venue page: total moves from the offer price to the code price', `${before} → ${after}`);
    await ev.screenshot({ path: SHOTS + '/promo-event.png', fullPage: false });
    // group hint and no-JS form field
    expect(/৩ জন বা বেশি হলে জন প্রতি আরও/.test(await ev.textContent('body')), 'group price shown on the people selector');
    const nj = await (await b.newContext({ javaScriptEnabled: false })).newPage();
    await nj.goto(URL + '/'); expect(await nj.locator('.nojs-form input[name="code"]').count() === 1, 'no-JavaScript form has a code field');
    expect(!errs.length, 'no browser errors on the forms', errs.join(' | '));

    // ---- retry re-checks the code ----
    await pool.query('UPDATE promo_codes SET active = 0 WHERE code = ?', [C.fix]);
    const le1 = await lead(e1);
    const t = require(ROOT + '/src/paylink').make(le1.id);
    await p.goto(URL + '/payment/retry?t=' + encodeURIComponent(t) + '&r=email');
    const rt = await p.textContent('main');
    expect(/আর চলছে না/.test(rt) && /৳১,৯৯৯/.test(rt), 'payment link after the code was turned off: says so, shows the price without it (offer 1999)', rt.replace(/\s+/g, ' ').slice(0, 200));
    await pool.query('UPDATE promo_codes SET active = 1 WHERE code = ?', [C.fix]);

    // ---- recovery step 3: personal one-time code ----
    await settings.load();
    const e5 = `pi${tag}@example.com`;
    await book({ pass: 'dream_dhaka', email: e5, qty: 2 }); // offer: 600 × 2
    await pool.query('UPDATE leads SET created_at = NOW() - INTERVAL 25 HOUR, recovery_step = 2 WHERE email = ?', [e5]);
    await quiet(rec.run)(); await quiet(Q.tick)();
    l = await lead(e5);
    const [[m3]] = await pool.query("SELECT * FROM mail_queue WHERE to_email = ? AND kind = 'rec3'", [e5]);
    const [[pc]] = await pool.query('SELECT * FROM promo_codes WHERE email = ?', [e5]);
    expect(m3 && pc && l.promo_code === pc.code && l.amount === 600 && m3.subject.includes('৬০০'), 'after 24 h: email 3 with a personal code, 300 less each (1200 → 600), saying when it ends', JSON.stringify([l.amount, m3 && m3.subject]));
    expect(pc.max_uses === 1 && pc.email === e5 && pc.ends_at, 'personal code: one address, one use, an end time');
    r = await (await api('/api/promo', { code: pc.code, email: 'someone' + tag + '@example.com' })).json();
    expect(!r.ok, 'someone else cannot use the personal code');

    // ---- referral ----
    const e6 = `pj${tag}@example.com`;
    o = await book({ pass: 'dream_sylhet', email: e6 });
    await p.goto(new (require('url').URL)(o.j.redirect, URL).href); await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**');
    const tk = await p.textContent('main');
    const ref = (tk.match(/কোড\s*(R[A-Z0-9]{5})/) || [])[1];
    expect(/বন্ধুকে আনুন/.test(tk) && ref && /ফ্রি VIP সেশন/.test(tk), 'ticket page: "বন্ধুকে আনুন" with the buyer\'s code and the reward rule', ref);
    await p.screenshot({ path: SHOTS + '/promo-referral.png', fullPage: true });
    o = await book({ pass: 'dream_sylhet', email: e6, code: ref });
    expect(o.status === 422 || (o.j && o.j.already), 'own referral code cannot be used by its owner');
    const e7 = `pk${tag}@example.com`;
    o = await book({ pass: 'dream_sylhet', email: e7, code: ref }); l = await lead(e7);
    expect(l.amount === 300 && l.promo_code === ref, 'friend with the code: 1000 − 700 = 300 (cheaper than the offer 499)', l && l.amount);
    await quiet(Q.tick)();
    const [[tm]] = await pool.query("SELECT body_text FROM mail_queue WHERE to_email = ? AND kind = 'ticket' ORDER BY id DESC LIMIT 1", [e6]);
    expect(tm && tm.body_text.includes(ref), 'ticket email carries the referral code and link');

    // ---- broadcast ----
    await pool.query('INSERT IGNORE INTO mail_unsub (email, at) VALUES (?, NOW())', [e3]);
    await a.goto(URL + '/admin/broadcast');
    await a.check('input[name="seg"][value="unpaid"]');
    await a.fill('input[name="subject"]', 'টেস্ট ব্রডকাস্ট ' + tag); await a.fill('input[name="title"]', 'এক্সপোর খবর'); await a.fill('textarea[name="body"]', 'প্রথম প্যারা।\n\nদ্বিতীয় প্যারা।');
    await a.click('button[value="preview"]');
    const n = Number(await a.getAttribute('input[name="count"]', 'value'));
    expect(n > 0 && await a.locator('iframe[title="Email preview"]').count() === 1, 'broadcast: preview, then a confirm step with the number of people', n);
    await a.screenshot({ path: SHOTS + '/promo-broadcast.png', fullPage: true });
    await a.click('button[value="send"]'); await a.waitForURL('**msg=**');
    const [[bc]] = await pool.query("SELECT COUNT(*) n, SUM(to_email = ?) unsub FROM mail_queue WHERE kind = 'bcast' AND subject = ?", [e3, 'টেস্ট ব্রডকাস্ট ' + tag]);
    expect(Number(bc.n) === n && !Number(bc.unsub), 'broadcast queued for exactly that many, an unsubscribed address left out', JSON.stringify(bc));

    // ---- staff assignment ----
    await a.goto(URL + '/admin/unpaid');
    const row = a.locator('tbody tr', { hasText: e5 });
    const [[me]] = await pool.query("SELECT id FROM admins WHERE username = 'owner'");
    await row.locator('select[name="to"]').selectOption(String(me.id)); await row.locator('button:has-text("Set")').click(); await a.waitForURL('**/admin/unpaid**');
    expect((await lead(e5)).assigned_to === me.id && /Staff today/.test(await a.textContent('main')), 'unpaid lead gets an owner; "Staff today" counts per person');
    await a.goto(URL + '/admin/sources?days=7');
    const st = await a.textContent('main');
    expect(st.includes(C.fix) && /By email step/.test(st), 'Sources: by source, campaign, promo code and email step');
    await a.goto(URL + '/admin/promos');
    expect((await a.textContent('main')).includes('Referrals'), 'Promo codes page: usage, revenue, referrals');
    await a.screenshot({ path: SHOTS + '/promo-admin.png', fullPage: true });
  } catch (e) { fail(e.message.split('\n')[0]); }
  // restore the switches through the admin form, so the server picks them up at once
  try {
    const v = { ...settings.DEFAULTS, ...Object.fromEntries(saved.map((s) => [s.k, s.v])) };
    await a.goto(URL + '/admin/promos');
    await a.setChecked('input[name="promo_on"]', String(v.promo_on) === '1'); await a.setChecked('input[name="referral_on"]', String(v.referral_on) === '1');
    for (const k of ['group_min', 'group_off', 'referral_off', 'referral_reward', 'rec_3_off', 'rec_3_hours']) await a.fill(`input[name="${k}"]`, String(v[k]));
    await a.click('button:has-text("Save switches")'); await a.waitForURL('**msg=**');
  } catch (e) { fail('restoring the switches: ' + e.message.split('\n')[0]); }
  await b.close(); await pool.end(); process.exit(fails ? 1 : 0);
})();
