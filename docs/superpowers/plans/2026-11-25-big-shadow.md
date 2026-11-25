# Big Shadow Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, chosen by the owner's "build it"). Steps use checkbox (`- [ ]`) syntax.

**Goal:** A single global homepage, `.c19/index.html`, built on the Big Shadow hero and the 0.05-second section, published to the main artifact and saved to `docs/concepts/19-big-shadow/`.

**Architecture:** One self-contained HTML file: tokens and CSS, inline SVG scenes, one script. Each scene follows the `scroll-story-animation` contract (beat sheet, coordinate-built SVG, one timeline, static fallback, `data-scene-*` hooks). No pinned or scrubbed sections; ScrollTrigger is used only for one-time entrances.

**Tech Stack:** HTML, CSS, GSAP 3.12.5 + ScrollTrigger (cdnjs), Playwright for checks.

**Spec:** `docs/superpowers/specs/2026-11-25-big-shadow-design.md`

## Global Constraints

- No pinned or scroll-scrubbed sections; entrances run once, 0.8 s or less.
- No Bangladesh-only references except the bKash/Nagad FAQ line.
- Copy follows `humanizer`: no em or en dashes in visible text.
- Claims only from the spec's confirmed list; placeholders marked in a code comment.
- Reduced motion: end states, zero running animations.
- Brand tokens: green #006A4E, yellow #FFC72C, ink #1C1A17, paper #FFFBF2.

## Review Focus

- Visitor presses Replay or "Show me with Click & Grow" twice quickly: the scene finishes cleanly, no half states.
- Visitor switches region mid-page: every price and the phone code update.
- Visitor on a 390 px phone: no sideways scroll; the shadow scene and the map stay readable.
- Visitor with reduced motion: the skyscraper shadow, the "Take my money" stamp and all map arcs are visible.
- Visitor submits the form with an invalid phone: inline error and a focused error summary.

---

### Task 1: Page shell, tokens, header, region picker, form, FAQ, footer

**Files:** Create `.c19/index.html`.
**Produces:** `money(usd)`, `applyRegion(code)` with regions US, CA, UK, EU, AE, AU, BD; `tick(need)` pre-fills the form; `[data-need]` links.

- [ ] Build the shell with sections in spec order (ids: `hero`, `judged`, `truths`, `compare`, `services`, `world`, `included`, `how`, `faq`, `order`, `final`).
- [ ] Form: 4 steps (needs, timeline, budget in currency, contact), inline errors, error summary, success card.
- [ ] Check: `node .claude/skills/scroll-story-animation/scripts/check-scene.js .c19 8795` reports no errors, 0 overflow, `hiddenButVisible` empty.

### Task 2: Hero, The Big Shadow

**Interfaces:** `playShadow()` replays the scene; hooks `data-scene-step` on the three shadow stages.

- [ ] Night wall, small shop, spotlight; shadow stages: shop, mid-rise, skyscraper with glowing logo.
- [ ] Timeline: spotlight swings on (0.6 s), shadow grows in three beats with a settle each, headline highlight wipes after the last beat. Replay button replays from start.
- [ ] Check: after load + 4 s, the skyscraper stage is visible (checker `autoFloorsAfter9s` = 3).

### Task 3: Judged in 0.05 seconds

**Interfaces:** `judge(mode)` where mode is `'old'` or `'new'`.

- [ ] Stopwatch, dated site mock, eye-trail path, stamp. Plays once on entry with "Nope."; the button redraws the new site and flips the stamp to "Take my money." Button toggles back.
- [ ] Source line under the scene.

### Task 4: Truth cards, comparison, services, world map, included, how it works, final CTA

- [ ] Truth cards flip in on entry; back face names the fix.
- [ ] Comparison: three columns, bad lines struck through on entry.
- [ ] Map: simplified world, arcs draw once to US, Canada, UK, Europe, UAE, Saudi Arabia, Qatar, Australia, with local clocks.
- [ ] Final CTA repeats a small shadow-growth moment.

### Task 5: Verify, save, publish

- [ ] Playwright at 1440x900 and 390x844 plus reduced motion: screenshots of every section, no errors, no overflow, form submits.
- [ ] Copy to `docs/concepts/19-big-shadow/index.html` and `.latest/index.html`; commit; push; publish the artifact.
