# Click & Grow homepage: "Open Sign" with Dave

## Intent

Click & Grow is a web design, development and marketing agency based in Dhaka that wants clients anywhere in the world. The homepage has one job: make a business owner feel "my business is invisible online, and these people can switch the lights on", then get them to send a brief.

The story is told by animation, not paragraphs. A dark street at night, a shop with its OPEN sign off. One click and the sign buzzes on, the street lights up, and customers start walking in. Dave, an ordinary customer, is the running character who shows what a bad website costs and what a good one feels like.

## Goals

- Heavy, story-driven animation: the page is one continuous scene that changes as you scroll.
- Little text: about 180 words of visible copy outside the form and nav. Every section gets one headline and at most one short line.
- Copy that sounds like a person: short, warm, a bit cheeky. No "solutions", no "leverage".
- Relatable to any business owner in any country.
- Works on a phone, with touch.
- Readable with motion turned off (`prefers-reduced-motion`): every scene shows its finished state.

## Non-goals

- Real form submission, CMS, analytics.
- Real case studies or real client numbers. Any figure shown is clearly a sample.

## Anti-goals (a failure even if it "works")

- Animation that blocks reading or clicking, or a scroll that feels hijacked.
- A blank or half-built page if the animation library fails to load.
- Walls of text, jargon, or stock-photo look.
- Desktop-only magic that breaks on phones.

## Constraints

- One self-contained HTML prototype, published as a private preview page.
- Scripts only from cdnjs. Fonts from Google Fonts.
- All illustration is inline SVG drawn for this page.

## Approaches

| Approach | Trade-off | Verdict |
|---|---|---|
| **A. SVG scene + GSAP ScrollTrigger timelines** | Precise scroll scrubbing, pinning and choreography; SVG stays crisp and accessible; one CDN script | **Chosen** |
| B. Canvas / WebGL scene | Richest effects, but heavy, hard to make accessible, hard to edit copy inside | Rejected |
| C. Lottie / Rive animations | Great character motion, but needs assets authored in another tool; can't be produced here | Rejected for the prototype; Rive is the right tool for Dave in production |

## Storyboard

1. **Hero, "Lights on"** (plays on load, then scroll-scrubbed): night street, closed shop. A cursor flies in and clicks the neon OPEN sign. The sign buzzes, flickers and glows; warm light spills onto the pavement; the shop window lights up. Dave walks in from the left and stops at the window.
   - Headline: "Your business is open. Does the internet know?"
   - Button: "Turn my sign on"
2. **Dave's bad day** (pinned, scrubbed): Dave on his phone trying a bad website: endless spinner, tiny buttons, a pop-up, rage-clicks, red face. A small counter of lost customers ticks up. Then a cut: the same Dave on a Click & Grow site, two taps, "Order placed", Dave smiles.
   - "Meet Dave. Dave wants to give you money. Your website won't let him."
3. **Build the shop** (services, pinned, scrubbed): the shopfront assembles piece by piece. Website = the shopfront and window. Search (SEO) = a signpost pointing to you. Ads = a rooftop billboard. Branding = the awning and painted sign. Each lands with a one-line label. Hovering a label highlights its part.
4. **The crowd** (scrubbed): the street fills up, from a passer-by to a queue. A footfall counter climbs (labelled as a sample).
5. **Process as wiring** (scrubbed): four neon words, Plan, Design, Build, Grow, light up one after another along a wire.
6. **Zoom out**: the camera pulls back from one shop to a city of lit windows, then a globe dotted with lights. "Built in Dhaka. Lighting up shops anywhere."
7. **Your sign** (contact): the visitor types their business name and a neon sign renders it live. Email plus "What do you need?" Button: "Turn my sign on." Sending flickers their sign on.
8. **Footer**: a small "Open late" sign.

## Look

Night-first single look: deep navy sky, neon pink OPEN, neon green for the brand, warm window yellow, cyan accents. Flat, bold vector illustration with rounded shapes. Display: Bricolage Grotesque; neon script: Yellowtail; body: Inter.

## Motion rules (from the repo's animate and choreograph skills)

- One lead per moment; supporting motion lands on the lead's impact. The sign's glow lands with the click; the street lights follow in a quick wave.
- Scroll scenes scrub (no auto-play surprises) and never trap the user. Pins stay short: 1 to 1.5 screens.
- Idle loops (sign hum, Dave blinking) are subtle and stop under reduced motion.
- Initial hidden states are set by GSAP only, so if GSAP fails the finished scene shows.

## Left to the builder

Exact timings, Dave's poses, illustration details, and phone layouts.

## Calls made without asking (marked as such)

- GSAP + ScrollTrigger from cdnjs as the animation engine.
- Prototype lives as a published preview page; the code can be committed later if wanted.
- The "lost customers" counter and footfall counter are labelled as samples.
