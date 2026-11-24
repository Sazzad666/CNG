#!/usr/bin/env node
/*
 * Driver for the Visa Success Expo (gip-expo) web app.
 * Uses the globally preinstalled Playwright:  NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/driver.cjs <cmd>
 *
 *   smoke                       full user flow: unlock offer → 2-step booking (mock pay) → e-ticket → admin board. Exit 1 on failure.
 *   shot [path] [mobile|desktop] [full]   screenshot a page (default "/") into $GVE_SHOTS
 *   emailassist                 email helper: typo fix, quick @gmail.com, read-back, disposable refused at the field, 1-step typo fix + guide, early save.
 *   quick                       Express 1-step form (/?form=quick): validation → venue + 2 people + email (no phone) → mock pay → ticket.
 *   audit                       WCAG contrast (4.5:1 / 3:1) + 44px tap-target audit of "/" on an iPhone 13 viewport
 *   admin [page]                log in and screenshot an admin page (default "" = leads board), e.g. admin insights
 *
 * Env: GVE_URL (default http://127.0.0.1:3000), GVE_ADMIN_USER / GVE_ADMIN_PASS (default owner / SuperSecret123),
 *      GVE_SHOTS (default /tmp/gve-shots). Requires the server running with PAYMENT_MODE=mock for `smoke`.
 */
'use strict';
const fs = require('fs');
const { chromium, devices } = require('playwright');

const URL = (process.env.GVE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const SHOTS = process.env.GVE_SHOTS || '/tmp/gve-shots';
const USER = process.env.GVE_ADMIN_USER || 'owner';
const PASS = process.env.GVE_ADMIN_PASS || 'SuperSecret123';
fs.mkdirSync(SHOTS, { recursive: true });
const IGNORE = /ytimg|youtube|TUNNEL|ERR_FAILED|aaaaaaaaaaa/; // external video thumbs are blocked in sandboxes

function watch(page, errs) {
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errs.push('console: ' + m.text()); });
}
const ok = (msg) => console.log('PASS ' + msg);
function fail(msg) { console.log('FAIL ' + msg); process.exitCode = 1; }

async function login(page) {
  await page.goto(URL + '/admin/login');
  await page.fill('#username', USER); await page.fill('#password', PASS);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL(URL + '/admin', { timeout: 10000 });
}

async function smoke() {
  const b = await chromium.launch(); const errs = [];
  try {
    // ---- visitor on a phone
    const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage(); watch(p, errs);
    const res = await p.goto(URL + '/'); res.status() === 200 ? ok('home 200') : fail('home ' + res.status());
    await p.waitForTimeout(1500);
    const tops = await p.evaluate(() => ['h1', '#book'].map((s) => document.querySelector(s).getBoundingClientRect().top + scrollY));
    tops[0] < tops[1] ? ok('phone order: headline → form') : fail('phone order ' + tops);
    await p.screenshot({ path: SHOTS + '/smoke-1-home.png' });

    // 1-step form: the guide starts on the venue; an empty pay is blocked with errors under the fields
    await p.locator('#book').scrollIntoViewIfNeeded();
    (await p.locator('#bookForm [data-os-q="venue"].next').count()) ? ok('guide marks the venue first') : fail('guide not on venue');
    await p.click('#submitBtn'); await p.waitForTimeout(400);
    (await p.locator('#bookForm [data-for="pass"]:not(.hidden)').count()) && (await p.getAttribute('#email', 'aria-invalid')) === 'true'
      ? ok('empty pay blocked: venue and email errors shown') : fail('empty pay not blocked');
    // tap a venue -> offer unlocks (signed cookie) -> the guide moves to the email field and scrolls it into view
    await p.click('label[data-venue="dream_dhaka"]');
    await p.waitForTimeout(1300);
    (await p.locator('#bookForm [data-os-q="email"].next').count()) ? ok('venue picked: guide moves to the email field') : fail('guide did not move to email');
    const eb = await p.locator('#email').boundingBox(), vh = p.viewportSize().height;
    eb && eb.y > 0 && eb.y + eb.height < vh ? ok('email field scrolled into view') : fail('email field off screen after the venue tap');
    const unlocked = await p.evaluate(() => !!document.querySelector('#bookForm [data-os-price="dream_dhaka"] s'));
    unlocked ? ok('offer unlocked on first tap') : console.log('INFO offer not unlocked (already claimed in this browser or campaign closed)');
    await p.click('[data-os-qty="1"]');
    /২ জন/.test(await p.textContent('#btnLabel')) ? ok('live total on the pay button: ' + (await p.textContent('#btnLabel'))) : fail('live total');
    const stamp = String(Date.now()).slice(-8), email = 'smoke' + stamp + '@example.com';
    await p.fill('#email', email);
    // the phone is asked on the e-ticket, after payment (not before)
    (await p.isHidden('[data-os-optph]')) ? ok('no phone question before payment') : fail('phone still asked before payment');
    const phone = '017' + stamp;
    await p.locator('#email').blur(); await p.waitForTimeout(1200);   // name left empty on purpose: it is optional
    (await p.locator('#bookForm [data-os-q="pay"].next').count()) ? ok('all filled: guide points at the pay button') : fail('guide not on pay');
    await p.click('#bookForm .os-more summary'); await p.click('label.os-flag:has(input[value="CA"])');
    await p.screenshot({ path: SHOTS + '/smoke-2-confirm.png' });
    // pay → mock gateway → e-ticket
    await p.click('#submitBtn');
    await p.waitForURL('**/payment/mock**', { timeout: 10000 }); ok('reached payment page (mock gateway)');
    await p.click('text=Pay (simulate success)');
    await p.waitForURL('**/ticket/**', { timeout: 10000 });
    const code = p.url().match(/ticket\/([A-Z0-9]{8})/)[1]; ok('e-ticket issued ' + code + ' for ' + email);
    (await p.locator('.tk-day li').count()) === 4 ? ok('e-ticket shows the day, step by step') : fail('no day timeline');
    await p.fill('#tkPhone', '12345'); await p.click('[data-tk-ph-form] button'); await p.waitForTimeout(300);
    /ঠিক হয়নি/.test(await p.textContent('[data-tk-ph-msg]')) ? ok('e-ticket: a wrong phone is caught') : fail('ticket phone validation');
    await p.fill('#tkPhone', phone); await p.click('[data-tk-ph-form] button'); await p.waitForTimeout(900);
    /মনে করিয়ে দেব/.test(await p.textContent('[data-tk-ph-msg]')) ? ok('e-ticket: phone saved after payment') : fail('ticket phone not saved');
    await p.screenshot({ path: SHOTS + '/smoke-3-ticket.png', fullPage: true });
    await ctx.close();

    // ---- staff: board shows the paid booking
    const actx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const a = await actx.newPage(); watch(a, errs);
    await login(a); ok('admin login');
    await a.goto(URL + '/admin?view=list&q=' + encodeURIComponent(phone.slice(-8)));
    (await a.locator('tbody tr[data-id]').count()) >= 1 ? ok('booking visible in admin list') : fail('booking not in admin');
    await a.goto(URL + '/admin/emails?show=all');
    (await a.locator('text=' + email).count()) ? ok('email saved to the promo list') : fail('email not in /admin/emails');
    await a.goto(URL + '/admin'); await a.screenshot({ path: SHOTS + '/smoke-4-admin.png', fullPage: true });
    await a.goto(URL + '/admin/checkin?code=' + code);
    (await a.locator('text=Check in').count()) ? ok('check-in screen finds the ticket') : fail('check-in');
    await actx.close();
  } catch (e) { fail(e.message.split('\n')[0]); }
  finally { await b.close(); }
  errs.length ? fail('browser errors: ' + errs.join(' | ')) : ok('no browser errors');
  console.log('screenshots → ' + SHOTS);
}

async function shot(path = '/', mode = 'desktop', full) {
  const b = await chromium.launch();
  const ctx = await b.newContext(mode === 'mobile' ? { ...devices['iPhone 13'] } : { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); await p.goto(URL + path); await p.waitForTimeout(1800);
  if (full) await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => { e.style.opacity = 1; e.style.transform = 'none'; e.classList.add('in'); }));
  const slug = path.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'home';
  const file = `${SHOTS}/${mode}_${slug}${full ? '_full' : ''}.png`;
  await p.screenshot({ path: file, fullPage: !!full }); console.log(file); await b.close();
}

async function audit() {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  const r = await auditPage(p, '/');
  console.log('CONTRAST FAILS: ' + r.contrast.length); r.contrast.forEach((x) => console.log('  ' + x));
  console.log('SMALL TAP TARGETS: ' + r.touch.length); r.touch.forEach((x) => console.log('  ' + x));
  if (r.contrast.length || r.touch.length) process.exitCode = 1;
  await b.close();
}
// every page and form mode, at 320 / 360 / 390 / 768 / 1280 px: contrast, tap targets, sideways scrolling
async function auditall() {
  const pages = (process.env.GVE_AUDIT_PAGES || '/?v=pro,/?form=quick,/?form=one,/events?venue=SHERATON,/events?venue=SYLHET,/legal/terms,/legal/privacy,/legal/refund').split(',');
  const widths = [320, 360, 390, 768, 1280];
  const b = await chromium.launch(); let bad = 0;
  for (const path of pages) for (const w of widths) {
    const ctx = await b.newContext(w < 768 ? { viewport: { width: w, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: w, height: 900 } });
    const p = await ctx.newPage();
    const r = await auditPage(p, path);
    const n = r.contrast.length + r.touch.length + (r.overflow ? 1 : 0) + (r.status >= 400 ? 1 : 0);
    if (n) { bad++; console.log(`FAIL ${path} @${w}: status ${r.status}, ${r.contrast.length} contrast, ${r.touch.length} tap, overflow ${r.overflow}`); [...r.contrast, ...r.touch].slice(0, 8).forEach((x) => console.log('   ' + x)); }
    else console.log(`PASS ${path} @${w}`);
    await ctx.close();
  }
  await b.close(); if (bad) process.exitCode = 1;
}
async function auditPage(p, path) {
  const resp = await p.goto(URL + path); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => { e.classList.add('in'); e.style.opacity = 1; e.style.transform = 'none'; }));
  const r = await p.evaluate(() => {
    const parse = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const blend = (fg, bg) => { const a = fg[3] ?? 1; return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)); };
    function bgOf(el) { const stack = []; for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); const bi = cs.backgroundImage;
      // a photo under a colour overlay drawn by ::before (the desktop hero): the overlay's colour at the text's height,
      // laid over a mid-grey stand-in for the photo (a script cannot read the photo itself)
      const pb = getComputedStyle(n, '::before');
      if (pb.content !== 'none' && pb.position === 'absolute' && /url\(/.test(pb.backgroundImage) && /linear-gradient\(/.test(pb.backgroundImage)) {
        const st = [...pb.backgroundImage.split('url(')[0].matchAll(/rgba?\(([^)]*)\)(?:\s+([\d.]+)%)?/g)].map((m, i, all) => [m[1].split(',').map(Number), m[2] !== undefined ? +m[2] / 100 : i / Math.max(1, all.length - 1)]);
        const nr = n.getBoundingClientRect(), er = el.getBoundingClientRect(), f = Math.max(0, Math.min(1, (er.top + er.height / 2 - nr.top) / (nr.height || 1)));
        let c = st[st.length - 1][0];
        for (let i = 1; i < st.length; i++) if (f <= st[i][1]) { const k = (f - st[i - 1][1]) / ((st[i][1] - st[i - 1][1]) || 1); c = [0, 1, 2, 3].map((j) => (st[i - 1][0][j] ?? 1) + (((st[i][0][j] ?? 1) - (st[i - 1][0][j] ?? 1)) * k)); break; }
        if (f <= st[0][1]) c = st[0][0];
        return stack.reduceRight((acc, s2) => blend(s2, acc), blend(c, [119, 119, 119]));
      }
      // a vertical gradient with px stops (e.g. the photo hero's navy band): use its colour at the element's own height
      const allStops = bi && bi.startsWith('linear-gradient(') && !/deg|to /.test(bi) ? [...bi.matchAll(/(rgba?\([^)]*\))(?:\s+(-?[\d.]+)px)?/g)] : [];
      const pxStops = allStops.map((m, i) => [m[1], m[2] !== undefined ? m[2] : (i === 0 ? '0' : null)]).filter((m) => m[1] !== null).map((m) => [null, m[0], m[1]]);
      if (pxStops.length >= 2 && pxStops.length === allStops.length) {
        const y = el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2 - n.getBoundingClientRect().top;
        const st = pxStops.map((m) => [parse(m[1]), +m[2]]);
        let col = st[st.length - 1][0];
        if (y <= st[0][1]) col = st[0][0];
        else for (let i = 1; i < st.length; i++) if (y <= st[i][1]) { const k = (y - st[i - 1][1]) / ((st[i][1] - st[i - 1][1]) || 1); col = [0, 1, 2].map((j) => st[i - 1][0][j] + (st[i][0][j] - st[i - 1][0][j]) * k); break; }
        return stack.reduceRight((acc, s2) => blend(s2, acc), col.slice(0, 3));
      }
      if (bi && (bi.startsWith('linear-gradient') || bi.startsWith('radial-gradient')) && !/em|px/.test(cs.backgroundSize.split(' ')[1] || '')) { const c = bi.match(/rgba?\([^)]*\)/g); if (c) { const last = parse(c[c.length - 1]); if ((last[3] ?? 1) === 1) return stack.reduceRight((acc, s) => blend(s, acc), last.slice(0, 3)); } }
      const c = parse(cs.backgroundColor); if (c && (c[3] ?? 1) > 0) { if ((c[3] ?? 1) >= 1) return stack.reduceRight((acc, s) => blend(s, acc), c.slice(0, 3)); stack.push(c); } }
      // nothing behind the text in its own parents: look at what is painted under it (a full-bleed layer, e.g. the hero's dark band)
      const r0 = el.getBoundingClientRect(), x = r0.left + Math.min(r0.width / 2, 8), y0 = r0.top + r0.height / 2;
      const chain = new Set(); for (let n = el; n; n = n.parentElement) chain.add(n);
      for (const u of (document.elementsFromPoint(x, y0) || [])) {
        if (chain.has(u)) continue;
        const us = getComputedStyle(u), uc = parse(us.backgroundColor), ub = us.backgroundImage;
        if (uc && (uc[3] ?? 1) >= 1) return stack.reduceRight((acc, s2) => blend(s2, acc), uc.slice(0, 3));
        if (ub && ub.startsWith('linear-gradient')) { const cs2 = ub.match(/rgba?\([^)]*\)/g); if (cs2) { const first = parse(cs2[0]); if ((first[3] ?? 1) === 1) return stack.reduceRight((acc, s2) => blend(s2, acc), first.slice(0, 3)); } }
      }
      return [255, 255, 255]; }
    const out = { contrast: [], touch: [] };
    document.querySelectorAll('body *').forEach((el) => {
      const cs = getComputedStyle(el); if (cs.display === 'none' || el.closest('[aria-hidden="true"],.hidden,dialog:not([open]),svg,canvas,#offerBar')) return;
      const rect = el.getBoundingClientRect(); const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (own && rect.width) { const bg = bgOf(el), f = blend(parse(cs.color), bg); const L1 = lum(f), L2 = lum(bg); const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
        const size = parseFloat(cs.fontSize), need = size >= 24 || (+cs.fontWeight >= 700 && size >= 18.66) ? 3 : 4.5;
        if (ratio < need) out.contrast.push(`${ratio.toFixed(2)}<${need} "${el.textContent.trim().slice(0, 30)}" fg ${f.map(Math.round)} bg ${bg.map(Math.round)}`); }
      if (el.matches('a,button,input,select,label.opt,label.pill,summary') && rect.width && (rect.width < 44 || rect.height < 44) && !el.matches('.sr-only,input[type=radio],input[type=checkbox],input[type=hidden]'))
        out.touch.push(`${Math.round(rect.width)}x${Math.round(rect.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`);
    }); out.overflow = document.documentElement.scrollWidth > innerWidth + 1; return out; });
  r.status = resp ? resp.status() : 0;
  return r;
}

async function admin(page = '') {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await login(p); await p.goto(URL + '/admin/' + page);
  const file = `${SHOTS}/admin_${page.replace(/[^a-z0-9]+/gi, '_') || 'leads'}.png`;
  await p.screenshot({ path: file, fullPage: true }); console.log(file); await b.close();
}

/* Express 1-step form, forced with ?form=quick (works whatever Admin › Form is set to) */
async function quick() {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage(); watch(p, errs);
  try {
    await p.goto(URL + '/?form=quick'); await p.waitForTimeout(800);
    (await p.locator('#quickForm').count()) ? ok('express form rendered') : fail('express form missing');
    await p.click('#qfSubmit'); await p.waitForTimeout(500);
    /ভেন্যু.*ইমেইল/.test(await p.textContent('#quickForm [data-dock-msg]')) ? ok('empty submit blocked: venue + email marked') : fail('empty submit not blocked: ' + await p.textContent('#quickForm [data-dock-msg]'));
    await p.click('.qf-venue[data-venue="dream_dhaka"]'); await p.waitForTimeout(1500); if (await p.locator('[data-gp]').isVisible()) { await p.click('[data-gp-go]'); await p.waitForTimeout(900); }
    await p.click('[data-qf-plus]'); await p.waitForTimeout(400);
    await p.fill('#qfEmail', 'quick' + String(Date.now()).slice(-8) + '@example.com');
    await p.screenshot({ path: SHOTS + '/quick-1-filled.png' });
    await p.click('#qfSubmit');
    await p.waitForURL('**/payment/mock**', { timeout: 10000 }); ok('reached payment page (mock gateway)');
    await p.click('text=Pay (simulate success)');
    await p.waitForURL('**/ticket/**', { timeout: 10000 }); ok('ticket issued with an email and no phone: ' + p.url().match(/ticket\/([A-Z0-9]{8})/)[1]);
    errs.length ? fail('browser errors: ' + errs.join(' | ')) : ok('no browser errors');
  } catch (e) { fail(e.message); }
  await b.close();
}

async function emailassist() {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage(); watch(p, errs);
  const stamp = String(Date.now()).slice(-8);
  try {
    // Express: quick domain buttons, typo fix, early save without pressing any button
    await p.goto(URL + '/?form=quick'); await p.waitForTimeout(900);
    await p.click('.qf-venue[data-venue="dream_dhaka"]'); await p.waitForTimeout(1200); if (await p.locator('[data-gp]').isVisible()) { await p.click('[data-gp-go]'); await p.waitForTimeout(900); }
    await p.fill('#qfEmail', 'assist' + stamp);
    (await p.locator('#quickForm .em-chip').first().isVisible()) ? ok('quick @gmail.com buttons appear while only the name part is typed') : fail('no quick domain buttons');
    await p.click('#quickForm .em-chip[data-dom="yahoo.com"]');
    (await p.inputValue('#qfEmail')) === 'assist' + stamp + '@yahoo.com' ? ok('one tap adds @yahoo.com') : fail('quick domain: ' + await p.inputValue('#qfEmail'));
    await p.fill('#qfEmail', 'assist' + stamp + '@gmial.com'); await p.locator('#qfEmail').blur(); await p.waitForTimeout(300);
    /gmail\.com/.test(await p.textContent('#quickForm .em-fix')) ? ok('typo spotted: "gmial.com নয়, gmail.com?"') : fail('typo not spotted');
    await p.click('#quickForm .em-fix-btn'); await p.waitForTimeout(800);
    const fixed = 'assist' + stamp + '@gmail.com';
    (await p.inputValue('#qfEmail')) === fixed ? ok('one tap fixes it') : fail('typo fix: ' + await p.inputValue('#qfEmail'));
    (await p.textContent('#quickForm [data-email-echo]')).includes(fixed) ? ok('read-back shows the fixed address above the pay button') : fail('read-back');
    // disposable address: the server says no, under the field, before any button
    await p.fill('#qfEmail', 'x' + stamp + '@mailinator.com'); await p.locator('#qfEmail').blur(); await p.waitForTimeout(900);
    /অস্থায়ী/.test(await p.textContent('#quickForm [data-for="email"]')) ? ok('disposable address refused at the field') : fail('disposable not shown');
    // 1-step form: the same helper on its email field; a one-tap fix also moves the guide on to Pay
    await p.goto(URL + '/?v=pro'); await p.waitForTimeout(900);
    await p.locator('[data-venues]').scrollIntoViewIfNeeded(); await p.click('label[data-venue="dream_dhaka"]'); await p.waitForTimeout(1300);
    await p.fill('#email', 'steps' + stamp + '@gmial.com'); await p.locator('#email').blur(); await p.waitForTimeout(700);
    (await p.locator('#bookForm [data-em-fix]:not([hidden])').count()) ? ok('1-step: typo fix offered on the email field') : fail('1-step: typo fix missing');
    await p.click('#bookForm [data-em-fix-btn]'); await p.waitForTimeout(1200);
    (await p.inputValue('#email')).endsWith('@gmail.com') && (await p.locator('#bookForm [data-os-q="pay"].next').count())
      ? ok('1-step: one tap fixes it and the guide moves to Pay') : fail('1-step: fix or guide');
    // early save: the Express address above reached the contact list without any button press
    const actx = await b.newContext(); const a = await actx.newPage(); await login(a);
    await a.goto(URL + '/admin/all?q=' + encodeURIComponent(fixed));
    (await a.textContent('tbody')).includes(fixed) ? ok('email saved as a lead as soon as it was typed (Lead center)') : fail('early save missing');
    await actx.close();
    errs.length ? fail('browser errors: ' + errs.join(' | ')) : ok('no browser errors');
  } catch (e) { fail(e.message.split('\n')[0]); }
  await b.close();
}

const [cmd, ...args] = process.argv.slice(2);
const cmds = { smoke, quick, emailassist, auditall, shot: () => shot(args[0], args[1], args[2] === 'full'), audit, admin: () => admin(args[0]) };
if (!cmds[cmd]) { console.log('usage: driver.cjs smoke | quick | emailassist | auditall | shot [path] [mobile|desktop] [full] | audit | admin [page]'); process.exit(2); }
cmds[cmd]().catch((e) => { console.error(e); process.exit(1); });
