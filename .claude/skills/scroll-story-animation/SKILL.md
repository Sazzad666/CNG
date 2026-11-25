---
name: scroll-story-animation
description: Use when building or fixing an illustrated story animation on a web page with GSAP, ScrollTrigger and inline SVG - a pinned scroll-scrubbed scene, a token or vehicle moving along a path, captions that must match the animation, an auto-playing sequence (orders arriving, floors stacking), a hero scene that changes state on click, or when such a scene jumps, lags, skips steps, ignores reduced motion or keeps running off screen.
---

# Scroll Story Animation

## Overview

A story scene is a small film: a set of beats (start, problem, twist, payoff) drawn in inline SVG and played by one GSAP timeline, either on a clock (hero) or on the scrollbar (pinned section).

**Core principle: the timeline's own time is the single source of truth.** Captions, counters, progress and button labels read from it. Nothing reads the scrollbar or a separate timer to guess where the story is.

Pair with `animate` (curves, durations), `choreograph` (stagger, order), `animation-performance` (cheap properties). This skill covers what those don't: building the scene and keeping state, captions and fallbacks honest.

## The build contract

Every scene ships with these five parts, in this order:

1. **Beat sheet.** A list of 3 to 6 beats, each with the caption text and the on-screen change. Write it before drawing.
2. **SVG built from coordinates.** A helper such as `cell(n)` returns `{x, y}`; paths, labels and the token are created from it, so geometry and motion share one source.
3. **One master timeline per scene,** with a mark recorded at each beat: `marks.push([tl.duration(), beatIndex])` right before the tweens of that beat.
4. **One driver:** a clock for heroes (chained `onComplete`), or `ScrollTrigger.create({ animation: tl, scrub: .5 })` for pinned sections. Captions update in `tl.eventCallback('onUpdate', ...)`.
5. **Static fallback** for reduced motion or missing GSAP: the final state drawn, every caption visible as a list, no loops.
6. **Test hooks** (REQUIRED, the checker reads only these):

| Attribute | Goes on |
|---|---|
| `data-scene-track` | the tall element that pins and scrubs the scene |
| `data-scene-token` | the outer `<g>` that moves (the one that takes position) |
| `data-scene-caption` | each caption; the visible one also gets `aria-current="true"` |
| `data-scene-step` | each piece an auto sequence adds (a floor, an order) |

## Rules that prevent the known failures

| Symptom | Cause | Rule |
|---|---|---|
| Token snaps back to the start on each hop | One element positioned by `setAttribute('transform')` and also tweened by GSAP (`scale`), so GSAP overwrites the position | Nest: outer `<g>` takes position, inner `<g>` takes scale or rotation. Never let two systems own one element's transform. |
| Caption lags or stops one beat short | Caption computed in `ScrollTrigger.onUpdate`; with `scrub` the timeline is still catching up | Compute captions from `tl.time()` inside `tl.eventCallback('onUpdate')`. |
| A beat's caption is never seen | Too little scroll per beat | Give each beat at least 60 vh of track: `height = 100vh + beats x 60vh` minimum, more on phones. Hold 0.3 to 0.6 s of empty timeline at each beat. |
| Auto sequence runs slow or skips | `setInterval` / repeating `delayedCall` that skips while a step is still animating | Chain: each step's timeline `onComplete` schedules the next (`gsap.delayedCall(.15, next)`). Keep a `remaining` counter; a click sets it to 0. |
| Reduced-motion visitors still get motion | `timeScale(3)` or shorter durations | Reduced motion means **end states**: draw the finished scene, show all captions, start no loops, autoplay nothing. |
| Loops burn CPU when nobody sees them | Clouds, steam, neon run forever | Collect loops in an array; pause and resume them in a ScrollTrigger `onToggle` on the scene. |
| Hidden steps or buttons still show | A class sets `display` and beats the `hidden` attribute | Add `[hidden]{display:none!important}` once. |
| Light text on a background that turned light | State class changes the background only | Every state class (`.fast`, `.day`) restyles text, borders and shadows too. Screenshot both states. |
| Phone rule has no effect | Media query placed before the base rule it overrides | Put responsive overrides after the base rules (end of the stylesheet). |
| Label hidden under a path | SVG paints in DOM order | Append labels and the token last. |
| Component A breaks component B | Shared generic class (`.step`) queried by both scripts | Prefix per component (`.ostep`, `.dstep`) and query inside its root. |

## Example: pinned board with path-following and honest captions

```js
const tok = { x: 0, y: 0 };
const token = el('g', { id: 'token' }), tokIn = el('g', { class: 'tok-in' }, token); // outer = position, inner = scale
const place = () => token.setAttribute('transform', `translate(${tok.x} ${tok.y})`);

const tl = gsap.timeline({ defaults: { ease: 'power1.inOut' } });
const marks = [[0, 0]];
const walk = (a, b) => { for (let n = a + 1; n <= b; n++) { const c = cell(n);
  tl.to(tok, { x: c.x, y: c.y, duration: .32, onUpdate: place })
    .to(tokIn, { scale: 1.18, duration: .16, yoyo: true, repeat: 1 }, '<'); } };
const along = (path, dur) => { const L = path.getTotalLength(), p = { t: 0 };      // no plugin needed
  tl.to(p, { t: 1, duration: dur, onUpdate: () => { const pt = path.getPointAtLength(p.t * L); tok.x = pt.x; tok.y = pt.y; place(); } }); };

walk(1, 9);  marks.push([tl.duration(), 1]); along(snakePath, 1.4); tl.to({}, { duration: .4 });   // beat 1 + hold
walk(2, 14); marks.push([tl.duration(), 2]); along(ladderPath, 1.6); tl.to({}, { duration: .6 });  // beat 2 + hold

ScrollTrigger.create({ trigger: '#track', start: 'top top', end: 'bottom bottom', scrub: .5, animation: tl });
let shown = -1;
tl.eventCallback('onUpdate', () => {                       // captions follow the story, not the scrollbar
  let i = 0; marks.forEach(([t, k]) => { if (tl.time() >= t - .01) i = k; });
  if (i !== shown) { shown = i; showCaption(i); }
});
```

Hero clock version: `function step(){ ... gsap.timeline({ onComplete(){ busy = false; if (remaining-- > 0) gsap.delayedCall(.15, step); } }) }`.

## Verify before saying done

Run the bundled checker against the page folder (needs Playwright and `gsap` in `node_modules`, or set `GSAP_DIST`):

`node .claude/skills/scroll-story-animation/scripts/check-scene.js <folder-with-index.html> 8790`

It reads the `data-scene-*` hooks and reports: how many `data-scene-step` pieces are visible after 9 s, elements with `hidden` that still show, the token's position and the visible caption at five scroll points, phone overflow, running animations under reduced motion, and page errors. Pass means: the token trail changes at every point, the caption list shows every beat in order, `hiddenButVisible` is empty, overflow is 0, reduced motion reports 0 running, and no errors. Then look at screenshots of each beat at 1440 and 390 wide.

## Common mistakes

- Drawing the whole scene, then trying to animate it. Build from the beat sheet and coordinate helper so motion has anchors.
- One giant hero loop. A hero scene plays its story once (or on click) and then idles with a few cheap ambient loops.
- Scrubbing UI feedback. Buttons, form steps and FAQ answers use short CSS or one-shot tweens, never scroll.
