# Click & Grow homepage: "The Big Shadow" (global)

## Intent

One homepage that any small or mid-size business owner, in any country, reads and thinks "well, that's true", then wants what we sell. Built on what every owner wants (to look as big and trustworthy as the business they're building) and on a fear every owner shares (being judged and skipped online before they get a chance). Cheeky and confident like artattackk.com. Heavy on visuals and animation, without holding the visitor's scroll.

## Goals

- The "that's true" moment in the first screen, and again with evidence in the second.
- Desire before proof: the hero sells the aspiration, the next section backs it with a real research finding.
- Global by default: no Bangladesh-only references, prices in the visitor's currency, a visible sense that we work worldwide.
- Lead capture at every step: free check-up, quote form, WhatsApp.

## Non-goals and anti-goals

- No pinned or scroll-scrubbed sections. Animation plays on load, on click, or once (under 0.8 s) as a section enters.
- No Dhaka street, rickshaw, CNG, tea stall or Bangla phrases in the main copy.
- No claims the owner hasn't confirmed (list below). No made-up client results or testimonials.

## Approaches considered

| Approach | Trade-off | Decision |
|---|---|---|
| The Big Shadow (aspiration) | Most hopeful and visual; needs a fact to back it | **Hero** |
| Judged in 0.05 seconds (fear, research-backed) | Strongest "that's true"; colder on its own | **Second section** |
| Business Class (upgrade, flight map) | Global and fun; the airline metaphor is a step removed from websites | Map idea reused in the "worldwide" section |

## Page, top to bottom

1. **Hero: The Big Shadow.** A small shop at night against a wall. On load a spotlight swings on, and the shop's shadow on the wall grows in three beats: shop, mid-rise, skyscraper with a glowing logo. Headline: *"Customers can't see how big you are. They only see your website."* CTAs: "Make me look big" (form) and "Free website check-up". A small "Replay" control replays the shadow. Clock-driven, once, about 3 s.
2. **You get 0.05 seconds.** A stopwatch flashes 0.05 s while an eye-trail sweeps a dated website; a stamp lands "Nope." The visitor presses "Show me with Click & Grow": the same business redraws as a modern site, the eye-trail settles on the Buy button, and the stamp flips to "Take my money." Source line: Lindgaard et al., 2006, *Behaviour & Information Technology*.
3. **Things every owner knows (the "that's true" cards).** Three or four short truths that flip in as the section enters, e.g. "People look you up before they pay you." "Nobody trusts a 'Coming soon' page." "'DM for price' loses the impatient ones." Each card's back names the fix.
4. **Cheap vs. good (artattackk-style).** Three columns with cheeky lines: the free template, the big agency, Click & Grow. Bad lines get struck through as the section enters.
5. **Services and prices** in the visitor's currency (region picker in the header, guessed from the time zone).
6. **We work worldwide.** A world map; arcs draw once to the countries we deliver to, with small live clocks for each.
7. **Everything included.** The confirmed offers: free website check-up, free logo, free Google and SEO setup, free support after launch, pay in parts, quote agreed upfront.
8. **How it works.** Four steps: free check-up, quote agreed, build, launch.
9. **FAQ.**
10. **Quote form.** Multi-step, pre-filled from any button that names a service. Later wired to the Express site's `/api/leads`.
11. **Final CTA.** The shadow returns: *"Ready to cast a bigger shadow?"*

## Constraints and how it's built

- Single HTML page first for preview (my call), then ported to the Express site.
- GSAP 3.12.5 + ScrollTrigger (only for one-time entrances). Inline SVG scenes.
- Skills: `scroll-story-animation` (scene contract, reduced-motion fallback, test hooks, checker), `animate` / `choreograph` (timings), `humanizer` (copy, no dashes), `ui-ux-pro-max` (form and accessibility), `verification-before-completion` (Playwright at 1440 and 390).
- Reduced motion: every scene shows its end state; nothing loops.
- Brand tokens kept: green #006A4E, yellow #FFC72C, ink #1C1A17, paper #FFFBF2; a night palette for the hero.

## Claims

Confirmed: free website check-up, free logo with every website, free Google and SEO setup, free support after launch, pay in parts, quote agreed upfront, limited project slots each month.
Placeholders until confirmed: slot numbers, prices, support length, reply time.

Decided by the owner (2026-11-25): design approved. Map countries: USA and Canada, UK and Europe, UAE and the Gulf, Australia. Bangladesh payment apps (bKash, Nagad) appear only in the FAQ; everywhere else says card, bank transfer and PayPal.

## Left to the builder

Exact illustration details, copy polish within the tone, animation timings within the skills' tables, the region-to-currency table.
