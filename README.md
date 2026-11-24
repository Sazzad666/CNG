# Click & Grow — agency website

Marketing site for Click & Grow, a digital agency in Dhaka. It is built to turn visitors into leads, through three paths: an enquiry form, a 5-step project estimator and an exit-intent audit offer. Every lead lands in a password-protected `/admin` inbox and triggers an email alert.

- **Stack:** Node 22, Express 4, EJS, MySQL/MariaDB, Tailwind 3, and [Motion](https://motion.dev) for animation. There is no front-end build step besides the CSS.
- **Design spec:** `docs/superpowers/specs/2026-11-24-click-and-grow-website-design.md`
- **Build plan:** `docs/superpowers/plans/2026-11-24-click-and-grow-website.md`

## Run it locally

```bash
npm install
cp .env.example .env              # then set DB_* and SESSION_SECRET
npm run db:init                   # creates the tables (safe to re-run)
npm run create-admin -- sadia "Sadia Islam" sadia@example.com   # asks for a password
npm run build:css                 # after changing any view or CSS
npm run dev                       # http://localhost:3000
```

Tests use a separate database called `cng_test`. Create it, run `DB_NAME=cng_test npm run db:init`, then run `npm test`. The browser tests use Playwright's Chromium.

## Where things live

| What | Where |
|---|---|
| Brand facts (phone, email, socials, budget bands) | `config/site.js` |
| Services, projects, testimonials, FAQs, team | `content/*.json` |
| Photos | `content/photos.json` → `node scripts/photos.js` → `public/img/` and `content/credits.json` |
| Pages | `views/` (homepage sections are in `views/home/`) |
| Lead validation, storage, alerts and endpoint | `src/leads/` |
| Admin inbox | `src/admin/`, `views/admin/` |
| Motion | `public/js/site.js` (page), `logo.js` (logo), `estimator.js`, `exit-intent.js` |
| Logo files | `public/brand/` (`logo-dark.svg`, `logo-light.svg`, `logo-mono.svg`, `favicon.svg`, `og.png`) |

## Replacing the demo content

Every demo project, testimonial, client name and team member has `"demo": true` and shows a **Sample** tag. To go live with real content:

1. Edit the entries in `content/*.json` and remove `"demo": true`.
2. For real photos, put WebP files in `public/img/` named `<name>-640.webp`, `<name>-1024.webp` and `<name>-1600.webp`, and add each one to `content/credits.json`.
3. Change the email address and social links in `config/site.js`.
4. Remove the "Sample" notes in `views/home/trust.ejs`, `views/home/testimonials.ejs` and the footer.

## Environment

See `.env.example`. In production you must set:

- `NODE_ENV=production`
- `BASE_URL=https://…`
- `TRUST_PROXY=1`
- a 64-character `SESSION_SECRET`
- the `DB_*` values

Lead alert emails need `SMTP_*`, `MAIL_FROM` and `LEAD_ALERT_TO`. Without them, leads are still saved and each one is logged as "alert not sent". `GA4_ID` and `META_PIXEL_ID` are optional. When set, every lead fires `generate_lead` and `Lead` events.

## Deploying (same setup as the Expo site)

1. Clone the repo on the server, run `npm ci --omit=dev`, create `.env`, then run `npm run db:init` and `npm run create-admin`.
2. Run the app with pm2: `pm2 start server.js --name click-and-grow`, using `HOST=127.0.0.1` and its own `PORT`.
3. Put nginx in front of it. `deploy/nginx.conf.example` is a starting point.
4. Health check: `GET /healthz` returns `{"ok":true}` when the database is reachable.
