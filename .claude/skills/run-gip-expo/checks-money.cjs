// Admin menu in 5 sections; WhatsApp follow-up with a personal discount (marked as sent, code works at checkout);
// services sold recorded on a booking and shown on the dashboard per event and per page; ফ্যামিলি প্যাক wording.
// Run with the server in PAYMENT_MODE=mock and an admin 'owner' / 'SuperSecret123' (local test data).
const { chromium, devices } = require('playwright');
const { execSync } = require('child_process');
const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
let fails = 0; const ok = (m) => console.log('PASS ' + m), bad = (m) => { fails++; console.log('FAIL ' + m); };
const sql = (q) => execSync(`mysql -uroot gve_local -N -e "${q}"`).toString().trim();
const flat = (t) => String(t || '').replace(/\s+/g, ' ').trim();
(async () => {
  const b = await chromium.launch(), stamp = String(Date.now()).slice(-8);
  const ad = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await ad.route(/wa\.me/, (r) => r.abort());   // the "sent" page opens WhatsApp by itself; stay on it in the test
  await ad.goto(URL + '/admin/login'); await ad.fill('#username', 'owner'); await ad.fill('#password', 'SuperSecret123'); await ad.click('button:has-text("Sign in")'); await ad.waitForURL(URL + '/admin');

  // 1. menu: five sections, the current section's pages underneath
  await ad.goto(URL + '/admin/dashboard');
  const groups = (await ad.locator('[data-admin-groups] a').allTextContents()).map(flat);
  groups.join('|') === 'Sales|People|Event day|Marketing|Settings' ? ok('menu sections: ' + groups.join(', ')) : bad('menu sections: ' + groups.join(', '));
  const sales = (await ad.locator('[data-admin-tabs] a').allTextContents()).map(flat);
  sales.join('|') === 'Dashboard|Pages report|Registrations' ? ok('Sales pages: ' + sales.join(', ')) : bad('Sales pages: ' + sales.join(', '));
  await ad.goto(URL + '/admin/referrals');
  const mk = (await ad.locator('[data-admin-tabs] a').allTextContents()).map(flat);
  flat(await ad.textContent('[data-admin-groups] [aria-current]')) === 'Marketing' && mk.includes('Referrals') && mk.includes('Promo codes') ? ok('Referrals sits under Marketing: ' + mk.join(', ')) : bad('Marketing: ' + mk.join(', '));

  // 2. WhatsApp follow-up to someone who left a contact and did not pay
  const mail = 'wa' + stamp + '@gmail.com', phone = '017' + stamp;
  sql(`INSERT INTO subscribers (email, phone, pass, qty, variant) VALUES ('${mail}', '${phone}', 'dream_dhaka', 1, 'book')`);
  await ad.goto(URL + '/admin/registrations?status=notpaid');
  const row = ad.locator('tr', { hasText: mail });
  await row.locator('input[name="off"]').fill('150');
  // the "sent" page sends the browser on to WhatsApp at once, so read the page from the response
  const [resp] = await Promise.all([ad.waitForResponse((r) => /\/wa$/.test(r.url()) && r.request().method() === 'POST'), row.locator('[data-wa-form] button').click()]);
  const html = await resp.text();
  const code = (html.match(/data-wa-code>([A-Z0-9]+)</) || [])[1] || '';
  const href = ((html.match(/href="(https:\/\/wa\.me\/[^"]+)"/) || [])[1] || '').replace(/&amp;/g, '&');
  const msg = decodeURIComponent((href.split('text=')[1] || ''));
  /^GIP[A-Z0-9]{5}$/.test(code) && href.startsWith('https://wa.me/88' + phone) && msg.includes(code) && /code=/.test(msg) && /১৫০/.test(msg)
    ? ok('WhatsApp opens with a personal ৳150 offer, code ' + code) : bad('WhatsApp: ' + code + ' ' + href.slice(0, 80) + ' ' + msg.slice(0, 200));
  sql(`SELECT CONCAT(kind, ':', value, ':', source) FROM promo_codes WHERE code = '${code}'`) === 'extra:150:whatsapp' ? ok('code saved: extra ৳150, source whatsapp, 48 hours') : bad('code row');
  await ad.goto(URL + '/admin/registrations?status=notpaid');
  const done = flat(await ad.locator('tr', { hasText: mail }).locator('[data-wa-done]').textContent().catch(() => ''));
  done.includes(code) ? ok('row marked: ' + done) : bad('row not marked: ' + done);
  // the code from the message works at checkout (৳499 offer − ৳150)
  const p = await (await b.newContext(devices['iPhone 13'])).newPage();
  const link = msg.match(/https?:\/\/\S+/)[0].replace(/^https?:\/\/[^/]+/, '').replace(/^\/expo/, '');
  await p.goto(URL + link); await p.waitForTimeout(1200);
  // the link names the event (venue=…), so the page may already be on the email step
  if (!(await p.locator('#bEmail').isVisible())) { await p.click('.b-date[data-k="dream_dhaka"]').catch(() => {}); await p.waitForTimeout(900); if (await p.locator('[data-next]').isVisible()) await p.click('[data-next]'); await p.waitForTimeout(500); }
  await p.fill('#bEmail', mail); await p.locator('#bEmail').blur(); await p.waitForTimeout(600); await p.click('#bPay');
  await p.waitForURL('**/payment/mock**', { timeout: 10000 }); await p.click('button[value="pay"]'); await p.waitForURL('**/ticket/**', { timeout: 10000 });
  { const r = sql(`SELECT CONCAT(promo_code, ':', promo_discount, ':', amount) FROM leads WHERE email = '${mail}' AND payment_status = 'paid'`);
    r.startsWith(code + ':150:') ? ok('paid with the WhatsApp code, ৳150 off: ' + r) : bad('price with code: ' + r); }
  const id = sql(`SELECT id FROM leads WHERE email = '${mail}' AND payment_status = 'paid'`);

  // 3. services sold: recorded on the booking, shown per event and per page
  await ad.goto(URL + '/admin/leads/' + id);
  await ad.fill('[data-service-sale] input[name="service_name"]', 'Student visa (UK)'); await ad.fill('[data-service-sale] input[name="service_amount"]', '85000');
  await ad.click('[data-service-sale] button:has-text("Record")'); await ad.waitForTimeout(600);
  /Student visa \(UK\)/.test(await ad.textContent('[data-service-done]').catch(() => '')) ? ok('service recorded: ' + flat(await ad.textContent('[data-service-done]'))) : bad('service not recorded');
  sql(`SELECT service_taken FROM leads WHERE id = ${id}`) === '1' ? ok('a sold service also marks "took a service"') : bad('service_taken not set');
  await ad.goto(URL + '/admin/dashboard');
  const ev = flat(await ad.textContent('[data-svc-pass="dream_dhaka"]')), pg = flat(await ad.textContent('[data-svc-page="book"]'));
  /৳85,000/.test(ev) && /৳85,000/.test(pg) ? ok('dashboard services: event "' + ev + '", page "' + pg + '"') : bad('dashboard services: ' + ev + ' / ' + pg);
  await ad.goto(URL + '/admin/pages');
  /৳85,000/.test(await ad.textContent('[data-svc-page="book"]')) ? ok('pages report: services per page') : bad('pages report services');

  // 4. ফ্যামিলি প্যাক on the forms
  for (const v of ['express', 'pro']) {
    const q = await (await b.newContext(devices['iPhone 13'])).newPage(); await q.goto(URL + '/?v=' + v); await q.waitForTimeout(600);
    (await q.content()).includes('ফ্যামিলি প্যাক') ? ok(v + ': ফ্যামিলি প্যাক named') : bad(v + ': no ফ্যামিলি প্যাক'); await q.context().close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
