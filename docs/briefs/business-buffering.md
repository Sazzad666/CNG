# Business Buffering: build brief

Concept for the Click & Grow website. Use this file as the instruction set for whoever builds it (you, me, or another Claude session). The paste-ready prompt is at the bottom.

## 1. The idea in one line

When business is slow, it's buffering, and the slow connection is your online presence. Click & Grow fixes the connection.

- **Audience:** mainly small and mid-size business owners abroad (UK, US, UAE, Europe), then English-speaking owners in Bangladesh. Write for the global owner first.
- **Why it works:** everyone in every country knows a stuck loading bar and hates it. It turns "business is slow" (bebsha kharap jacche) into a picture without a word of explanation, and it fits an agency that builds websites.
- **Tone:** cheeky wink, like artattackk.com. The joke is always on the loading bar, Facebook, the nephew or the big agency, never on the visitor.
- **Bangladesh touch:** when the country picker is on Bangladesh, show one small extra line, "Bebsha kharap jacche?". Everyone else sees English only.

## 2. Skills to use, and what each one is for

Run them in this order. Each line says what to take from the skill and what to ignore.

| Order | Skill | Use it for | Notes |
|---|---|---|---|
| 1 | `ui-ux-pro-max` | Generate the design system first: `search.py "agency web design global small business playful conversion" --design-system`. Then `--domain landing` and `--domain ux` for form, progress and error-state rules. | Keep the existing brand tokens (section 3); use its output for the rules, not a new palette. |
| 2 | `impeccable` | Mode is **Persuade**. Run `context`, then read `reference/new-work.md` and `reference/new-work-world.md` (this is a new visual world), and `reference/craft-floor.md` right before editing. Later: `audit`, then `polish`. | Its rule "the brief wins" settles the clash with design-taste below. |
| 3 | `design-taste-frontend` | Layout discipline: one section per screen at 1440x900, equal left and right edges, hero alone on screen one, hover micro-animations, real icons, copy lint. Run its checker at 1440, 1024, 768 and 390. | **Override on purpose:** it says agency (service) pages get photographs and no scenes. This brief pins heavy animation, so the illustrated UI scenes stay. Keep everything else. |
| 4 | `animate` | Every single animation: the 7-step sequence, its easing and duration tables, Never Ship list. | Use `--ease-out: cubic-bezier(.23,1,.32,1)` (already in the site) and `--ease-in-out: cubic-bezier(.77,0,.175,1)`. No `ease-in` on UI. |
| 5 | `choreograph` | The hero fix moment, the error-dialog pile, the three-lane race, the "installing updates" list. Write its 3-part output (timeline, what stays still, feel check) for each before coding. | Stagger 30 to 80 ms and never uniform: vary by importance. One entrance per container. |
| 6 | `animation-performance` | Animate `transform`, `opacity`, `clip-path` only. One ScrollTrigger timeline per pinned section. Pause loops off screen. | Never `transition: all`. |
| 7 | `gestures` | The before/after drag slider and the Tinder-style swipe (if kept). | Track the finger 1:1, keyboard and button alternatives. |
| 8 | `humanizer` | Every line of copy. No em or en dashes, no "not X but Y", no one-line dramatic closers, no forced triads, no stock AI words. | Read the copy aloud. If it sounds like an ad, rewrite it. |
| 9 | `mobile-native` | 100dvh hero, 16px inputs, no tap flash, sticky bottom CTA bar, safe areas. | Phone is where most owners will see it. |
| 10 | `break-ui` | Long business names, 0% and 100% speed-test scores, Arabic or Bangla names, slow network. | Fix what breaks before launch. |
| 11 | `verification-before-completion` | Playwright at 1440 and 390: no page errors, no sideways scroll, every animation reaches its end state, reduced-motion version reads fine. | Evidence before saying done. |

Optional: `emil-design-eng` for button press and dialog details; `find-animation-opportunities` after the build to catch dead spots.

## 3. Visual world

- **Brand tokens (keep):** paper `#FFFBF2`, ink `#1C1A17`, green `#006A4E` / `#0E8A62`, green-lite `#D7F2E4`, yellow `#FFC72C`, red `#E8283F`, pink `#FF4F8B`, teal `#13A8A0`.
- **Two states drive the whole page:**
  - **Stuck** (before): dark ink screen `#141311`, red and amber warning accents, a grey spinner, flickering status text. Feels like a frozen video player at night.
  - **Fast** (after): bright paper, brand green progress, yellow highlights, crisp checkmarks.
  - The hero starts in Stuck and flips to Fast. The rest of the page lives in Fast and uses small Stuck moments (error dialogs, the dial-up lane) as jokes.
- **Fonts:** keep Baloo 2 (display) and Archivo (body). Add one monospace for status lines and fake system text: JetBrains Mono or IBM Plex Mono, 500 weight.
- **UI language as decoration:** browser windows, progress bars, spinners, error dialogs, toasts, cursors, install wizards. Draw them in brand style (rounded, thick ink outline, 4px hard shadow like the current site), not as copies of Windows or macOS.
- **Flags:** CSS shapes, no emoji (ui-ux-pro-max rule).

## 4. Section by section, with motion

Library: GSAP 3.12.5 + ScrollTrigger from cdnjs. All durations below are starting values; adjust them in the browser.

### 4.1 Hero: "Business slow? It's buffering."

Layout: copy left, a big browser window right (on phone: window on top, copy under it). Browser address bar reads `yourbusiness.com`.

- **Copy:**
  - Eyebrow: "Websites, shops and Google for small businesses"
  - H1: "Business slow? It's buffering."
  - Sub: "Your website is the slow connection. We fix it."
  - CTAs: "Fix my connection" (primary), "Free speed test" (secondary)
  - Under the CTAs: "Free website check-up for every business. 2 of 6 project slots left in November." (numbers from the `SLOTS` constant)
  - BD only: "Bebsha kharap jacche?"
- **On load (Stuck):**
  1. Window drops in: y 24 to 0, opacity 0 to 1, 600 ms, ease-out.
  2. Spinner turns: 1 s per turn, linear, infinite.
  3. Bar crawls 0 to 12% over 2.4 s with `power4.out`, so it visibly stalls.
  4. Then it slips back 12% to 11% and creeps to 12% again. Repeat every 4 s. This is the joke; keep it subtle.
  5. ETA flickers: "2 min" to "3 hours" to "forever".
  6. Status line swaps every 2.2 s (old line slides up and fades, new line slides in, 300 ms):
     "Waiting for customers…", "Posting on Facebook again…", "Boosting post… $40 gone…", "Asking your nephew to fix the website…", "Refreshing…", "Still 12%."
  7. A cursor inside the window clicks the refresh icon twice, fast (rage-click ripple), every 6 s.
- **The fix (on "Fix my connection" click, or automatically when the visitor scrolls 25% past the hero, so everyone sees it):**
  1. Button press: scale .97, 100 ms.
  2. Bar fills 12% to 100% in 900 ms, `expo.out`.
  3. Spinner becomes a check: stroke draw, 350 ms.
  4. The page flips from Stuck to Fast: a paper-coloured circle grows from the button with `clip-path`, 700 ms, ease-in-out.
  5. Order toasts pop in from the window edges with varied stagger (60, 110, 90, 140 ms): "New order · London", "New booking · Dubai", "New order · New York", "New enquiry · Dhaka". Scale .95 to 1 plus opacity, 250 ms.
  6. Counter "Orders today" counts 0 to 37, 1.2 s.
  7. Status line settles on "Connected. Customers loading fast."
- **Reduced motion:** show the Fast state straight away, no circle wipe, toasts static.

### 4.2 The Business Speed Test (lead capture 1)

- A speedometer gauge, five one-tap questions, one at a time:
  1. "Do you show up when people search Google for what you sell?"
  2. "Does your website open in under 3 seconds on a phone?"
  3. "Can a customer buy or book without messaging you?"
  4. "Do you have a website at all, outside Facebook or Instagram?"
  5. "Have you updated it in the last year?"
- Each answer nudges the needle (spring, small overshoot, bounce 0.2). Questions slide horizontally, 250 ms.
- Result: needle swings to the score with a wobble. "Your business is running at 34%." Two biggest leaks listed under it.
- CTA: "Send me the full report" asks for WhatsApp number or email (this is the lead). The score and leaks go into the main form's hidden fields.
- A progress bar on top of the quiz that never stalls. The contrast with the hero is the point.

### 4.3 "Errors your customers see" (pinned scroll)

- Error dialogs pile onto the screen as you scroll, each with a short shake on arrival (x ±6 px, 3 cycles, 400 ms):
  - "404: Business not found." Fix: Google and SEO setup.
  - "Connection timed out. This site took 9 seconds." Fix: a fast website.
  - "Payment failed. No way to pay here." Fix: an online shop.
  - "Certificate expired. This site looks… abandoned." Fix: a redesign.
- Each dialog has a "Fix it" button. Click flips the dialog to its fix card (rotateY 180°, 500 ms, ease-in-out). On phone, the pile becomes a vertical stack.

### 4.4 Three ways to fix the connection (the artattackk comparison)

- Three lanes race on scroll (progress bars with a vehicle or packet riding each):
  - **Your cousin: dial-up.** Crawls, stops, a little "connecting…" waveform. "Cheap. Fits nobody. Will be busy at his exams."
  - **Big agency: fibre, priced like a satellite.** Fast, but a taxi meter beside it keeps climbing. "Fast. Then the invoice arrives."
  - **Click & Grow.** Fast, and a padlock closes on the price. "Fast. The quote you agree is the quote you pay."
- Can be the Tinder swipe instead if that test well. Keep one, not both.

### 4.5 Upgrade included (the confirmed offers)

- An "Installing updates" panel. Each offer installs with its own small bar, then a check. Stagger by importance, not uniform:
  - Free logo with every website
  - Free Google and SEO setup
  - Free support after launch
  - Pay in parts
  - Quote agreed upfront
- Last line: "All updates installed. No restart needed."

### 4.6 Before 12%, after 100% (the work)

- Before/after drag slider per project, with a stopwatch on each side. Drag with finger or mouse; arrow keys move it 5% per press.
- Projects must be real clients, or carry a visible "Demo" label. Load-time numbers only if measured.

### 4.7 The install wizard (process)

- Scroll-scrubbed wizard: Next, Next, Next, Finish.
  1. Free check-up
  2. Quote agreed upfront
  3. We build it (7 to 21 days)
  4. Launch, with free support after
- Each step's bar fills as you scroll through it.

### 4.8 Troubleshooting (FAQ)

- Accordions, CSS transitions, no stagger (high-frequency UI).
- Keep the existing answers: pay in parts, what's in the free check-up, bKash, working abroad, timelines.

### 4.9 "Restart your business" (main form, lead capture 2)

- The existing 5-step form, re-skinned as a restart dialog. Its progress bar fills smoothly and never stalls.
- Pre-filled from the speed test (score, leaks) and from any "Fix it" or check-up click.
- Submit: "Restarting…" for 600 ms, then "Business restarted. We'll message you on WhatsApp."
- Inline errors plus a focusable error summary (ui-ux-pro-max).

### 4.10 Footer

- "Business still slow? Call 01732-508485. We pick up faster than your website loads."
- A small spinner that turns into a smiley on hover.

## 5. Motion rules for the whole site

- Transform, opacity and clip-path only. No animating width, height, top or left.
- Easing: entrances ease-out `cubic-bezier(.23,1,.32,1)`, on-screen moves `cubic-bezier(.77,0,.175,1)`, constant motion (spinner, marquee) linear. Never ease-in.
- UI feedback 100 to 300 ms. Story moments can run longer.
- Staggers 30 to 80 ms, varied by importance.
- Hover motion only inside `@media (hover:hover) and (pointer:fine)`.
- `prefers-reduced-motion`: every section shows its end state; loops stop; nothing is hidden.
- Loops pause when off screen (IntersectionObserver).
- If GSAP fails to load, the page still reads fully (add a `no-motion` class like concept 15).

## 6. Copy rules

- Humanizer rules on every line. No em or en dashes anywhere in visible copy.
- 60 to 80 words a screen at most outside the form.
- Cheeky lines aim at the bar, Facebook, the nephew, big agencies. Never at the visitor.
- Write for a global owner: dollars in jokes ("$40 gone"), cities from several countries, no Dhaka-only references outside the BD line.

## 7. Claims: what we can and can't say

Confirmed by the owner, use freely:
- Free website check-up
- Free logo with every website
- Free Google and SEO setup
- Free support after launch
- Pay in parts
- Quote agreed upfront ("the quote you agree is the quote you pay")
- Limited project slots each month

Placeholders, confirm before launch:
- `SLOTS` numbers (currently 6 a month, 4 taken)
- How long free support lasts
- WhatsApp reply time
- Any client results, load times or order counts on real projects

Never say: money-back guarantee, free domain or hosting, free ads, rankings guaranteed.

## 8. Done means

- Playwright at 1440x900 and 390x844: zero page errors, no sideways scroll, the hero fix reaches 100%, speed test returns a score, every form path submits.
- Reduced-motion screenshot of every section reads complete.
- design-taste checker passes at 1440, 1024, 768, 390 (apart from the deliberate scenes override).
- impeccable `audit` has no high-severity findings.
- Lighthouse performance 85+ on mobile.

---

## 9. Paste-ready prompt

```
Build the Click & Grow website on the "Business Buffering" concept. Read docs/briefs/business-buffering.md in full first; it is the spec.

Concept: when business is slow, it's buffering, and the slow connection is the owner's online presence. Click & Grow fixes the connection. Audience is mainly small business owners abroad (UK, US, UAE, Europe), then English-speaking owners in Bangladesh. Tone is a cheeky wink like artattackk.com, aimed at the loading bar, Facebook and bad agencies, never at the visitor.

I want heavy, polished animation and a page that converts. Use the skills in this order and follow their rules:
1. ui-ux-pro-max: generate the design system and pull the landing and UX rules for forms, progress and error states.
2. impeccable: Persuade mode, new visual world; read craft-floor.md before editing; finish with audit and polish.
3. design-taste-frontend: one section per screen, equal edges, hover layer, copy lint, checker at 1440/1024/768/390. Override its "no scenes on service pages" rule on purpose: the illustrated UI scenes in the brief stay.
4. animate and choreograph: plan every animation with their sequences and tables before writing it. Write choreograph's timeline for the hero fix, the error pile, the three-lane race and the updates list.
5. animation-performance: transform, opacity and clip-path only; pause loops off screen.
6. gestures: the before/after slider.
7. humanizer: all copy. No em or en dashes.
8. mobile-native, then break-ui, then verification-before-completion with Playwright at 1440 and 390.

Hero: a browser window at yourbusiness.com stuck at 12% with a spinner, a creeping bar that slips back, rotating status lines ("Boosting post… $40 gone…", "Asking your nephew to fix the website…"). H1 "Business slow? It's buffering." Sub "Your website is the slow connection. We fix it." Clicking "Fix my connection" (or scrolling past the hero) fills the bar to 100%, flips the page from the dark Stuck state to the bright Fast state with a clip-path wipe, and pops order toasts from London, Dubai, New York and Dhaka.

Then build sections 4.2 to 4.10 from the brief: Business Speed Test with a gauge (lead capture), error dialogs that pile up and flip to fixes, three lanes racing (cousin on dial-up, big agency with a taxi meter, Click & Grow with a locked price), "Installing updates" for the offers, before/after slider, install-wizard process, troubleshooting FAQ, and the "Restart your business" form pre-filled from the speed test.

Keep the current brand tokens, Baloo 2 and Archivo, and add one monospace for status text. Use GSAP 3.12.5 and ScrollTrigger from cdnjs. Respect prefers-reduced-motion everywhere. Only use the claims listed as confirmed in section 7 of the brief; leave placeholders marked for the rest.

Build it as a single HTML page first so I can preview it, then port it into the Express site.
```
