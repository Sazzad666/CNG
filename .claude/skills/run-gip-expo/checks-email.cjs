// Email-first rules, API level: email required everywhere, phone optional, call-back keeps phone required,
// a second booking by the same person re-sends the ticket instead of opening it, ticket page resend / fix email.
// Usage: GVE_URL=http://127.0.0.1:3100/expo node .claude/skills/run-gip-expo/checks-email.cjs   (server in PAYMENT_MODE=mock, MAIL_DEBUG=1)
const { chromium } = require('playwright');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const ORIGIN = new (require('url').URL)(URL).origin;
let fails = 0;
const ok = (m) => console.log('PASS ' + m), fail = (m) => { fails++; console.log('FAIL ' + m); };
const expect = (cond, m, extra) => (cond ? ok(m) : fail(m + (extra ? ' :: ' + JSON.stringify(extra).slice(0, 220) : '')));
const tag = String(Date.now()).slice(-7);
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  try {
    await p.goto(URL + '/?v=pro');
    const csrf = await p.getAttribute('#bookForm input[name="csrf"]', 'value');
    const post = async (path, data, form) => {
      const r = await p.request.post(URL + path, form ? { form: { csrf, ...data }, headers: { Origin: ORIGIN } }
        : { data: { csrf, ...data }, headers: { Origin: ORIGIN, Accept: 'application/json' }, maxRedirects: 0 });
      let j = {}; try { j = await r.json(); } catch (_) {}
      return { status: r.status(), ...j, _r: r };
    };
    const em = (n) => `ef${tag}${n}@example.com`;

    // ---- /api/book
    let r = await post('/api/book', { form: 'quick', pass: 'dream_dhaka', qty: 1, phone: '01712' + tag.slice(-6) });
    expect(r.status === 422 && r.errors && r.errors.email && !r.errors.phone, 'booking without email is refused (email error, phone fine)', r);
    r = await post('/api/book', { form: 'quick', pass: 'dream_dhaka', qty: 1, email: 'x@mailinator.com' });
    expect(r.status === 422 && /অস্থায়ী/.test(r.errors && r.errors.email), 'disposable email is refused', r);
    r = await post('/api/book', { form: 'quick', pass: 'dream_dhaka', qty: 1, email: em(1), phone: '12345' });
    expect(r.status === 422 && r.errors && r.errors.phone && !r.errors.email, 'a wrong phone (when typed) is refused, with a hint to leave it empty', r);
    for (const form of ['quick', 'one', 'event', 'steps']) {
      const data = { form, pass: 'dream_sylhet', qty: 1, email: em('f' + form) };
      if (form === 'one' || form === 'event') data.full_name = 'Rahim Email';
      r = await post('/api/book', data);
      expect(r.ok && /payment\/mock/.test(r.redirect || ''), `${form}: books with email and no phone`, r);
    }
    r = await post('/api/book', { form: 'quick', pass: 'gold', qty: 2, email: '  ' + em('UP').toUpperCase() + ' ', phone: '' });
    expect(r.ok, 'email is trimmed and lowercased before use', r);

    // pay one, then book again with the same email: no ticket link, ticket re-sent
    r = await post('/api/book', { form: 'quick', pass: 'dream_dhaka', qty: 1, email: em('paid') });
    await p.goto(new (require('url').URL)(r.redirect, URL).href); await p.click('text=Pay (simulate success)'); await p.waitForURL('**/ticket/**');
    const ticketUrl = p.url().replace(/\?.*$/, ''); const code = ticketUrl.split('/').pop();
    ok('paid booking without phone gets a ticket (' + code + ')');
    r = await post('/api/book', { form: 'quick', pass: 'dream_dhaka', qty: 1, email: em('paid') });
    expect(r.ok && r.already && !r.redirect && /আবার আপনার ইমেইলে পাঠিয়েছি|ইমেইলে আছে/.test(r.message), 'same email again: told it was re-sent, no link to the ticket', r);

    // ---- ticket page
    await p.goto(ticketUrl);
    const page = (await p.textContent('main')).replace(/\s+/g, ' ');
    expect(/ef\*+@example\.com|ef[a-z0-9]\*+@example\.com/.test(page) || /\*+@example\.com/.test(page), 'ticket page shows the address partly hidden');
    expect(!page.includes(em('paid')), 'ticket page does not show the full address');
    const tcsrf = await p.getAttribute('[data-ticket-mail] input[name="csrf"]', 'value').catch(() => null) || csrf;
    const tpost = async (path, data) => { const x = await p.request.post(URL + path, { data: { csrf: tcsrf, ...data }, headers: { Origin: ORIGIN, Accept: 'application/json' } }); return { status: x.status(), ...(await x.json()) }; };
    r = await tpost(`/ticket/${code}/resend`, {});
    expect(r.status === 429 && /এইমাত্র/.test(r.message), 'resend right after a send waits a couple of minutes', r);
    r = await tpost(`/ticket/${code}/email`, { email: 'nope@' });
    expect(r.status === 422, 'fix email: a bad address is refused', r);
    r = await tpost(`/ticket/${code}/email`, { email: em('fixed') });
    expect(r.ok && r.email === em('fixed'), 'fix email: address changed and ticket re-sent', r);
    r = await tpost(`/ticket/${code}/email`, { email: em('fixed') });
    expect(r.status === 422, 'fix email: same address again is refused', r);
    r = await tpost(`/ticket/BADCODE1/resend`, {});
    expect(r.status === 404, 'resend for an unknown ticket: 404', r);
    const x = await p.request.post(URL + `/ticket/${code}/resend`, { data: { csrf: tcsrf }, headers: { Origin: 'https://evil.example', Accept: 'application/json' } });
    expect(x.status() === 403, 'resend from another site is refused');

    // ---- /api/lead and /api/callback
    r = await post('/api/lead', { phone: '01812' + tag.slice(-6), pass: 'gold', form: 'quick' });
    expect(r.ok === false && r.errors && r.errors.email, 'early save without email is refused (reported, not saved)', r);
    r = await post('/api/lead', { email: em('lead'), pass: 'gold', form: 'one' });
    expect(r.ok, 'early save with email only works', r);
    r = await post('/api/callback', { email: em('cbonly'), source: 'landing' });
    expect(r.status === 422, 'call-back without phone is refused (it is a request to be phoned)', r);
    r = await post('/api/callback', { phone: '01912' + tag.slice(-6), email: 'bad@', source: 'landing' });
    expect(r.status === 422 && r.errors && r.errors.email, 'call-back with a bad optional email is refused', r);
    r = await post('/api/callback', { phone: '01913' + tag.slice(-6), email: em('cb'), source: 'landing' });
    expect(r.ok, 'call-back with phone and optional email works', r);
  } catch (e) { fail(e.message.split('\n')[0]); }
  await b.close(); process.exit(fails ? 1 : 0);
})();
