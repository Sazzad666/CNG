---
name: Click & Grow Chalkboard
description: The shopkeeper's own A-frame chalkboard. Chalk on slate inside a worn wooden frame, with one paper order slip pinned to it.
colors:
  slate: "#1F2A24"
  chalk: "#F4F1E8"
  chalk-soft: "#D9D5C8"
  chalk-dim: "#BDB9AB"
  chalk-yellow: "#FFD54A"
  chalk-green: "#93DDB2"
  chalk-pink: "#F7A8B8"
  wood-light: "#9A6436"
  wood: "#7A4A27"
  wood-dark: "#5E3820"
  brand-green: "#006A4E"
  brand-yellow: "#FFC72C"
  ink: "#1C1A17"
  paper: "#FFFBF2"
  slip-muted: "#55504A"
  slip-line: "#CFC5AE"
  slip-field: "#FFFFFF"
  slip-placeholder: "#7A7366"
  error-red: "#B3261E"
  pin-red: "#C8102E"
typography:
  display:
    fontFamily: "Cabin Sketch, Caveat Brush, cursive"
    fontSize: "clamp(44px, 11.2vw, 92px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0"
  headline:
    fontFamily: "Cabin Sketch, Caveat Brush, cursive"
    fontSize: "clamp(38px, 7vw, 68px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
  title-set:
    fontFamily: "Cabin Sketch, Caveat Brush, cursive"
    fontSize: "clamp(40px, 9vw, 56px)"
    fontWeight: 700
    lineHeight: 1
  title-slip:
    fontFamily: "Cabin Sketch, Caveat Brush, cursive"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.05
  script-figure:
    fontFamily: "Caveat Brush, Cabin Sketch, cursive"
    fontSize: "clamp(34px, 9vw, 52px)"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "\"tnum\" 1"
  script-title:
    fontFamily: "Caveat Brush, Cabin Sketch, cursive"
    fontSize: "clamp(28px, 6.4vw, 36px)"
    fontWeight: 400
    lineHeight: 1.05
  script-label:
    fontFamily: "Caveat Brush, Cabin Sketch, cursive"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
  fine:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  slip: "6px"
  nav: "8px"
  field: "10px"
  button: "12px"
  pill: "999px"
spacing:
  hair: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "56px"
  rail: "clamp(8px, 1.6vw, 20px)"
  gutter: "16px"
  section: "clamp(56px, 8vw, 104px)"
  container: "1180px"
components:
  button-chalk:
    backgroundColor: "{colors.chalk-yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "52px"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "52px"
  button-green:
    backgroundColor: "{colors.brand-green}"
    textColor: "{colors.slip-field}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "52px"
  button-rail:
    backgroundColor: "{colors.chalk-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "44px"
  rail:
    backgroundColor: "{colors.wood}"
    textColor: "{colors.chalk}"
    height: "64px"
  rail-link:
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.nav}"
    padding: "0 12px"
    height: "44px"
  tray:
    backgroundColor: "{colors.wood}"
    textColor: "{colors.chalk}"
    padding: "22px 0 28px"
  chalk-input:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    typography: "{typography.script-label}"
    padding: "0 4px"
    height: "52px"
  menu-row:
    textColor: "{colors.chalk}"
    typography: "{typography.script-title}"
    padding: "16px 0"
  menu-price:
    textColor: "{colors.chalk-yellow}"
    typography: "{typography.script-title}"
  set-menu:
    textColor: "{colors.chalk-soft}"
    typography: "{typography.title-set}"
    padding: "26px 0"
  set-price:
    textColor: "{colors.chalk-yellow}"
    typography: "{typography.script-figure}"
  order-slip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.slip}"
    padding: "34px clamp(22px, 4vw, 36px) 30px"
  slip-field:
    backgroundColor: "{colors.slip-field}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "50px"
  pill-chalk:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  pill-chalk-pressed:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.ink}"
  pill-slip:
    backgroundColor: "{colors.slip-field}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  pill-slip-checked:
    backgroundColor: "{colors.brand-yellow}"
    textColor: "{colors.ink}"
  phone-bar:
    backgroundColor: "{colors.wood}"
    padding: "10px calc(clamp(8px, 1.6vw, 20px) + 8px) calc(10px + env(safe-area-inset-bottom, 0px))"
  phone-bar-button:
    rounded: "{rounded.button}"
    padding: "0 12px"
    height: "48px"
---

# Design System: Click & Grow Chalkboard

Scope: this file describes concept 14 only (`concepts/14-chalkboard/`). Other homepage concepts in this repo live in their own visual worlds and do not inherit these rules.

## Overview

**Creative North Star: "The A-Frame Outside the Shut Shop"**

The whole page is the specials board a corner shop props outside its door after closing. The ground is one slate field from edge to edge, held between wooden side rails fixed to the viewport, with a wooden header rail on top and a wooden chalk tray as the footer. Everything written on the board is chalk: grained, slightly wobbly, hand-lettered for voice and plainly lettered for reading. A single cream order slip, pinned with a red pin and tilted a little, is the only thing on the board that is not chalk.

Density is a menu board's density: big hand-lettered headings, prices set in chalk script on the right of dotted leader lines, dashed hand-ruled dividers between rows, and plenty of slate between sections. Depth is physical and soft. The wood sits proud of the slate and casts blurred shadows; the slip and the yellow chalk button lift off the board with soft drop shadows. Nothing casts a hard offset shadow.

Motion is one moment. On arrival the headline underline and the plant pot chalk themselves in, then tonight's orders tally up one mark at a time while a chalk plant grows a leaf for every second order and flowers on the last, and then the board rests. Everything else that moves is direct feedback to a press, a hover, an opened answer or a scroll.

**Key Characteristics:**
- Slate ground, wooden frame (side rails, header rail, chalk tray), chalk lettering in white, yellow, green and pink.
- Two hand faces with distinct jobs (Cabin Sketch for headings, Caveat Brush for chalk script) over one plain reading face (Atkinson Hyperlegible).
- Chalk texture comes from an SVG noise mask on hand-lettered headings and an SVG displacement filter on drawn icons and lines.
- One paper surface: the order slip, in brand ink, paper, green and yellow.
- One hero motion moment, fully resolved under reduced motion.

## Colors

A dark slate field carries off-white chalk with three chalk accents; brand colours appear at full strength only on the paper slip and on the logo mark.

### Primary
- **Chalk Yellow** (chalk-yellow): the board's one loud chalk. The main call to action fill, prices and totals, the second line of the hero headline, the drawn underline, focus outlines, text caret and selection. About 10:1 on slate.

### Secondary
- **Soft Green Chalk** (chalk-green): labels in script (Tonight's orders, Prices in, set subtitles), tick icons, the plant stem and leaves, and links in the hero's alternative line. About 9:1 on slate.

### Tertiary
- **Pink Chalk** (chalk-pink): the editor's hand. Only the ring and arrow around the recommended set, the "Elsewhere" heading, the strike-through on bad options and the plant's flower. Never a fill and never body text.

### Neutral
- **Slate** (slate): the page ground, under faint radial eraser smudges and a dust noise layer. Also the browser theme colour.
- **Chalk** (chalk): headings, menu item names, primary text in script.
- **Soft Chalk** (chalk-soft): body and supporting copy on slate, outline-button borders, the hand-ruled divider stroke.
- **Dim Chalk** (chalk-dim): placeholders and fine notes such as sample-price disclaimers. 7.5:1 on slate, so it still reads.
- **Wood** (wood-light, wood, wood-dark): a three-stop vertical gradient with fine grain stripes, used for the side rails, header rail, chalk tray and phone bar. Chalk text on wood is bold or large only.
- **Ink and Paper** (ink, paper): the slip's text and ground; ink is also the text on every yellow fill.
- **Slip neutrals** (slip-muted, slip-line, slip-field, slip-placeholder): secondary text, field and pill borders, field fill and placeholder on the slip.

### Brand and state
- **Brand Green** (brand-green): the slip's submit button, focus ring and caret, and the PINNED stamp. Lives on paper, not on slate.
- **Brand Yellow** (brand-yellow): the checked state of slip pills and text selection on the slip.
- **Error Red** (error-red): field error text and invalid borders on the slip.
- **Pin Red** (pin-red): the push pin holding the slip, as a radial gradient from #FF7A8E.

### Named Rules
**The Chalk on Slate Rule.** Everything on the board is chalk colour on slate. Brand green and brand yellow at full strength appear only on the paper slip and the logo mark; the board's yellow is chalk yellow, a lighter, warmer cousin.

**The Pink Is a Pen Rule.** Pink chalk marks, circles and crosses out. It never fills a shape or sets a paragraph.

## Typography

**Display Font:** Cabin Sketch 700 (falls back to Caveat Brush, cursive)
**Script Font:** Caveat Brush 400 (falls back to Cabin Sketch, cursive)
**Body Font:** Atkinson Hyperlegible 400/700 (falls back to system-ui)

All three are self-hosted woff2 in `assets/fonts/` with `font-display: swap`.

**Character:** Cabin Sketch is the shopkeeper's careful capitals for headings; Caveat Brush is the quick hand that writes items, prices and notes; Atkinson Hyperlegible carries every sentence someone has to read properly.

### Hierarchy
- **Display** (Cabin Sketch 700, clamp 44 to 92px, line-height 0.95): the hero headline only, second line in chalk yellow, balanced wrapping.
- **Headline** (Cabin Sketch 700, clamp 38 to 68px, line-height 1): section headings.
- **Title, set** (Cabin Sketch 700, clamp 40 to 56px): the three set-menu names. **Title, slip** (Cabin Sketch 700, 30px): "Order slip" and the stamp.
- **Script figure** (Caveat Brush, clamp 34 to 52px, tabular figures): running total and set prices.
- **Script title** (Caveat Brush, clamp 28 to 36px): menu items and their prices, step names, FAQ questions, column headings.
- **Script label** (Caveat Brush, 22 to 24px): small chalk captions, the hero input text and its label, freebies.
- **Body** (Atkinson 400, 17px, line-height 1.6): all running copy; ledes run 17 to 20px with a 34em to 40em measure.
- **Body small** (16px): menu descriptions and the alternative-action line.
- **Label** (Atkinson 700, 15px): slip field labels, pills, rail button text.
- **Fine** (Atkinson 400, 14px): sample-price notes, field errors (700), tray fine print.

### Named Rules
**The Two Hands Rule.** Cabin Sketch writes headings; Caveat Brush writes items, prices and notes. Sentences of more than one line are always Atkinson Hyperlegible.

**The Grain Is for Headings Rule.** The chalk noise mask goes on hand-lettered headings, never on body text or on anything on the slip.

## Layout

One centred column, `min(1180px, 100% - 2 × rail - 32px)`, keeps a 16px gutter inside the wooden side rails (rail width clamp 8 to 20px). Sections share one vertical rhythm (clamp 56 to 104px top and bottom), each opened by a hand-ruled wavy chalk line across the column. Gaps step through 4, 8, 12, 16, 24, 32 and 56px.

Mobile first. Below 860px the header nav hides and a fixed phone bar can rise from the bottom; at 640px the slip's paired fields go two-up; at 900px the hero splits into copy and form on the left (1.2fr) and the tally board on the right (0.8fr) inside a chalk-drawn frame, the specials menu goes two columns, set menus go three across with dashed vertical rules, the before-and-after list goes two columns and the steps go four across under a dashed chalk arrow. The sticky header sets a scroll padding of 84px.

## Elevation & Depth

The slate is flat. Depth belongs to physical things placed on or around it: wood rails, the slip, its pin and the yellow chalk button. All shadows are soft, blurred and black; none is a solid offset block.

### Shadow Vocabulary
- **Rail** (`0 8px 20px rgba(0,0,0,.35)`): header rail; mirrored upward (`0 -8px 20px`) on the tray and phone bar.
- **Side rail** (`0 0 18px rgba(0,0,0,.45)`): the fixed wooden side frames.
- **Chalk button** (`0 6px 16px rgba(0,0,0,.35)`, hover `0 10px 22px rgba(0,0,0,.4)`).
- **Green button** (`0 6px 14px rgba(28,26,23,.22)`, hover `0 10px 20px rgba(28,26,23,.28)`): on paper, so ink-tinted and lighter.
- **Slip** (`0 18px 40px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.3)`), and its **pin** (`0 4px 6px rgba(0,0,0,.35)`).
- **Field focus** (`0 0 0 3px rgba(0,106,78,.2)`): a soft green ring, slip only.

### Named Rules
**The No Hard Offset Rule.** No zero-blur offset shadows anywhere. Lift is a blurred shadow cast by a physical object.

**The Flat Slate Rule.** Chalk marks never cast shadows; only wood, paper and the yellow button sit above the board.

## Shapes

Board furniture is near-rectangular with softened corners: 12px buttons, 10px slip fields and stamp, 8px rail links, 6px slip and focus outlines; pills and the pin are fully round. Everything drawn in chalk is wobbly on purpose: stroked SVG paths with round caps and joins, roughened by a displacement filter (`feTurbulence` 0.9, scale 2.2). Dividers are dashed (2px at 22% chalk), leader lines are dotted (3px at 35% chalk), and the slip sits rotated by -0.6deg.

## Components

### Wooden rail and tray
Fixed wooden side rails frame the viewport. The sticky header rail (64px) holds the logo (chalk wordmark, yellow ampersand, the green cursor-square mark), the nav links and a compact chalk-yellow quote button. The footer is the chalk tray: drawn sticks of white, yellow and green chalk and a duster, the logo, footer links and fine print in #F1E3CF.

### Buttons
- **Shape:** gently rounded (12px), 52px tall, 17px bold Atkinson, optional 20px icon after the label.
- **Chalk (primary):** chalk-yellow fill with ink text and a soft drop shadow; hover lifts 2px and deepens the shadow.
- **Line (secondary):** transparent with a 2.5px soft-chalk border and chalk text; hover adds a 6% white wash.
- **Green (slip submit):** brand green with white text, only on the paper slip.
- **Press:** every button scales to 0.97. Hover effects run only on fine pointers. Disabled buttons drop to 70% opacity with a progress cursor.

### Chalk input
The hero's quote line is written straight on the board: no box, a 3px soft-chalk baseline, chalk script at 26px, dim-chalk placeholder, the baseline turning chalk yellow on focus, plus a chalk-drawn arrow before its label.

### Menu rows
Each specials row is a two-column grid: the item name in chalk script followed by a dotted leader line, the price in chalk yellow script on the right (small "a month" suffix in soft chalk), and a one-line description below in Atkinson. Rows are separated by dashed hand-ruled lines. A currency switch of chalk pills sits above.

### Set menus
Three combos as open columns, not cards: Cabin Sketch name with a green script subtitle, the price in yellow chalk script, ticked list, then a button. The recommended set gets a pink chalk ring around its price, a pink arrow note ("the one we'd pick") and the yellow chalk button; the others use line buttons. Dashed dividers separate the sets.

### Order slip
The one paper object: paper ground, ink text, 6px corners, rotated -0.6deg, a red push pin at top centre and a deep soft shadow. Fields are white with a 2px slip-line border at 10px radius, 50px tall; focus turns the border brand green with a soft green ring; invalid fields turn error red with the message in text below. Submit shows a rotated PINNED stamp in brand green.

### Pills
- **Chalk pills (currency switch):** 44px, fully round, 2px border at 40% chalk, transparent; pressed fills solid chalk with ink text.
- **Slip pills (needs and set choice):** 44px, fully round, white with slip-line border; checked fills brand yellow with an ink border; keyboard focus draws a 3px brand-green outline.

### Phone action bar
Below 860px, a wooden bar fixed to the bottom with two equal 48px buttons (WhatsApp line button, Free quote chalk button), respecting the safe area. It slides up only once the hero's quote line has scrolled away, and hides again over the slip and the tray.

### Focus
On the board, a 3px dashed chalk-yellow outline offset 4px with 6px rounding; on the slip, a solid 3px brand-green outline.

## Do's and Don'ts

### Do:
- **Do** keep the slate as the only page ground, with the wooden rails and tray as the only frame.
- **Do** write headings in Cabin Sketch with the chalk grain mask, items and prices in Caveat Brush, and sentences in Atkinson Hyperlegible.
- **Do** keep the paper slip the only non-chalk surface, using brand ink, paper, green and yellow.
- **Do** draw icons, arrows, rings and dividers as stroked SVG chalk lines with round caps and the roughening filter.
- **Do** keep the hero sequence the only choreographed motion: underline and pot draw in (900ms, staggered 120ms from 150ms), then a tally mark every 1.9s from 1.3s, fourteen in all, with a leaf every second order and a flower on the last, then rest.
- **Do** resolve that moment instantly under reduced motion: all fourteen marks, leaves, flower and total drawn at once.
- **Do** keep every tap target at least 44px tall.

### Don't:
- **Don't** add a second paper or card surface, or boxed cards on the slate.
- **Don't** use hard offset shadows; lift is always a soft blurred shadow from a physical object.
- **Don't** add scroll-triggered reveals, looping animation or a second ambient moment; motion beyond the hero is feedback only.
- **Don't** set brand green or brand yellow as large fills on the slate; the board's accents are chalk yellow, chalk green and chalk pink.
- **Don't** use pink chalk for fills or paragraph text.
- **Don't** set regular-weight small text on the lighter top of the wood gradient.
