# "Hire your best employee": build brief and prompt

The Click & Grow homepage, told as a job hire. The website is the candidate. The visitor is the boss. It gets hired.

Audience: small and mid-size business owners in North America, the UK and Europe, the Gulf and Australia, then English-speaking owners in Bangladesh. Tone: dry, cheeky office humour, like artattackk.com. The jokes land on bad candidates, never on the visitor.

The line the page is built on: **"Your website talks to more customers than you do."** Most owners will nod at it, because it's true.

## 1. Scenes and copy

Copy below is final draft, already humanized. Keep it short; each section is one picture and a few lines. No em or en dashes.

### Hero: the interview
- **Picture:** an office. On one side of a desk, the owner's empty chair. On the other, the candidate: a friendly laptop whose screen is a smiling website, wearing a "HELLO, I'M YOUR WEBSITE" name badge. A CV sits on the desk.
- **Beats (clock-driven, about 4 s, plays once, Replay button):**
  1. The laptop slides into the chair, straightens its tie, blinks.
  2. The CV prints line by line, a typewriter tick per line:
     - "Availability: 24/7, holidays included."
     - "Languages: all of them."
     - "Lunch breaks: none."
     - "Previous job: your nephew's free template (let go)."
     - "Salary: agreed upfront. Happy to be paid in parts."
  3. A red **HIRED** stamp slams onto the CV; the desk shakes; the laptop does a small happy bounce and its screen shows a tiny "Thank you!".
- **Idle life after the story:** the laptop blinks every few seconds, a coffee mug steams, a wall clock ticks. All pause off screen.
- **Interaction:** hovering the CV on desktop tilts the laptop's eyes toward the pointer. Clicking the laptop makes it wave.
- **Copy:**
  - Eyebrow: "Now hiring: one website"
  - H1: "Your website talks to more customers than you do."
  - Sub: "So hire a good one. It works nights, speaks every language and has never asked for a raise."
  - Buttons: "Hire mine" (form) and "Free website check-up"

### The other candidates (artattackk-style comparison)
- **Picture:** four candidate cards on a corkboard with pins. Three get a red "NEXT" stamp in turn as the section enters; ours gets a gold "HIRED" ribbon. On phones the cards are a swipeable stack (left = next).
- **Copy:**
  - "The free template. Turned up in the same outfit as 4,000 other candidates."
  - "Your nephew. Very talented. Available after exams."
  - "The big agency. Brilliant. Can start in March. Bills for the meeting about the meeting."
  - "Click & Grow. Starts this month. One quote, agreed first. Brings a logo and Google setup on day one."

### A day at work
- **Picture:** a big clock face. The hand sweeps once from 9 am round the full day as the section enters; small notes pop out at each hour.
- **Copy (notes):**
  - "9:02 am. Answered 'What are your prices?' for the 40th time. Didn't sigh once."
  - "1:15 pm. Took a booking from Dubai."
  - "11:48 pm. Sold a gift box to someone in Sydney."
  - "3:00 am. Still on page one of Google."
- **Heading:** "A day in the life of your new hire."

### The benefits package (confirmed offers only)
- **Picture:** a welcome box on the desk. The lid pops and items fly out one by one, each landing in a row with a bounce.
- **Copy:**
  - "Free logo. The company uniform."
  - "Free Google and SEO setup. Business cards that people actually find."
  - "Free support after launch. Regular check-ups."
  - "Pay in parts. Salary in instalments."
  - "Quote agreed upfront. No surprise pay rises."
- **Heading:** "The benefits package. All included."

### The job offer (services and prices)
- **Picture:** offer letters fanned out, one per service. Each slides up on entry; the price counts up in the visitor's currency.
- Services and sample prices as on concept 20 (website from $249, shop from $449, Google and SEO from $119 a month, ads from $99 a month, app from $1,190, logo free with any website, care from $29 a month, check-up free). Prices switch with a region picker (US, CA, UK, EU, AE, AU, BD).

### Works remotely
- **Picture:** the laptop's CV line "Location: wherever your customers are" grows into a world map; routes draw to New York, Toronto, London, Berlin, Dubai, Riyadh, Doha and Sydney, with live local clocks.
- **Copy:** "Works remotely. Clients in North America, the UK, Europe, the Gulf and Australia."

### First day (process)
- **Picture:** an onboarding checklist on a clipboard; each item ticks itself as the section enters.
- **Copy:** "Free check-up" / "Agree the quote" / "We build it, you click through it" / "Launch day, with free support after".
- **Heading:** "Onboarding takes four steps."

### The interview questions (FAQ)
- **Picture:** each question is the boss's speech bubble; the answer is the laptop's reply bubble with a typing indicator first (a 400 ms typing beat, then the text).
- **Questions and answers:**
  - "Will you actually bring in customers?" "I won't sell something nobody wants. I stop you losing the people who already came looking."
  - "Can you work with me if I'm abroad?" "Yes. I work remotely and take calls in your time zone."
  - "What's the free check-up?" "We look at your current site or page and tell you what's costing you customers. Free, and you don't have to hire us."
  - "Can I pay in parts?" "Yes. We agree the split before we start."
  - "Will the price go up later?" "No. The quote you agree is the quote you pay."
  - "How do I pay you?" "Card, bank transfer or PayPal. Clients in Bangladesh can also use bKash or Nagad."

### Start the hiring (form)
- **Picture:** a job application form on a clipboard. Steps: "The role" (what they need), "Start date", "Budget" (in their currency), "Your details". Progress is a paperclip sliding along the top.
- **Success:** the clipboard gets a "HIRED" stamp and the laptop runs in from the side and high-fives the cursor. "Offer sent. We'll reply with a plan and a quote. This is a preview, so nothing was sent yet."

### Final call
- **Picture:** the laptop at its new desk, name plate "Your best employee", coffee steaming.
- **Copy:** "Your new hire can start this month." Buttons: "Hire mine", "Chat on WhatsApp".

## 2. Humour rules
- Office jokes everyone gets: CVs, interviews, pay rises, Monday meetings, coffee. No local slang.
- The joke is always on bad candidates or office life, never on the visitor's business.
- One joke per line at most. If a line needs explaining, cut it.
- Keep every claim true: only the offers listed in "The benefits package". Prices, slots and timings are marked placeholders.

## 3. Motion budget
- **Most animated, still usable:** every section has one illustrated scene that plays once on entry (0.6 to 1.5 s) plus at most two cheap idle loops (blink, steam, tick). No pinned or scroll-scrubbed sections.
- Buttons, form steps and FAQ answers use short UI motion (100 to 300 ms) from `animate`.
- Loops pause off screen. Reduced motion shows every end state.

---

## 4. Paste-ready prompt

```
Build the Click & Grow homepage on the concept "Hire your best employee". Read docs/briefs/hire-your-best-employee.md in full first; it holds the scenes, beats and final copy. The site is a job hire: the website is the candidate, the visitor is the boss, and it gets HIRED. Audience is small business owners worldwide (North America, UK and Europe, the Gulf, Australia). Tone is dry office humour like artattackk.com, aimed at bad candidates and office life, never at the visitor.

Goal: the most graphical and animated website we can ship, with every scene drawn in inline SVG and animated with GSAP 3.12.5 + ScrollTrigger (cdnjs), while staying fast, accessible and easy to scroll. No pinned or scroll-scrubbed sections.

Use the skills in this repo in this order, and follow each one's rules:

1. ui-ux-pro-max: generate the design system for "playful agency homepage, illustrated, global small business". Keep the brand tokens (green #006A4E, yellow #FFC72C, ink #1C1A17, paper #FFFBF2) and pull its rules for forms, focus and contrast.
2. impeccable: Persuade mode, new visual world. Run context, read reference/new-work.md, new-work-world.md and craft-floor.md before editing.
3. scroll-story-animation: treat every section as a scene. Write the beat sheet for each from the brief, build SVG from coordinate helpers, one timeline per scene, a static fallback, and the data-scene-* test hooks. Run its checker at the end.
4. animation-vocabulary: name each effect you plan (pop in, squash and stretch, anticipation, follow-through) so the timings are deliberate.
5. animate and choreograph: plan every animation with their tables: ease-out entrances, nothing ease-in, staggers 30 to 80 ms and never uniform, one entrance per container, nothing blocks a click. Write choreograph's timeline for the hero, the candidate board, the clock and the benefits box.
6. apple-design and emil-design-eng: springs for the laptop's bounce and wave, press feedback on every button, no scale(0) entrances.
7. gestures: the swipeable candidate stack on phones (velocity dismissal, keyboard and button alternatives).
8. design-taste-frontend: layout discipline, equal edges, one section per screen, hover layer, copy lint, checker at 1440, 1024, 768 and 390. Override its "no scenes on service pages" rule on purpose: the illustrated scenes are the point.
9. humanizer: run every line of copy through it. Use the brief's copy as the starting draft. No em or en dashes, no "not X but Y", no one-line closers, no forced triads.
10. impeccable delight, then bolder, then overdrive on the hero only, to push personality and motion further without breaking the craft floor.
11. find-animation-opportunities, then review-animations: find remaining dead spots, then critique all motion and fix what they flag.
12. animation-performance: transform, opacity and clip-path only; loops pause off screen.
13. mobile-native, then break-ui (long business names, tiny screens, reduced motion, slow network), then verification-before-completion with Playwright at 1440x900 and 390x844: no page errors, no sideways scroll, form submits, reduced motion shows every end state.

Only use the claims in the brief's benefits list; mark prices, slots and timings as placeholders in a code comment. Build it as one self-contained HTML page first so I can preview it, then report what each skill changed.
```
