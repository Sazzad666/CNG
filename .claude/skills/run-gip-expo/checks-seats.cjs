// Honest seats: Admin › Offer "seats on sale" and "registration closes" drive the public count, the one urgency line,
// and the server refuses bookings past them. Restores the settings at the end.
// Usage: GVE_URL=http://127.0.0.1:3100/expo node .claude/skills/run-gip-expo/checks-seats.cjs   (PAYMENT_MODE=mock)
const { chromium } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const ORIGIN = new (require('url').URL)(URL).origin;
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
const expect = (c, m, x) => (c ? ok(m) : fail(m + (x ? ' :: ' + String(x).slice(0, 200) : '')));
(async () => {
  const b = await chromium.launch();
  const a = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  let saved = null;
  const setSeats = async (onSale, close) => {
    await a.goto(URL + '/admin/offer');
    if (!saved) saved = { onSale: await a.inputValue('#sos-dream_sylhet'), close: await a.inputValue('#rc-dream_sylhet') };
    await a.fill('#sos-dream_sylhet', String(onSale)); await a.fill('#rc-dream_sylhet', close || '');
    await a.click('button:has-text("Save offer settings")'); await a.waitForURL('**saved=1**');
  };
  try {
    await a.goto(URL + '/admin/login'); await a.fill('#username', process.env.GVE_ADMIN_USER || 'owner'); await a.fill('#password', process.env.GVE_ADMIN_PASS || 'SuperSecret123');
    await a.click('button:has-text("Sign in")'); await a.waitForURL('**/admin');
    await a.goto(URL + '/admin/offer');
    const used = Number(await a.textContent('#sos-dream_sylhet >> xpath=ancestor::tr >> td:nth-child(2)'));
    ok('Admin › Offer shows seats sold + held for Sylhet: ' + used);
    // 3 seats left
    await setSeats(used + 3);
    await p.goto(URL + '/events?venue=SYLHET');
    expect(/মাত্র ৩টি সিট বাকি/.test(await p.textContent('.urg-form')), 'venue page: the one urgency line says "মাত্র ৩টি সিট বাকি" (real count)', await p.textContent('.urg-form'));
    await p.goto(URL + '/?form=quick');
    expect(/মাত্র ৩টি সিট বাকি/.test(await p.textContent('[data-venue="dream_sylhet"]')), 'landing: the Sylhet card shows the real count');
    const csrf = await p.getAttribute('#quickForm input[name="csrf"]', 'value');
    const book = (qty) => p.request.post(URL + '/api/book', { data: { csrf, form: 'quick', pass: 'dream_sylhet', qty, email: 'seat' + Date.now() + qty + '@example.com' }, headers: { Origin: ORIGIN, Accept: 'application/json' } });
    let r = await book(4);
    expect(r.status() === 409, 'a booking for 4 when 3 are on sale is refused (409)', r.status());
    // registration closed
    await setSeats(used + 50, '2020-01-01T10:00');
    r = await book(1);
    expect(r.status() === 409 && /রেজিস্ট্রেশন বন্ধ/.test((await r.json()).message), 'after the registration close time, bookings are refused');
    await p.goto(URL + '/?form=quick');
    expect(/রেজিস্ট্রেশন বন্ধ/.test(await p.textContent('[data-venue="dream_sylhet"]')), 'the venue card says registration is closed');
    // a close time in the future becomes the deadline when nothing more urgent applies
    const soon = new Date(Date.now() + 6 * 3600e3 + 6 * 3600e3).toISOString().slice(0, 16);   // ≈6 h ahead, written in Dhaka time
    await setSeats(used + 50, soon);
    await p.goto(URL + '/events?venue=SYLHET');
    const line = await p.textContent('.urg-form');
    expect(/ছাড়|রেজিস্ট্রেশন বন্ধ হবে/.test(line), 'urgency line shows the offer deadline or the registration close (priority order)', line);
  } catch (e) { fail(e.message.split('\n')[0]); }
  try { if (saved) { await a.goto(URL + '/admin/offer'); await a.fill('#sos-dream_sylhet', saved.onSale); await a.fill('#rc-dream_sylhet', saved.close); await a.click('button:has-text("Save offer settings")'); await a.waitForURL('**saved=1**'); ok('settings restored'); } }
  catch (e) { fail('restore: ' + e.message.split('\n')[0]); }
  await b.close(); process.exit(fails ? 1 : 0);
})();
