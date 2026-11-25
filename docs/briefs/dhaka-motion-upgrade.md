# Dhaka page: motion upgrade

Audit of `docs/concepts/13-dhaka-slides/index.html` (the other session's commit 6794a1d), done with the `find-animation-opportunities` skill, plus the build prompt.

Tokens already in the page: `--ease-out: cubic-bezier(.23,1,.32,1)`. Added for this work: `--ease-in-out: cubic-bezier(.77,0,.175,1)`. GSAP 3.12.5 + ScrollTrigger are already loaded.

## 1. Opportunities (gated)

| # | Location | Today | Purpose | Frequency | Suggested motion |
|---|---|---|---|---|---|
| 1 | Hero copy, `h1#t-hero`, `.lede`, `.hero-cta`, `.trust` | Text appears static while only the drawing moves. The first screen feels half-alive. | Preventing a jarring change, delight | Once per visit | Words of the h1 rise from `yPercent:110` inside an `overflow:hidden` mask, 650 ms `expo.out`, word stagger 40 ms. Lede at +200 ms, buttons at +300 ms, trust chips at +380 ms (y 14, 450 ms). The yellow highlight under "customers" wipes in (`background-size 0→100%`, 500 ms ease-out) at the exact moment the shutter finishes rising, so the two read as one beat. |
| 2 | Hero street, `#heroArt` SVG | After the shutter opens, the street freezes. The page's promise ("takes orders while you sleep") is never shown. | Explanation | Once per visit, then ambient | Order bubbles ("New order ৳1,200", "bKash paid ৳850", "Booked for 6pm") pop above the laptop one at a time: scale .9→1 + y 10→0, 300 ms `back.out(1.7)`, hold 1.4 s, float up 30 px and fade 500 ms. Cycle every 4.5 s while the hero is on screen. Clouds drift (45 s and 70 s, linear), a kite sways on a rooftop (rotate ±6°, 2.4 s sine yoyo), the sign bulbs chase once after opening. Every loop pauses off screen and is off under reduced motion. |
| 3 | Hero on scroll | Only one rickshaw moves; the scene is flat. | Spatial consistency (depth) | Once per visit | Scroll parallax while the hero leaves: sun `y:+90`, back buildings `y:+50`, shop and street fixed, scrubbed 0.6. |
| 4 | Every `.sec-head` | Section headings never animate. Seven sections arrive as blocks of text. | Preventing a jarring change | Once per visit per section | Eyebrow fades in (300 ms), h2 words rise from `yPercent:110` with 35 ms stagger (600 ms `expo.out`), the side paragraph follows at +150 ms (y 12, 450 ms). Trigger at `top 82%`, once. |
| 5 | `.route-box` pins, `#stops li` | Stops toggle a class; the red pins never react when the rickshaw reaches them. | State indication | Once per visit | When each stop turns on: its pin pops 1→1.45→1 (280 ms `back.out(3)`), the stop card lifts y −4 with a yellow flash on its number badge (200 ms). Fires once per stop. |
| 6 | Packs `.amt` prices | Prices are static text. | Delight (first view of pricing) | Once per visit | Count up from 0 to the price in the active currency, 900 ms `power2.out`, staggered 120 ms between packs. Plates drop with `back.out(1.4)` instead of a plain fade. Final text is always the exact `data-bdt`/`data-usd` value. |
| 7 | FAQ `details` | Answers snap open and closed. | State indication | Occasional | Open: answer height 0→auto + opacity, 260 ms `--ease-out`. Close: 200 ms, then remove `open`. |
| 8 | Final CTA `.final` | The last screen is a flat yellow block. | Delight (end of page) | Once per visit | A second bunting line drops in from the centre outwards (yPercent −120→0, rotate ±12→0, `back.out(2)`, 12 ms stagger), then the h2 words rise. |

## 2. Rejected

- **Pointer-tracking tilt on the hero art.** Rejected on function: tilt fights the click-the-shutter interaction and design-taste forbids tilt.
- **Marquee for the client logo wall.** Rejected on purpose: moving placeholder logos draws attention to the fact there are none yet.
- **Scroll progress bar with a rickshaw on top.** Rejected on frequency: it moves on every scroll tick for the whole visit and competes with the route section.
- **More hover motion on service cards.** Rejected on frequency: hovered tens of times a visit; the existing 2 px lift is right.
- **Endless bunting sway.** Rejected on function: a constant loop beside reading content pulls the eye. It sways once on entry instead.

## 3. Verdict

The page has good bones and correct restraint in its controls (buttons, slideshow, form). What it lacks is life in the two places a first-time visitor judges it: the hero after the shutter opens, and the headings as they scroll. Highest leverage: #2, the order bubbles, because it animates the actual promise. All motion respects `prefers-reduced-motion` (end states shown, loops off) and pauses off screen.

---

## Paste-ready prompt

```
Upgrade the motion on docs/concepts/13-dhaka-slides/index.html (Click & Grow Dhaka homepage) using docs/briefs/dhaka-motion-upgrade.md as the spec. Keep all copy, layout and the existing interactions (shutter, slideshow, cousin switch, form) as they are.

Use these skills: find-animation-opportunities (the audit is done; follow its table), choreograph (one entrance per container, non-uniform stagger, sync the underline to the shutter), animate (ease-out entrances with cubic-bezier(.23,1,.32,1), no ease-in, UI under 300 ms), animation-performance (transform, opacity and clip-path only; pause loops off screen), emil-design-eng (nothing blocks interaction; everything clickable as soon as it is visible), then verification-before-completion with Playwright at 1440x900 and 390x844.

Build the 8 rows of the table: hero copy entrance with a masked word rise; order bubbles above the laptop plus drifting clouds, a swaying kite and a one-time bulb chase; scroll parallax on sun and back buildings; heading reveals on every section; route pins that pop as the rickshaw reaches them; pack prices that count up in the active currency; FAQ answers that open and close smoothly; a bunting drop on the final CTA.

Use GSAP 3.12.5 + ScrollTrigger, already on the page. Under prefers-reduced-motion show every end state and run no loops. Pause loops when the hero is off screen. No page errors, no sideways scroll, and the quote form must still submit.
```
