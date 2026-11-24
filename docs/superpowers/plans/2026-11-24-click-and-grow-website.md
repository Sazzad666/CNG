# Click & Grow Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Click & Grow agency marketing site (Dhaka). It is a lead-capture-first Express site
with an animated brand, three lead paths and an `/admin` lead inbox.

**Architecture:**
- An Express 4 app renders EJS pages from JSON content files in `content/`.
- Leads are validated by a pure module, stored in MySQL through a small store module, and announced by
  email through Nodemailer. The email is never in the save path.
- Front-end motion uses the Motion library (vendored from `node_modules`) and GSAP ScrollTrigger, all
  loaded as plain `<script>` files. There is no bundler.

**Tech Stack:**
- Node ≥ 22 (`node:test` for tests), Express 4, EJS 3, mysql2, express-session with
  express-mysql-session, bcryptjs, helmet, compression, nodemailer.
- Tailwind 3 CLI for CSS, motion, gsap, @fontsource fonts, supertest for HTTP tests.
- Sharp for converting photos to WebP, Playwright (preinstalled) for screenshots.

**Spec:** `docs/superpowers/specs/2026-11-24-click-and-grow-website-design.md`

## Global Constraints

- **Brand name:** "Click & Grow". The ampersand is set in Instrument Serif Italic in the wordmark.
- **Palette tokens:** `--ink #0B0F0C`, `--ink-2 #151B16`, `--ink-3 #222A23`, `--cream #F3F1EA`,
  `--sage #8A998C`, `--lime #C6F432`, `--lime-deep #9BC41A`, `--error #FF6B5B`. Text on lime is always
  `--ink`. Lime appears on buttons, the logo sprout and at most one word per headline.
- **Fonts:** self-hosted from npm `@fontsource`.
  - Body: Inter Tight.
  - Accent: Instrument Serif Italic.
  - Display: **Bricolage Grotesque**, replacing Clash Display, which isn't on npm and whose host isn't
    reachable. This is a builder's call, recorded in the spec.
- **Phone:** shown as `+880 1732-508485`, linked as `tel:+8801732508485`. WhatsApp:
  `https://wa.me/8801732508485`. Office: "Dhaka, Bangladesh".
- **Email placeholder:** `hello@clickandgrow.example`. It lives in `config/site.js` only.
- **No prices** anywhere. Budget bands only: `under-50k` "Under ৳50,000", `50k-150k` "৳50,000 – ৳1.5 lakh",
  `150k-500k` "৳1.5 – 5 lakh", `500k-plus` "৳5 lakh+".
- **Service keys:** `web-design`, `branding`, `video`, `apps`, `growth`.
- **Lead types:** `enquiry`, `estimate`, `audit`. **Statuses:** `new`, `contacted`, `qualified`, `won`,
  `lost`.
- **Demo content:** every demo item has `"demo": true` and renders a "Sample" tag.
- **Motion:** only `transform`, `opacity` and `clip-path` are animated. No scroll hijacking and no
  preloader. Every motion has a `prefers-reduced-motion` fallback. Hover effects only inside
  `@media (hover:hover)`.
- **Pages:** responsive at 390, 768, 1024 and 1440 px with no horizontal scroll. Text contrast is at
  least 4.5:1.
- **Email:** a failed email alert never loses or blocks a lead.

## Review Focus

1. **Phone input in real-world shapes.** `+880 1732-508485`, `8801732508485`, `01732 508485` and
   Bangla digits `০১৭৩২৫০৮৪৮৫` should all normalise to `01732508485`. Landlines and too-short numbers
   are rejected with a clear message. Tested in Task 2.
2. **Long or non-Latin text** in name and message: a 200-character name, a Bangla name, emoji. These
   are saved intact (utf8mb4), cut to the field limits, and render escaped in the admin without breaking
   the layout. Tested in Tasks 2 and 4.
3. **Double submit and bots.** A second click doesn't create two leads, because the button is disabled
   and there's a duplicate guard on the same phone and type within 2 minutes. A filled honeypot or a
   form sent in under 2 s returns success without saving. Tested in Task 3.
4. **SMTP down or not configured.** The lead is still saved, the visitor still reaches `/thank-you`, and
   the failure is logged. Tested in Task 3.
5. **JavaScript disabled or failing.** The enquiry form still posts as a normal form and redirects to
   `/thank-you`. Tested in Task 3 (form-encoded POST).

---

## File Structure

```
server.js                     app setup, routes mount, healthz, listen
config/site.js                brand, phone, address, email, socials, budget bands, service keys
src/config.js                 env → config (db, smtp, session, isProd checks)
src/db.js                     mysql2 pool
src/leads/validate.js         pure: normalizeBdPhone, validateLead
src/leads/store.js            insertLead, findRecentDuplicate, listLeads, getLead, updateLead, countsBy, savePartial
src/leads/notify.js           sendLeadAlert(lead) → never throws
src/leads/routes.js           POST /api/leads, POST /api/estimate-partial, form fallback
src/admin/auth.js             login, loadUser, requireStaff (from Expo, single role)
src/admin/routes.js           /admin login, list, detail, update, csv, dashboard
src/content.js                loads content/*.json once, getters
src/pages/routes.js           public pages, sitemap.xml, robots.txt
content/services.json, projects.json, testimonials.json, faqs.json, team.json, clients.json
database/schema.sql           leads, estimate_partials, admins, lead_events
scripts/db-init.js, scripts/create-admin.js, scripts/photos.js
views/layout/head.ejs, header.ejs, footer.ejs, enquiry-panel.ejs, exit-intent.ejs, mobile-bar.ejs
views/partials/logo.ejs, enquiry-form.ejs, section-*.ejs
views/home.ejs, services.ejs, service.ejs, work.ejs, project.ejs, about.ejs, contact.ejs, estimate.ejs,
      thank-you.ejs, privacy.ejs, not-found.ejs
views/admin/*.ejs
src/styles/input.css, tailwind.config.js → public/css/app.css
public/js/site.js (motion layer), forms.js, estimator.js, exit-intent.js, logo.js
public/img/… (WebP photos), public/brand/… (logo SVGs, favicon, og.png)
test/*.test.js
```

---

### Task 1: App skeleton, config, database, layout shell

**Files:**
- Create: `package.json`, `.env.example`, `config/site.js`, `src/config.js`, `src/db.js`,
  `database/schema.sql`, `scripts/db-init.js`, `server.js`, `tailwind.config.js`,
  `src/styles/input.css`, `views/layout/*.ejs`, `views/home.ejs` (stub), `views/not-found.ejs`.
- Test: `test/app.test.js`, `test/helpers.js`.

**Interfaces:**
- Produces:
  - `require('./server')` exports the Express `app`, which doesn't listen when required.
  - `config.site` holds `{ name, phone, phoneHref, whatsapp, email, city, budgets: [{key,label}],
    services: [{key,label}] }`.
  - `pool` comes from `src/db.js`.
  - `test/helpers.js` exports `resetDb()`, which truncates all tables in `cng_test`.

- [ ] **Step 1: Write the failing tests.**
  - `GET /` returns 200, the body contains "Click & Grow" and `+880 1732-508485`.
  - `GET /healthz` returns `{ok:true}`.
  - `GET /nope` returns 404 and contains "Page not found".
  - The response has the helmet header `content-security-policy`.
- [ ] **Step 2:** Run `npm test` and expect a FAIL (no server).
- [ ] **Step 3:** Implement following the Expo `server.js` and `config.js` pattern, trimmed down:
  - No payment and no basepath.
  - CSP `script-src 'self'`, plus GA4 and Meta hosts only when their IDs are set.
  - `schema.sql` tables:
    - `leads`, with the columns from spec 9.4.
    - `estimate_partials (id, answers JSON, last_step TINYINT, created_at)`.
    - `admins (id, username, email, full_name, password_hash, is_active, failed_attempts, locked_until,
      last_login_at, last_login_ip)`.
    - `lead_events (id, lead_id, admin_id, kind, detail, created_at)`.
    - utf8mb4 throughout.
  - The layout has a head with fonts and CSS, a header with nav, a footer with contacts and the
    Unsplash credit line, and a skip link.
- [ ] **Step 4:** Run `npm run db:init` with `DB_NAME=cng_test`, then `npm test`. Expect PASS.
- [ ] **Step 5:** Commit with the message `feat: app skeleton, config, schema, layout shell`.

### Task 2: Lead validation (pure)

**Files:**
- Create: `src/leads/validate.js`.
- Test: `test/validate.test.js`.

**Interfaces:**
- Produces:
  - `normalizeBdPhone(input: string) → string | null`.
  - `validateLead(type: 'enquiry'|'estimate'|'audit', body: object) → { ok: true, data } | { ok: false,
    errors: { [field]: message } }`.
  - `data` holds `{ type, name, phone, email|null, service|null, budget|null, message|null,
    website|null, answers|null, source_page, utm_source, utm_medium, utm_campaign, referrer }`.

- [ ] **Step 1: Write the failing tests.**
  - The phone shapes from Review Focus #1 should return `'01732508485'`. `'02-9898989'`, `'0173250'`
    and `'abc'` should return `null`.
  - **enquiry:** name and phone are required. Email is optional but validated when present. `service`
    must be a known key or empty. `budget` must be a known band or empty.
  - **estimate:** email is required and `answers` must be a non-empty object.
  - **audit:** `website` is required and must look like a URL. Bare `example.com` is accepted and
    stored as `https://example.com`.
  - Limits: name ≤ 120, message ≤ 2000, website ≤ 300. Longer values are cut, not rejected. A Bangla
    name and emoji survive unchanged.
  - Error messages say what to fix: `phone: "Enter a Bangladeshi mobile number, like 01712-345678."`
    and `name: "Please tell us your name."`
- [ ] **Step 2:** Run `node --test test/validate.test.js` and expect a FAIL.
- [ ] **Step 3:** Implement. For phones: map Bangla digits ০-৯, strip non-digits, strip a leading `880`
  or `88`, then the result must match `/^01[3-9]\d{8}$/`.
- [ ] **Step 4:** Run the tests and expect PASS.
- [ ] **Step 5:** Commit with the message `feat: lead validation`.

### Task 3: Lead store, alert email and submission endpoint

**Files:**
- Create: `src/leads/store.js`, `src/leads/notify.js`, `src/leads/routes.js`, `views/thank-you.ejs`.
- Test: `test/leads.test.js`.

**Interfaces:**
- Consumes: `validateLead` and `pool`.
- Produces:
  - `insertLead(data) → id`.
  - `findRecentDuplicate(phone, type, minutes=2) → id|null`.
  - `savePartial(answers, lastStep) → id`.
  - `sendLeadAlert(lead) → Promise<{sent:boolean, reason?}>`, which never rejects.
  - Routes:
    - `POST /api/leads`: JSON in, `{ok:true, redirect:'/thank-you?type=…'}` or
      `{ok:false, errors}` with status 422.
    - The same URL posted as a form redirects with 303 to `/thank-you?type=…`, or re-renders the
      referring page's form with errors.
    - `POST /api/estimate-partial` returns `{ok:true}`.
    - `GET /thank-you?type=enquiry|estimate|audit` shows the copy from spec 13a.

- [ ] **Step 1: Write the failing tests** (supertest against `cng_test`; `resetDb()` before each test).
  - A valid JSON enquiry gets a 200 response with a redirect, and one row in `leads` with status `new`.
  - An invalid phone gets a 422 response with an error on `phone`.
  - A form-encoded POST gets a 303 response to `/thank-you?type=enquiry`.
  - A filled honeypot field `company_site` gets a 200 response and 0 rows saved.
  - `_t` (form render timestamp) less than 2000 ms ago: 200, 0 rows.
  - The same phone and type posted twice within 2 minutes gives 1 row, and both responses are
    successful.
  - With SMTP unset, the lead is still saved and `sendLeadAlert` resolves `{sent:false,
    reason:'smtp-not-configured'}`.
  - A rate limit of 10 posts per IP per 10 minutes. The 11th gets a 429 with a friendly message.
  - Each `/thank-you?type=` value renders its own copy.
  - A partial estimate is saved with `last_step`.
- [ ] **Step 2:** Run the tests and expect a FAIL.
- [ ] **Step 3:** Implement.
  - The alert is sent after the insert, without being awaited by the response.
  - The email is plain HTML with every field and a link to `/admin/leads/:id`.
  - The IP is stored as a sha256 hash with a salt from `SESSION_SECRET`.
- [ ] **Step 4:** Run the tests and expect PASS.
- [ ] **Step 5:** Commit with the message `feat: lead capture endpoint, store and alerts`.

### Task 4: Admin lead inbox

**Files:**
- Create: `src/admin/auth.js`, `src/admin/routes.js`, `scripts/create-admin.js`, and in
  `views/admin/`: `login.ejs`, `leads.ejs`, `lead.ejs`, `dashboard.ejs`, `_top.ejs`, `_bottom.ejs`.
- Test: `test/admin.test.js`.

**Interfaces:**
- Consumes: the store from Task 3, extended with:
  - `listLeads({type,status,service,q,from,to,page}) → {rows,total}`.
  - `getLead(id) → lead + events`.
  - `updateLead(id,{status?,note?},adminId)`, which writes `lead_events`.
  - `countsBy() → {byWeek, byType, bySource, partialsByStep}`.
- Produces:
  - `GET/POST /admin/login` and `POST /admin/logout`.
  - `GET /admin` (dashboard).
  - `GET /admin/leads` (filters through the query string, 25 per page).
  - `GET /admin/leads/:id` and `POST /admin/leads/:id`.
  - `GET /admin/leads.csv` (the current filters, UTF-8 with BOM for Excel).

- [ ] **Step 1: Write the failing tests.**
  - Not logged in: `/admin/leads` redirects to `/admin/login`.
  - A wrong password shows a generic error. After 5 failures the account is locked.
  - Logged in:
    - The list shows seeded leads.
    - `?status=new&type=audit` filters, and `?q=` searches name, phone and email.
  - Updating the status to `contacted` writes a `lead_events` row with the admin id.
  - The CSV starts with a BOM, has a header row, and a Bangla name round-trips.
  - A 200-character name renders escaped (`<script>` in a name shows as text).
  - CSRF: a POST without a valid session token gets a 403.
- [ ] **Step 2:** Run the tests and expect a FAIL.
- [ ] **Step 3:** Implement.
  - Port Expo's `auth.js` with a single role.
  - Sessions are stored in MySQL and scoped to `/admin`.
  - CSRF uses a per-session token in a hidden field.
  - Admin styling is plain, dense and dark: Operate mode, so precision over flair.
- [ ] **Step 4:** Run the tests and expect PASS.
- [ ] **Step 5:** Commit with the message `feat: admin lead inbox`.

### Task 5: Content, public pages, SEO and photos

**Files:**
- Create:
  - `content/*.json`, `src/content.js`, `src/pages/routes.js`.
  - Views: `services.ejs`, `service.ejs`, `work.ejs`, `project.ejs`, `about.ejs`, `contact.ejs`,
    `privacy.ejs`, and `partials/enquiry-form.ejs`.
  - `scripts/photos.js` and `public/img/**`.
- Test: `test/pages.test.js`.

**Interfaces:**
- Produces:
  - Content getters: `services()`, `service(key)`, `projects()`, `project(slug)`, `testimonials()`,
    `faqs()`, `team()`, `clients()`.
  - `res.render` locals `{ title, description, canonical, ogImage }` for every page.
  - The partial `enquiry-form` takes `{ service?, variant: 'panel'|'inline'|'page' }`.
- **Content:**
  - Five services, using the sub-service lists in spec section 7.
  - Six demo projects from spec section 11. Each has a slug, client type, services, a challenge,
    approach, result line, 3–4 photos and `demo:true`.
  - Three testimonials, six FAQs from spec section 8 item 10, a team of four, and eight demo client
    names drawn as wordmarks.
- **Photos:** search the Unsplash MCP for each service and project. Download from
  `images.unsplash.com`, convert with sharp to WebP at 640, 1024 and 1600 widths, and record each
  photographer in `content/credits.json`.

- [ ] **Step 1: Write the failing tests.**
  - Each URL in spec section 7 (except admin) returns 200, with a unique `<title>` and a meta
    description.
  - `/services/unknown` and `/work/unknown` return 404.
  - A service page contains the enquiry form with that service pre-selected.
  - `/sitemap.xml` lists every public URL, and `/robots.txt` disallows `/admin`.
  - The home page has LocalBusiness JSON-LD containing the phone number.
  - Every project page shows "Sample project".
- [ ] **Step 2:** Run the tests and expect a FAIL.
- [ ] **Step 3:** Implement the pages and write the copy: a premium, plain, warm voice, then a
  humanizer pass. Fetch the photos.
- [ ] **Step 4:** Run the tests and expect PASS.
- [ ] **Step 5:** Commit with the message `feat: content, public pages, SEO, photos`.

### Task 6: Homepage, animated logo and motion layer

**Files:**
- Create:
  - `views/home.ejs` (the full page) and `views/partials/section-*.ejs` (the twelve sections from
    spec section 8).
  - `views/partials/logo.ejs` (inline SVG).
  - `public/js/site.js`, `public/js/logo.js`, `public/js/forms.js`.
  - `views/layout/enquiry-panel.ejs` and `views/layout/mobile-bar.ejs`.
  - `public/brand/*`: logo SVGs light, dark and 1-colour, `favicon.svg`, and `og.png`.
- Modify: `server.js` to serve `/vendor/motion.js` and `/vendor/gsap/*` from `node_modules`.
- Test: `test/home.test.js` (HTML structure) and `scripts/shots.js` (Playwright screenshots at 390, 768,
  1024 and 1440 px, plus a check that `scrollWidth <= innerWidth`).

**Interfaces:**
- Produces:
  - Markup hooks the JS reads:
    - `[data-enter]` for hero entrance items, with `data-enter-step` = 0..n.
    - `[data-reveal]` for blocks that reveal once.
    - `[data-open-enquiry]` with an optional `data-service`.
    - `[data-marquee]`, `[data-process-line]`, `[data-drift]` and `#cg-logo`.
  - `forms.js` attaches to every `form[data-lead-form]`. It posts JSON with a fallback to normal
    submit, shows inline errors, disables the button while sending, and fills the hidden UTM and
    source fields from `sessionStorage`.
- **Logo sequence** (spec section 6.3), about 1.1 s in total:
  1. The cursor drops (y −12 → 0, spring).
  2. It presses (scale 0.92, 160 ms).
  3. A ring expands (scale 0 → 1.6, opacity 1 → 0, 450 ms).
  4. The stem draws (stroke-dashoffset, 350 ms).
  5. The leaves unfold (rotate from 0, spring).
  6. The words enter on an overlap.
  - **Hover:** the leaves sway ±6°, and the ring pulses once.
  - **Reduced motion:** the final state only.

- [ ] **Step 1: Write the failing tests.**
  - The home HTML contains all twelve section ids in order: `hero`, `trust`, `services`, `work`, `why`,
    `process`, `estimate-teaser`, `testimonials`, `faq`, `cta`, plus the header and footer landmarks.
  - Exactly one `<h1>`.
  - Every `[data-open-enquiry]` button also has an `href="/contact"` fallback.
- [ ] **Step 2:** Run the tests and expect a FAIL.
- [ ] **Step 3:** Implement following spec sections 8 and 10.
  - Choreography: the hero gets one entrance at 100–150 ms steps. Each section reveals as one beat.
    The enquiry panel slides from the right in 280 ms with no inner stagger.
- [ ] **Step 4:** Run `npm test` and expect PASS. Then run `node scripts/shots.js` and expect 4 PNGs
  with no horizontal overflow. Look at the shots and fix what's off.
- [ ] **Step 5:** Commit with the message `feat: homepage, animated logo, motion layer`.

### Task 7: Project estimator

**Files:**
- Create: `views/estimate.ejs`, `views/partials/estimator.ejs`, `public/js/estimator.js`.
- Modify: `views/partials/section-estimate-teaser.ejs`, so it opens the estimator with step 1
  pre-answered.
- Test: `test/estimator.test.js` (Playwright, end to end).

**Interfaces:**
- Consumes: `POST /api/leads` with type `estimate` and `answers`, and `POST /api/estimate-partial`.
- **Steps** are as in spec 9.2. The step-2 questions per service:
  - **web-design:** pages (1–5 / 6–15 / 16+); ecommerce (no / yes); products (≤50 / 51–500 / 500+).
  - **branding:** what's needed (logo / full identity / packaging / print).
  - **video:** type (ad / explainer / corporate / social series) and length.
  - **apps:** platforms (iOS / Android / both) and backend (yes / no / not sure).
  - **growth:** channels (Google ads / Meta ads / SEO / social management / email).
- **Behaviour:**
  - Back and next work by keyboard.
  - Answers persist in `sessionStorage`, so a refresh resumes.
  - The partial is saved when the visitor leaves after step 2 (`navigator.sendBeacon`).
  - The overlay works at `/estimate` and as an overlay through `[data-open-estimate]`.

- [ ] **Step 1: Write a failing e2e test.** Complete all 5 steps for "web-design". This lands on
  `/thank-you?type=estimate`, and the DB has one `estimate` lead whose answers include `pages`.
- [ ] **Step 2:** Run the test and expect a FAIL.
- [ ] **Step 3:** Implement. Steps change with a slide and crossfade (250 ms, `popLayout`-style: the
  outgoing step is absolutely positioned).
- [ ] **Step 4:** Run the test and expect PASS.
- [ ] **Step 5:** Commit with the message `feat: project estimator`.

### Task 8: Exit-intent audit offer

**Files:**
- Create: `views/layout/exit-intent.ejs` and `public/js/exit-intent.js`.
- Test: `test/exit-intent.test.js` (Playwright).

**Interfaces:**
- Consumes: `POST /api/leads` with type `audit`.
- Triggers are as in spec 9.3. The storage key is `cg_exit_seen` (a timestamp), and the offer is
  suppressed for 7 days.

- [ ] **Step 1: Write the failing tests.**
  - On `/`, after 2 s, moving the mouse out through the top opens the dialog, and focus is inside it.
  - Esc closes it.
  - Reloading and leaving again doesn't reopen it.
  - On `/contact` it never opens.
  - Submitting saves an `audit` lead.
- [ ] **Step 2:** Run the tests and expect a FAIL.
- [ ] **Step 3:** Implement with a native `<dialog>` and an enter animation (scale 0.96 → 1, 200 ms
  ease-out).
- [ ] **Step 4:** Run the tests and expect PASS.
- [ ] **Step 5:** Commit with the message `feat: exit-intent audit offer`.

### Task 9: Quality pass and handover

**Files:**
- Modify: whatever the checks flag.
- Create: `README.md` (setup, env, create-admin, deploy notes) and `deploy/nginx.conf.example`.

- [ ] **Step 1:** Run `node scripts/shots.js` on every page. There should be no overflow at any width,
  and you should look at each shot.
- [ ] **Step 2:** Do a `break-ui` pass on the admin lead list and detail and on the forms, using long,
  Bangla and empty values. Fix what breaks.
- [ ] **Step 3:** Run the `review-animations` and `21st-ui-review` checklists on the home and service
  pages. Fix the findings.
- [ ] **Step 4:** Run `npm test`, which should pass in full. Then do a manual end-to-end run: submit
  each lead type, see it in `/admin`, and export the CSV.
- [ ] **Step 5:** Commit with the message `chore: QA fixes, README, deploy example`.
