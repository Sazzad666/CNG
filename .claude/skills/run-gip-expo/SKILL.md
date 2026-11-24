---
name: run-gip-expo
description: Build, start, run, test, screenshot and drive the GIP Visa Success Expo app (ভিসা সাকসেস এক্সপো ২০২৬) — the Node/Express + MySQL ticket-booking landing page and its /admin lead manager. Use when asked to run or start the expo site, take a screenshot of the landing page/booking form/e-ticket/admin, smoke-test a booking end to end, or audit contrast and tap targets.
---

Node 18+ Express/EJS site backed by MySQL/MariaDB. Drive it with the Playwright driver
`.claude/skills/run-gip-expo/driver.cjs` (smoke flow, screenshots, accessibility audit, admin pages) and `curl`.
All paths below are relative to the unit root (the directory with `server.js`).

## Prerequisites

Node 22 and the preinstalled global Playwright + Chromium are already in this container. MariaDB is not:

```bash
apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server
```

Start MariaDB directly (`service mariadb start` is refused here by `policy-rc.d`), and wait until it answers:

```bash
(mysqladmin -uroot status >/dev/null 2>&1 || (mysqld_safe >/dev/null 2>&1 &)); for i in $(seq 1 15); do mysqladmin -uroot status >/dev/null 2>&1 && break; sleep 1; done; mysqladmin -uroot status | cut -c1-30
```

## Setup

```bash
npm install --no-audit --no-fund
npm run build:css
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS gve_local CHARACTER SET utf8mb4; CREATE USER IF NOT EXISTS 'gve'@'localhost' IDENTIFIED BY 'gvepass'; GRANT ALL ON gve_local.* TO 'gve'@'localhost';"
cat > .env <<'EOF'
NODE_ENV=development
PORT=3100
BASE_URL=http://127.0.0.1:3100
SESSION_SECRET=local-dev-secret-local-dev-secret-0123456789
DB_HOST=localhost
DB_NAME=gve_local
DB_USER=gve
DB_PASS=gvepass
PAYMENT_MODE=mock
EOF
npm run db:init
npm run create-admin -- owner owner@example.com "SuperSecret123" admin
```

`PAYMENT_MODE=mock` replaces SSLCOMMERZ with a local fake gateway at `/payment/mock` (the app refuses to start with it when `NODE_ENV=production`). Re-run `npm run build:css` after changing Tailwind classes in `views/` or `public/js/`.

## Run (agent path)

Start the server in the background and wait for it:

```bash
nohup node server.js > /tmp/gve.log 2>&1 & echo $! > /tmp/gve.pid
timeout 20 bash -c 'until curl -sf -o /dev/null http://127.0.0.1:3100/; do sleep 0.5; done'
curl -s http://127.0.0.1:3100/api/stats | head -c 160
```

Drive it (Playwright is global, so `NODE_PATH` is required):

```bash
export GVE_URL=http://127.0.0.1:3100
NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/driver.cjs smoke
NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/driver.cjs audit
NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/driver.cjs shot / mobile
NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/driver.cjs shot / desktop full
NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/driver.cjs admin insights
```

| command | what it does |
|---|---|
| `smoke` | iPhone viewport: checks headline → form → board order; step 1 taps a venue (unlocks the offer, the other venues stack behind), picks 2 people and Canada, checks that email is required, fills a unique email; step 2 checks phone validation, fills a unique phone (name left empty: optional), pays on the mock gateway, gets the e-ticket; checks the email reached /admin/emails; then logs into `/admin`, finds the booking, opens check-in. Prints `PASS`/`FAIL` lines, exit 1 on any failure or browser console error. |
| `audit` | WCAG contrast (4.5:1, 3:1 for large text) and 44px tap-target audit of `/` on iPhone 13. Exit 1 if anything fails. |
| `shot [path] [mobile\|desktop] [full]` | Screenshot any page; `full` forces scroll-reveal sections visible and captures the full page. |
| `admin [page]` | Log in as `owner` and screenshot `/admin/<page>` (`""` = leads board, `insights`, `checkin`, `content`, `team`). |

Screenshots → `/tmp/gve-shots/` (override with `GVE_SHOTS`). Server log → `/tmp/gve.log`. Admin login override: `GVE_ADMIN_USER` / `GVE_ADMIN_PASS`.

Stop:

```bash
kill $(cat /tmp/gve.pid)
```

## Run (human path)

`npm start` serves on `PORT` from `.env`; open `/` for the site and `/admin` for the lead manager. Ctrl-C to stop.

## Test

There is no unit-test suite (`package.json` has no `test` script). `driver.cjs smoke` plus `driver.cjs audit` are the regression check; both must exit 0.

## Express form

There are two booking forms, switched in Admin › Form (`form_mode` setting). To test the Express 1-step form whatever the setting is, run:

```bash
NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/driver.cjs quick
```

Two more flows:

```bash
NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/driver.cjs event
```

```bash
NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/driver.cjs emailassist
```

`emailassist` checks the email helper on the forms: quick `@gmail.com` buttons, the typo fix, the read-back and its "বদলান" link, a throwaway address refused at the field, and that a typed email is saved as a lead before any button is pressed.

Email rules at the API level (email required, phone optional, call-back keeps phone, a second booking re-sends the ticket instead of opening it, ticket-page resend and fix-email limits): `GVE_URL=… node .claude/skills/run-gip-expo/checks-email.cjs`.

> **Email is retired (phone only).** The forms no longer ask for an email: the mobile number is required, shown with a fixed `🇧🇩 +88` (the visitor types `01XXXXXXXXX`; a pasted `+880…` is trimmed), and the server ignores any `email` it is sent. `checks-gx.cjs` books with a phone. The email-based checks above (`smoke`'s email steps, `emailassist`, `checks-email.cjs`) describe the old rules and are expected to fail until rewritten for the phone.

The `quick` command loads `/?form=quick`, checks that an empty submit is blocked, books 2 people at the Dhaka office, pays with mock payments and lands on the ticket. `smoke` and `audit` use `/`, so they test whichever form Admin › Form has selected. To audit the Express form, set it live first: `mysql -uroot gve_test -e "UPDATE settings SET v='quick' WHERE k='form_mode'"`, then restart the server, because settings are cached for 30 s.

## Gotchas

- **Seeing emails locally:** start the server with `MAIL_DEBUG=1 node server.js`. Every email (ticket, reminder, welcome) is printed to the log between `[mail]` and `[/mail]`. Reminders run 1 minute after start, then every 10 minutes. To trigger them right away, require `src/reminders` from a script, call `settings.load()` and then `run()`.
- **Rows inserted with the mysql CLI use the server's time zone,** but the app's connections use +06:00, so `NOW()` differs by hours. Insert test rows through `src/db` (`pool.query`), or reminder and time-window tests give wrong answers.

- **Running `smoke` and the other booking commands back to back hits the booking rate limit** (8 per IP per 30 min) and fails with HTTP 429. Clear the test bookings first: `mysql -uroot gve_test -e "DELETE FROM leads; DELETE FROM subscribers; DELETE FROM ab_counts"`. Check `.env` `DB_NAME` for the database name.
- **New columns** (`leads.form_variant`, `leads.ab_variant`, `subscribers.phone` and `welcomed_at`) and the `ab_counts` table are added by `npm run db:init`, which is safe to re-run. Pages fail with "Unknown column" until it has run.
- **EJS `<% if %>` blocks around repeated markup:** when cutting a block out of `index.ejs` by text search, `'              </div>\n'` also matches inside a more-indented `</div>` line. The phone-first slot once ended up with an extra `</div>`, which closed `#bookForm` early, so `$('[data-next]', form)` was null. Compare `grep -c "<div\b"` and `grep -c "</div>"` on both `?ab=email` and `?ab=phone`.

- **Animations on blocks that already animate (`.av-item`, `.flag-tile` use `avIn`) get overridden by a second `animation:` rule.** That is why the idle nudge is drawn on `.nudge::after`. Check it with `getComputedStyle(el, '::after').animationName`, not on the element. Screenshots often land on a faint frame of the pulse, so assert on the computed box-shadow instead.
- **The finish-registration sheet (`#optin`) is hard to reach in a headless run.** It opens once per session: after 20 s idle once the form is started, on scrolling past the form, or (not started) after 12 s at 45% depth. Call `window.__rsOpen()` to show it.
- **MariaDB dies between sessions/turns in this container.** Symptom: the site returns 500 and `/tmp/gve.log` shows `connect ECONNREFUSED 127.0.0.1:3306`. Re-run the `mysqld_safe` line from Prerequisites; no app restart needed.
- **Booking rate limit: 8 new bookings per IP per 30 minutes.** Every local run comes from `127.0.0.1`, so repeated smoke runs eventually get HTTP 429 (step 1 never advances). Clear test bookings: `mysql -uroot gve_local -e "DELETE FROM leads"`.
- **A phone that already has a paid ticket for that venue** gets "এই নম্বরে আপনার আগে থেকেই টিকিট আছে" instead of the payment page. The driver uses a time-based unique phone; do the same in ad-hoc scripts.
- **The offer unlock is per browser** (HMAC-signed `gve_offer` cookie, 24 h, never renewed). A fresh Playwright context always gets the unlock; a reused one keeps regular prices after expiry.
- **Offer rounds are computed from the unlock time in the cookie** plus Admin › Offer settings (`settings` table; run `npm run db:init` after pulling so it exists — without it the defaults from `config/site.js` apply). To see round 2 without waiting 24 h, drive the page with Playwright's `page.clock.install()` + `clock.fastForward('24:00:05')`. Under the fake clock, Motion animations freeze, so screenshots of animated parts come out blank; take visual screenshots in real time.
- **The main form (`/?form=steps`) is one step** (`#bookForm[data-onestep]`, app.js "1-step form"). Venue, people and email are required; phone, name and country are optional. The next field carries `.next` (`[data-os-q="venue|email|pay"]`). The page scrolls to it only when it is off screen. Tests can call `window.__osGuide()`, which returns the next key. The email goes to `/api/lead` when the visitor leaves the field (email-assist.js). The old 2-step wizard code in app.js stays dormant (`form` is null). The finish-registration sheet opens with `window.__rsOpen()`.
- **Seat numbers on the public page are display numbers** (`site.seatDisplay`), not the real capacity; `/admin` shows real counts. Rows inserted with the `mysql` CLI need `--default-character-set=utf8mb4` or Bengali text is garbled.
- **Hero elements start at `opacity:0` (`.fx` class) until Motion animates them.** Screenshots taken under ~1 s after load can look empty; the driver waits 1.5–1.8 s. If `/vendor/motion.js` fails, `app.js` removes `.fx` so nothing stays hidden.
- **Visa-wall cards scroll in a marquee**, so Playwright never sees them as "stable" and a normal `click()` times out. Use `click({ force: true })` or the pause button first.
- **YouTube thumbnails (`i.ytimg.com`) are blocked in sandboxes.** The driver ignores those console errors; anything else counts as a failure.
- **Forms posted with `Origin: null` are rejected** by the same-origin check. That happened when Helmet's default `no-referrer` policy was active; `server.js` sets `strict-origin-when-cross-origin`. Do not remove it.
- **Rows inserted with the `mysql` CLI use UTC**, while the app's connections use `+06:00`, so follow-ups/ages look ~6 h off. Insert test data through the app or `SET time_zone='+06:00'` first.
- **Success-stories section is hidden until media exists.** To preview it, add items in `/admin/content` (real uploads go to `public/uploads/`, git-ignored).

## Troubleshooting

- **`Configuration missing` / `SESSION_SECRET must be set`**: `.env` is missing, or `NODE_ENV=production` with a short secret. Recreate `.env` from Setup.
- **`PAYMENT_MODE=mock is not allowed in production`**: expected guard; use `NODE_ENV=development` locally.
- **`Duplicate entry 'owner'` from `create-admin`**: the admin already exists; log in with the same password or use another username.
- **`Error: Cannot find module 'playwright'`**: run the driver with `NODE_PATH=$(npm root -g)`; do not `npm install playwright` (a second copy won't find the preinstalled Chromium).
- **Page renders but fonts look like system defaults**: the fonts come from Google Fonts. Offline or blocked, the page falls back to system fonts, which is cosmetic only.


## v38 audit checks
`NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/checks-v38.cjs`. Run it with the server on :3000. It covers:
- the headline and booking card render with JS off;
- the dock sticks;
- the discount notice is shown and announced;
- coins and the savings pill;
- a call-back is saved;
- reduced motion keeps feedback.

Screenshots go to `/tmp/gve-shots/v38`. Clear `subscribers` first if the call-back rate limit (20 per 30 min per IP) trips.


## Production rehearsal (deploy kit in `deploy/`, guide in `DEPLOY.md`)

Rehearse a VPS deploy in this container: clone the repo to `/var/www/gip-expo`, follow DEPLOY.md steps 3–8 (MariaDB user, `.env`, `npm ci --omit=dev`, `db:init`, `create-admin`, `pm2 start ecosystem.config.cjs`, nginx files), then drive `https://giptravels.com/expo` with the same checks. What it takes here:

- **Unset the agent proxy for every local HTTPS call** (`unset HTTPS_PROXY https_proxy HTTP_PROXY http_proxy`). Otherwise curl and Chromium reach the *real* giptravels.com (a Next.js site on LiteSpeed) and `--resolve` is ignored.
- **Map the domain to this box:** `echo '127.0.0.1 giptravels.com expo.giptravels.com' >> /etc/hosts` (Playwright's `p.request` uses Node DNS, so Chromium's `--host-resolver-rules` alone is not enough). Remove the line afterwards.
- **TLS:** make a self-signed cert with `openssl req -x509 ... -addext subjectAltName=DNS:giptravels.com` in a 443 block that includes `/etc/nginx/snippets/gip-expo.conf`; browsers need `ignoreHTTPSErrors`, Node `NODE_TLS_REJECT_UNAUTHORIZED=0`, and a Next.js proxy `NODE_EXTRA_CA_CERTS=<cert>` (it ignores the former).
- **No IPv6 here:** delete `listen [::]:80;` from the installed site file, or `nginx -t` fails with `Address family not supported`.
- **Production mode refuses mock payments,** so booking flows cannot run in the rehearsal (SSLCOMMERZ sandbox is not reachable from here). Run them in mock mode on a dev server; in the rehearsal check pages, `/api/lead`, `/api/callback`, admin (`checks-admin.cjs` — "no lead to open" is expected on an empty DB) and the mails in `~/.pm2/logs/gip-expo-out-0.log`.
- **Do not `pkill -f 'next start'`** in a script whose own command line contains that text: it kills the script. Stop by port: `fuser -k 4000/tcp`.
- **Option A (main site forwards /expo):** emulate with a real Next.js app holding `deploy/main-site-next.config.js` behind an nginx stand-in that sets `X-Forwarded-For`. With `TRUST_PROXY=2`, Admin › Account must show the visitor IP, not the proxy's (`proxy_bind 127.0.0.2` makes the proxy hop distinguishable).
- **Zero-downtime reload:** `ecosystem.config.cjs` uses cluster mode with 1 instance. In fork mode `pm2 reload` dropped ~3% of requests (502) during the switch.

## Email-first gotchas
- **DNS in this container answers "no such domain" for everything** (even gmail.com). `src/email.js` only trusts a "no" after confirming the resolver can see gmail.com, so here (and on any server with broken DNS) the domain check quietly lets addresses through. To test the domain rule, call `check(email, { resolver })` with a fake resolver, as the unit check in this skill's history does.
- **The early save (`/api/lead`) has its own per-address cap (60 per 30 min)**; repeated test runs from 127.0.0.1 reach it. Age the rows: `UPDATE subscribers SET updated_at = updated_at - INTERVAL 1 HOUR WHERE ip_address = '127.0.0.1'`.
- **`/api/lead` answers 200 with `ok:false` for a refused address** (not 422), on purpose: it runs in the background and a 4xx would show as a console error, which the driver counts as a failure.


## Phase 2 checks (form layout, honest urgency, retry page, no-JS, speed)
All take `GVE_URL` and need `NODE_PATH=$(npm root -g)`:
- `driver.cjs auditall`: contrast, 44px tap targets and sideways scrolling on every page and form mode at 320/360/390/768/1280. Failing contrast lines print the measured fg/bg colours. `GVE_AUDIT_PAGES=/a,/b` narrows it.
- `checks-speed.cjs [runs]`: LCP and CLS on a throttled budget Android (CPU 4x, slow 4G), median of the runs; fails above 2.5 s / 0.1.
- `checks-retry.cjs`: fail and cancel at the mock gateway → retry page (real hold minutes, three actions, emailed link, edited link refused, paid link opens the ticket).
- `checks-nojs.cjs`: JavaScript off: headline, price, phone and the basic form; booking through it; legal pages; canonical, share image and schema.org Event data.
- `checks-keyboard.cjs`: a 390x400 visible area (keyboard up): focused fields stay clear of sticky bars, Enter moves on, the sticky pay bar hides while typing and while the real button is on screen.
- `checks-seats.cjs`: Admin › Offer seats on sale / registration close drive the count, the urgency line and server refusals (restores the settings).
- `checks-promo.cjs`: promo codes end to end (admin form, server price incl. better-of-offer and group price, caps/dates/passes, `?code=` and the code box on the Express, guided 1-step and venue forms, retry re-check, recovery email 3 personal code, referral, broadcast, assignment, Sources). `DB_NAME=gve_test`; it saves and restores the Promo codes switches. Expected prices assume the test browser has the timed offer (the Express page claims it).
- `checks-mail.cjs`: email queue, recovery 1/2 with a moved clock, signed click/open links, one-click unsubscribe, hard bounce, pre-expo reminders, Admin › Unpaid / Email health / Insights. Needs the same DB as the server (`DB_NAME=gve_test`); runs the scheduler in its own process. Test servers with a big backlog: `UPDATE mail_queue SET status="skipped" WHERE status="queued"` first, the per-minute limit is real.

Gotchas found on the way:
- **Preloading the two Bengali woff2 files made things worse** on slow 4G (CLS up to 0.56, LCP +1 s): they compete with the CSS and the hero image. The venue page's late shift came from the fact chips wrapping into a third row once Noto Sans Bengali arrives; stacking them on phones fixed it.
- **The desktop hero is a photo under a `::before` gradient.** The audit reads that gradient at the text's height over a mid-grey stand-in for the photo; a real photo cannot be measured by script, so look at a screenshot when changing the hero image.
- **The venue page claims the discount on the server** (first paint already shows the final price), otherwise the price block grows after the script runs and the booking card jumps.
- **`public/img/og.jpg`** is generated from the logo and fonts by a Playwright script (`setContent` a 1200x630 HTML card, `screenshot({ type: 'jpeg', quality: 86 })`); keep prices off it, share caches keep old images for weeks.


## Phase 3: tracking, funnel, booking limit
`checks-tracking.cjs` plays Meta: start the server under test with `META_API_BASE=http://127.0.0.1:3911` (the script listens there and records Conversions API calls) and it replaces `connect.facebook.net/.../fbevents.js` with a recorder via `ctx.route` + `exposeBinding` (Meta's hosts are blocked here anyway). It checks shared event ids browser/server, Purchase only from the server, hashing, the Insights funnel, and, with `GVE_LIMIT_URL` = a server started with `BOOKING_LIMIT=2` and `META_API_BASE` at a closed port, the limit, staff exemption and "Meta down" behaviour. It switches tracking off again at the end.
- The recorder must attach `callMethod` to the existing `window.fbq` like the real script; replacing `window.fbq` hides later events from code that kept a reference.
- Pixel calls must be collected outside the page (`exposeBinding`): InitiateCheckout fires right before the browser leaves for the payment page.


## Express page (`/?form=quick`, views/express.ejs)
The Express page has its own template, script (`public/js/express.js`) and stylesheet (`public/css/express.css`, every class `x-` prefixed so it never meets app.css). It does not load app.js. It keeps the old ids (`#quickForm`, `#qfEmail`, `#qfPhone`, `#qfSubmit`, `.qf-venue`, `[data-qf-plus]`, `[data-qf-total]`, `[data-dock-msg]`), so `driver.cjs quick`, track.js and form-keys.js work unchanged.
- `NODE_PATH=$(npm root -g) node .claude/skills/run-gip-expo/checks-express.cjs` checks it on a phone and on a desktop:
  - the guide (venue → email → pay) and that each next field ends up on screen
  - a pass button far down the page lands back on Pay
  - the finish-registration sheet (`window.__rsOpen()`), for a visitor who started and for a fresh one
  - two bookings through the mock gateway
- Seat lines say "মাত্র Xটি সিট বাকি" only when Admin › Offer › seats on sale is at most `lowSeatThreshold` (25); otherwise "বুকিং চলছে". To see the counts locally, insert `seats_on_sale_<pass>` = 20 into `settings` and restart. With 20 on sale, the venue page's urgency line switches to seats, so `driver.cjs event` reports "offer not active". Delete the rows afterwards.
- Tapping @gmail.com puts the cursor back in the email field. express.js blurs it once the address is complete; otherwise form-keys.js scrolls back to the field and undoes the scroll to Pay.
- **Group price** (Admin › Promo codes): `group_mode` 'booking' (the default) takes `group_off` once off the whole booking for `group_min`+ tickets; 'ticket' takes it off each ticket. The defaults are 3+ tickets and ৳500 off the booking. The server charges `promo.price().amount`; never charge `unit × qty`. In the browser, `GVEPromo.unit()` spreads a per-booking discount over the tickets, so `unit × q` still shows the right total. `GVEPromo.groupOff(q)` gives the taka off.
- **Express savings bank** (`[data-bank]`, under the people stepper): coins drop into the piggy (Web Animations) only while the bank is fully on screen; a saving made while it is off screen drops in on the next scroll. Reduced motion: the number just changes.

## Two pages only (since the cleanup)
- Only `/?form=steps` (index.ejs, the guided 1-step form) and `/?form=quick` (express.ejs) exist. The Deal form, the single-venue page (`views/event.ejs`, `public/js/event.js`), the old 2-step wizard and the old Express form code are gone. `/events?venue=X` answers 301 with `/?venue=X`, and `?form=one` falls back to the main page.
- Admin › Form switches (settings `auto_scroll`, `email_on`, both default 1). `checks-switches.cjs` tests them both off on both pages: no email field, the phone is required, a phone-only booking gets a ticket, and the guide marks the next field without scrolling. Insert the two rows set to 0 and restart before running it; delete them afterwards.
- Defaults changed: `seats_on_sale_<pass>` = 20, so "মাত্র ২০টি সিট বাকি" shows from the start and counts down live. `offer_restart` = 0, so each visitor's 24-hour discount really ends. The contact number is 01325-054991 (`config/site.js`).
- "সফলতার ১-২-৩" (`partials/success-123.ejs`, styles in `src/styles/input.css` `.s123-*`) is on both pages; step 1 gets `.is-done` from app.js / express.js once the form is ready to pay.

Phase 6 checks (server in PAYMENT_MODE=mock): `checks-book.cjs` (Event page booking), `checks-referral.cjs` (share link → friend's welcome banner and ৳100 → friend pays → buyer emailed, ladder only (no payback box, payback can't be switched on with the ladder), share image 1080×1920, check-in rewards, step 1 recorded as given, second friend → ৳2,000 voucher recorded with an automatic code shown on check-in and the e-ticket), `checks-mobile-flow.cjs` (iPhone: the email gets the cursor during the pick/Next tap, Pay comes into view once the keyboard closes, no layout shift while loading on slow 4G), `checks-wrong-email.cjs` (every form: a real tap on Pay after `rahim@gmail` is answered with the styled "gmail.com?" fix as the one message, field red and linked for screen readers, one tap fixes it; layout shift under 0.1 while scrolling), `checks-money.cjs` (admin menu in 5 sections; WhatsApp follow-up: personal ৳150 code, row marked, code works at checkout; service sold on a booking → dashboard per event and per page, Pages report; ফ্যামিলি প্যাক wording), `checks-guide.cjs` (every form: receive line, no placeholders, colour footer logo; Event page guide + pulse + Enter pays; Sales hero email pulse and Dhaka hint; Express/Simple Dhaka question), `checks-proof.cjs` (?v=steps Proof first: guide line and pulse at every step, step 2 opens with the email focused, wrong email caught, Enter pays, phone bar follows, booking credited to 'steps'), `checks-pro.cjs` (?v=pro sales hero: events in the first screen, discount on scroll, row picks the pass, booking credited to 'pro'), `checks-events.cjs` (Admin › Events & prices: prices, per-event discount switch, discount on scroll, checkout price). To test the sub-path, start a second server with `PORT=3101 BASE_URL=http://127.0.0.1:3101/expo` and run the checks with `GVE_URL=http://127.0.0.1:3101/expo`.

The classic 2-step form (views/index.ejs) is now only at `?v=pro`; older checks that opened `?form=steps` point there. Test bookings use up the discounted seats: if prices suddenly show the regular price, clear local test data (`DELETE FROM leads; ...`) and run again.

## New page designs (Nov 2026 redesign, views/gx)
Every page link now renders `views/gx/page.ejs` with its own form presentation (Admin › Form › "Use the previous page designs" or `&design=classic` brings the earlier templates back; `&design=new` previews the new ones):
`?v=pro` boarding pass · `?v=steps` ticket tabs · `?v=express` venue photo cards · `?v=simple` bottom sheet · `?v=book` calendar.
- Engine `public/js/gx-core.js` (offer claim, prices via GVEPromo, seats, checks, `/api/book`, funnel via track.js); motion kit `public/js/gx-motion.js` (odometer digits, toast stack, confetti, reveals); per-page scripts `public/js/gx-<v>.js`; styles `public/css/gx.css` (themes under `html[data-gx=…]`); display fonts `public/fonts/gx-fonts.css`.
- The page names its funnel form in `<meta name="gve-form">` (+ `gve-xstyle` for quick); bookings post `form` = the variant's mode and `xstyle`, so leads, subscribers and funnel rows carry the right variant.
- Venue / hero photos: Admin › Content › Venue & page photos (`media.kind` 'venue' / 'hero', slot in `subtitle`; `src/photos.js`, cached 30 s). Stock stand-ins in `public/img/photos/venue-*.webp` are labelled "নমুনা ছবি".
- `checks-gx.cjs [variants]`: iPhone, every page: pick a venue, 2 people, email, Pay → mock payment page (৳1,200 for 2 × Dhaka). `driver.cjs smoke` / `quick` / `event` test the classic forms: run them with Admin › Form › previous designs ticked.
- `auditall` on the new pages: `GVE_AUDIT_PAGES="/?v=pro,/?v=steps,/?v=express,/?v=simple,/?v=book"`. Known: the calendar's day cells are 36–38 px wide at 320 px (seven columns cannot reach 44 px; the venue list under it has full-size targets). `checks-speed.cjs` takes `GVE_SPEED_PAGES`.
- Gotchas: anything with `display:` in gx.css needs the global `[hidden] { display:none !important }` (kept at the top). The odometer (`GXM.roll`) keeps non-digit runs whole — never split Bengali text per character, it breaks shaping. Reveals must not scale or tilt (`[data-rv]`): the tap-target audit measures elements before they reveal. The bottom sheet is moved to `<body>` on load, because the hero card's entrance animation would trap a fixed child. Toasts wait while a field is focused or the sheet is open.
