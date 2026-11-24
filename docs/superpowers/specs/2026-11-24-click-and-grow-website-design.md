# Click & Grow — Agency Website Design

Date: 2026-11-24
Status: draft, awaiting approval

## 1. Intent and why

Click & Grow is a digital agency in Dhaka. It needs a marketing website that sells the same services as
artattackk.com (a web design agency in Delhi), under its own brand, with its own colours and much more
motion. The site exists to **capture leads**: every page should turn a visitor who is curious into a
named enquiry with a phone number, and should make that easy without feeling pushy.

**Audience:** high-end, English-speaking business owners and marketing heads in Bangladesh (Dhaka
first). They judge an agency by how its own site looks and feels. A cheap-looking site loses them
before they read anything, so polish and motion are part of the pitch: the site is the agency's first
portfolio piece.

## 2. Goals, non-goals, anti-goals

**Goals**
- Look and move better than artattackk.com, and better than any agency site a Dhaka client is likely
  to compare it with.
- Present all five service groups clearly enough that a visitor finds their need in two clicks.
- Capture leads through three paths: the enquiry form, the project estimator and an exit-intent
  offer. Every lead lands in an admin inbox and triggers an email alert.
- Fast on a mid-range Android phone on 4G. Mobile is the main device.

**Non-goals (v1)**
- Blog or CMS. Art Attackk has one. Ours can come later; the structure leaves room for `/insights`.
- Bangla language version.
- Online payments or showing prices.
- One separate SEO landing page for each of the ~80 sub-services that Art Attackk runs. v1 has one
  page per service group, with each sub-service as an anchored section.

**Anti-goals** (this fails even if it works)
- Looks like a template, or like a generic "AI-made" dark agency page.
- Motion that slows people down: long intros, scroll hijacking, a loader before content, animation
  that blocks the form.
- Forms that feel like an interrogation. If the form is long, people leave.
- Fake claims presented as real. Demo projects and stats are labelled as samples until replaced.

## 3. Constraints

- **Stack:** Node.js, chosen by the client. Approach A below.
- **Contact:** phone **01732-508485** (shown as `+880 1732-508485`), office **Dhaka, Bangladesh**.
  Email, domain and SMTP account are not known yet (see section 11).
- **Content:** no real portfolio yet. Use clearly marked demo projects and photos from Unsplash. Credit
  Unsplash in one line in the footer.
- **Hosting:** the same kind of server as the client's Expo site (nginx + pm2 + MySQL). The Expo repo
  `Sazzad666/expo` is the reference implementation for auth, mailer and the admin lead manager.

## 4. Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Express + EJS server-rendered pages, Tailwind, Motion + GSAP, MySQL, Nodemailer, `/admin` | Same stack as the Expo site, so its code and deploy process carry over. Fast HTML, good SEO, cheap to host. Interactive parts (estimator) are plain JS, not React. |
| B | Next.js (React) + Framer Motion | Richest component ecosystem, but a second stack to deploy and maintain, and none of the Expo code reuses directly. |
| C | Astro static + small Express API | Fastest pages, but two moving parts and the admin still built separately. Not worth it at this size. |

The client picked **A**.

## 5. Decisions made by the client

- Colour direction: **Ink + Electric Lime**.
- Main call to action: **form first**. Buttons open the enquiry form. WhatsApp and phone are secondary
  (footer, contact page, mobile bar).
- Lead magnets: **project estimator** and **exit-intent offer**.
- Pricing: **no prices shown, quote only**.
- Content: **demo projects** with **Unsplash photos**.
- Stack: **approach A**.

## 6. Brand

### 6.1 Palette (client's choice; exact values are my call)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0B0F0C` | Page background |
| `--ink-2` | `#151B16` | Cards, raised surfaces |
| `--ink-3` | `#222A23` | Borders, dividers |
| `--cream` | `#F3F1EA` | Main text on dark; background of light sections |
| `--sage` | `#8A998C` | Secondary text (≥ 4.5:1 on `--ink`) |
| `--lime` | `#C6F432` | Primary buttons, logo sprout, key highlights. Text on lime is `--ink`. |
| `--lime-deep` | `#9BC41A` | Lime hover and press state |
| `--error` | `#FF6B5B` | Form errors |

Rhythm: mostly dark, with **two cream sections** on the homepage (the process and the testimonials)
so the page breathes and the lime doesn't tire the eye. Lime is used sparingly: buttons, the logo, one
highlighted word per headline at most.

*Note: design-taste-frontend reserves dark pages for tech sites. The client's colour choice wins here
(impeccable's "the brief wins").*

### 6.2 Type (my call)

- **Display:** *Clash Display* (Fontshare, free licence, self-hosted). Big, confident, modern.
- **Accent:** *Instrument Serif Italic* (Google Fonts), for one word per headline, for example
  "Websites that *grow*". This adds the premium, editorial touch.
- **Body and UI:** *Inter Tight* (Google Fonts). 16px base, 1.6 line height.

### 6.3 Animated logo: "the click that grows" (my call)

The mark is a **cursor arrow**, and a **sprout** grows out of its tip. Wordmark: `Click & Grow`, with the
ampersand set in Instrument Serif Italic.

Sequence on first load, about 1.1 s in total and never blocking the page:
1. The cursor drops in and lands with a small "press" (scale 1 → 0.92 → 1, 160 ms).
2. A lime ring ripples out from the tip (the click).
3. The stem draws upward (SVG stroke-dashoffset, 350 ms), and two leaves unfold with a spring.
4. The wordmark slides in from the left behind it, each word on one beat (overlap, not a sequence).

- **On hover** (desktop): the leaves do a short sway and the ring pulses once.
- **Reduced motion:** the final state is shown, with no animation.

Deliverables:
- An inline SVG for the header.
- A static SVG and PNG set: favicon, social share image, and a light and a dark version.
- A 1-colour version for documents.

## 7. Site map

| URL | Purpose |
|---|---|
| `/` | Homepage (section 8) |
| `/services` | Overview of all five groups |
| `/services/web-design` | Web design & development: corporate, landing pages, ecommerce, WordPress, Shopify, UI/UX, redesign, maintenance |
| `/services/branding` | Branding & creative: logo, identity, brochure, packaging, graphic design |
| `/services/video` | Video & motion: product videos, ads, explainers, motion graphics, social video, corporate films |
| `/services/apps` | App development: iOS, Android, Flutter, React Native, ecommerce apps |
| `/services/growth` | Digital marketing, social media & SEO: Google and Meta ads, social media management, influencers, SEO, local SEO, email, lead generation, reputation |
| `/work` | Demo case studies, filterable by service |
| `/work/:slug` | One case study (six demo projects) |
| `/about` | Story, team (demo), values, Dhaka office |
| `/estimate` | The project estimator (also opens as a full-screen overlay from any page) |
| `/contact` | Form, phone, WhatsApp, office, map |
| `/thank-you` | After any submission: what happens next, plus a conversion event |
| `/privacy` | Privacy note for the data the forms collect |
| `/admin` | Lead manager, login required |

Every service page follows one template:
- A hero with a one-line promise and an "Enquire" button.
- The sub-services as cards, each with an anchor.
- Process, relevant demo work and FAQs.
- An inline enquiry form with the service pre-selected.

## 8. Homepage, section by section

Each section is one screen tall at desktop size. Every section ends with a way to act.

1. **Header (sticky).** The animated logo, then Services (a mega-menu with the five groups), Work,
   About, Contact. On the right: the phone number as a quiet link, and a lime **"Start a project"**
   button that opens the enquiry form.
2. **Hero.**
   - Headline: "Websites and brands that make Dhaka's best businesses *grow*." (final copy written at
     build time)
   - Under it, one line of proof and two buttons: **"Start a project"** (lime) and **"Estimate my
     project"** (outline).
   - On the right: a stack of three demo project screens in device frames, which drift apart slightly
     as you scroll.
   - Entrance: the headline reveals word by word (100 ms steps), then the buttons and the device
     stack, all within 900 ms.
3. **Trust strip.** A slow marquee of demo client logos plus three numbers. Logos and numbers are
   marked as samples until replaced. The marquee pauses on hover and stops under reduced motion.
4. **Services.**
   - Five large tiles, one per group. Each has a photo, a title, and four example sub-services.
   - On hover, the photo zooms to 1.03 and a lime arrow slides in. Each tile links to its group page.
   - The whole section reveals as one beat, not tile by tile.
5. **Featured work.** Three demo case studies as big image cards. Each card shows the client type, the
   services used and one result line, for example "+42% enquiries (demo)". Link: "See all work".
6. **Why Click & Grow (cream section).** A comparison inspired by Art Attackk's "cheap vs quality"
   table, rewritten for Dhaka: Freelancer / Template agency / Click & Grow. On desktop the three
   columns fill in as you scroll. On mobile it's a tabbed card.
7. **Process.** Four steps: Discover → Design → Build → Grow. A lime line draws down the page as you
   scroll, linking the steps.
8. **Estimator teaser.** "What would your project take?" with the first estimator question inline.
   Answering it opens the full estimator with that answer kept.
9. **Testimonials (cream section).** Three demo quotes with photos and names, marked as samples.
10. **FAQ.** Six questions that answer common objections: timelines, ownership, support, process,
    what happens after enquiry, and why there are no prices.
11. **Final CTA.** A big full-width enquiry block: "Tell us what you're building." It contains the
    short form inline.
12. **Footer.** Phone, a WhatsApp link, Dhaka office, service links, social links (placeholders), the
    Unsplash credit line and the privacy link.

**Mobile:** a slim bar fixed to the bottom of the screen with **Call** and **Start a project**. It
appears after the hero and hides while the visitor is typing in a form.

## 9. Lead capture system

### 9.1 Enquiry form (the main path)

- **Fields, in order:**
  - Name.
  - Phone (Bangladesh format, `01XXXXXXXXX`; `+880` accepted).
  - Email (optional).
  - Service (select, pre-filled from the page it opened on).
  - Budget band (optional; BDT bands as a select).
  - A short message (optional).
- **Hidden fields:** source page, UTM tags, referrer and the first landing page (kept in
  `sessionStorage`).
- **Where it appears:** as a slide-in panel from any "Start a project" button, inline on service pages
  and in the final CTA, and as a full page at `/contact`.
- **Validation:**
  - Inline, next to each field, with labels always visible.
  - Each error says what to fix.
  - The submit button shows a loading state and can't be pressed twice.
- **Spam protection:** a honeypot field, a minimum time to fill in the form, and a rate limit per IP.
  No captcha, because a captcha costs conversions.
- **On success:** a redirect to `/thank-you`. It says "We'll call you within one business day from
  01732-508485", shows a WhatsApp button for anyone in a hurry, and fires the conversion event.

*Note: design-taste-frontend's house rule 9 says not to show a real phone number. That rule is for
demo pages. This is the client's real number, so it's shown.*

### 9.2 Project estimator (quote only, no price shown)

A 5-step, one-question-per-screen flow, with a progress bar and an animated move between steps
(slide plus crossfade, about 250 ms):

1. **What do you need?** Pick one or more of the five groups, shown as cards.
2. **Scope.** The question depends on step 1. For example, web: number of pages, ecommerce yes/no and
   number of products; app: platforms; marketing: channels.
3. **Features and extras.** Checkboxes: CMS, booking, payment gateway, multilingual, copywriting,
   photography, ongoing support.
4. **Timeline and budget band.** "When do you need it?" and an optional budget band.
5. **Where should we send your quote?** Name, phone and email, plus a summary of the answers.

Ending: "Your custom quote will reach you within 24 hours." The summary is saved with the lead, so
the sales call starts informed.

The full answer set is saved even if the visitor drops off at step 5, but only as an anonymous
**partial** (no contact data, so it isn't a lead). This shows the client where people stop.

### 9.3 Exit-intent offer

- **Trigger:**
  - Desktop: the pointer leaves through the top of the window.
  - Mobile: about 45 s on the page and 50% of it scrolled, then a fast scroll back up.
  - Shown at most once per visitor every 7 days (stored in `localStorage`), and never on `/contact`,
    `/estimate` or `/thank-you`, or while a form is open.
- **Offer:** "Before you go: get a free website and brand audit." It asks for name, phone and the
  visitor's current website URL, and is saved as a lead with type `audit`.
- **Look:** a centred card that scales up from 0.96 with a fade (200 ms ease-out). It closes with Esc,
  a click outside or the close button, and keyboard focus is trapped inside while it's open.

### 9.4 Where leads go

- **MySQL table `leads`:**
  - `id`, `type` (enquiry / estimate / audit), `name`, `phone`, `email`, `service`, `budget`,
    `message`, `answers` (JSON), `source_page`, `utm_*`, `referrer`, `status`, `notes`, `ip_hash`,
    `created_at`.
  - `status` is one of: new / contacted / qualified / won / lost.
  - Plus an `estimate_partials` table for anonymous drop-offs.
- **`/admin`:**
  - Login with a hashed password and a session, reusing the Expo pattern.
  - A lead list with filters by type, status, service and date, and search.
  - A detail view with the answers and notes, and a status change.
  - CSV export and a small dashboard: leads per week by source and type, plus estimator drop-off by
    step.
- **Email alert:** every new lead is emailed to the agency with all its details, through Nodemailer
  and SMTP. If SMTP isn't set up yet, the lead is still saved and the alert is skipped with a log line.
  A failed email never loses a lead.
- **Tracking hooks:** empty slots for a GA4 ID and a Meta Pixel ID in `.env`. When they're set, form
  submits fire `generate_lead` / `Lead` events.

## 10. Motion plan

- **Libraries:**
  - Motion (as used in Expo) for entrances, hovers, the panel and the estimator.
  - GSAP with ScrollTrigger only for the scroll-linked parts: the device stack drift, the process
    line and the comparison fill.
- **Rules,** from `animate`, `choreograph`, `animation-performance`, `emil-design-eng` and
  `mobile-native`:
  - Only `transform`, `opacity` and `clip-path` are animated. No layout properties.
  - One entrance per container. Hero staggers are 100–150 ms steps. UI elements (menus, the estimator,
    form errors) use no stagger and 150–250 ms durations.
  - Nothing hijacks scrolling. No smooth-scroll library. No preloader.
  - Every button has hover and press states (press: scale 0.97). Cards lift 2 px on hover. Photos zoom
    1.03 inside their frame.
  - `prefers-reduced-motion`: entrances become a plain fade, and the marquee and scroll-linked motion
    stop. The page still reads fully.
  - Touch devices get no hover-only effects, and hover styles stay inside `@media (hover: hover)`.
- **Signature moments** (one or two per page, as design-taste-frontend asks):
  - The logo sprout.
  - The hero headline reveal.
  - The process line drawing down the page.

## 11. Content and assets

- **Copy:** written in plain, confident, premium English. It is warmer and calmer than Art Attackk's
  jokey voice, because this audience values polish over punchlines. Checked with `humanizer` so it
  doesn't read as AI-written.
- **Demo projects** (six, fictional Dhaka-style businesses, each marked "Sample project"):
  - A luxury real-estate developer (website).
  - A fashion label (Shopify store).
  - A private hospital (website and SEO).
  - A restaurant group (branding and social).
  - A fintech startup (app).
  - An interior design studio (branding and video).
- **Photos:** Unsplash, picked per project and service (offices, teams, devices, products, Dhaka-like
  city scenes). Downloaded, converted to WebP/AVIF in several sizes, served locally, and credited in
  the footer.
- **SEO:**
  - A unique title and description on every page, Open Graph images, and LocalBusiness schema with
    the Dhaka address and phone.
  - `sitemap.xml`, `robots.txt` and clean URLs.

## 12. Quality checks before handover

- **Responsive** at 390, 768, 1024 and 1440 px, with no horizontal scroll.
- **Accessibility:** text contrast at least 4.5:1, visible focus states, labelled fields, the form fully
  usable by keyboard, and the modal traps focus.
- **Performance:** Lighthouse mobile 90+ for performance and accessibility. LCP under 2.5 s, CLS under
  0.1.
- **`break-ui`** on the lead cards in the admin and on the forms, using long names, Bangla text and
  odd phone formats.
- **`21st-ui-review`** or `impeccable audit` on every page, then `review-animations` on the motion.
- **End-to-end test:** submit each lead type, see it in `/admin`, and confirm the email alert was sent.

## 13. Left to the builder

- Exact copy, within the voice and structure above.
- The choice of photos and the six demo project details.
- Exact animation curves and durations, within section 10.
- Folder structure and how much Expo code is copied versus rewritten.
- The budget band values (sensible BDT ranges, for example under 50k / 50k–1.5 lakh / 1.5–5 lakh / 5
  lakh+).


## 13a. Builder's questions settled by me (marked as my calls)

- **Replacing demo content (my call):** projects, testimonials, client logos, stats and team live in
  data files in the repo (`content/*.json`) plus `public/img/`. A developer swaps them, with no admin
  editor in v1. This fits the "no CMS" non-goal. Every demo item has `"demo": true`, and the page shows
  a small "Sample" tag on it until the flag is removed.
- **Estimator vs enquiry promises (my call):**
  - In the estimator, phone is required and email is required too, because it promises a written
    quote. In the enquiry and audit forms, email stays optional.
  - Sales writes each quote by hand. There's no "send quote" feature in the admin in v1.
  - v1 sends no automatic emails to visitors, only the agency alert. This avoids needing a verified
    sending domain before launch. A visitor confirmation email is a v1.1 item once the domain and DKIM
    exist.
  - `/thank-you` copy depends on the lead type:
    - Enquiry: "we'll call you within one business day".
    - Estimate: "your quote by email within 24 hours, and we may call to clarify".
    - Audit: "your audit within 2 business days".
- **Admin accounts (my call):** an `admins` table that allows several staff logins, created with a
  `create-admin` script as in Expo. Every account sees and edits everything, with no roles or lead
  assignment in v1. Status changes and notes record which admin made them.
- **Order of work (my call):** build lead capture first, because it's the point of the site:
  1. Core pages, the enquiry form, the admin and alerts.
  2. The estimator and exit-intent.
  3. The full motion pass and the logo animation polish.
  4. QA.

  All of it ships as one launch unless the client asks for an earlier soft launch.

## 14. Open items for the client (needed before launch, not before building)

- Business email address and domain name.
- An SMTP account for lead alerts (for example Gmail with an app password, or Zoho).
- A WhatsApp number, if it isn't 01732-508485.
- Social media links.
- Real logos, projects, testimonials and numbers to replace the demos.
- **Name check:** "Click & Grow" is also the name of a well-known Estonian smart-garden brand
  (clickandgrow.com). This may affect the domain name, Google ranking for the brand name, and
  trademark use. The client should decide whether to keep the name as it is or add a qualifier, for
  example "Click & Grow Digital".
