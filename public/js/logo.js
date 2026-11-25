/* The Click & Grow mark: the cursor drops, clicks, a ring ripples out, and a sprout grows from its tip.
   About 1.1 s on load; a short sway and ripple on hover; the final state only under reduced motion. */
(function () {
  'use strict';
  var logo = document.querySelector('[data-logo-animate]');
  var M = window.Motion;
  if (!logo || !M) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var q = function (s) { return logo.querySelector(s); };
  var cursor = q('.cg-cursor'), ring = q('.cg-ring'), stem = q('.cg-stem'), a = q('.cg-leaf-a'), b = q('.cg-leaf-b');
  var w1 = q('.cg-w1'), amp = q('.cg-amp'), w2 = q('.cg-w2');
  if (reduce) return;

  var EASE = [0.23, 1, 0.32, 1];
  var len = stem.getTotalLength ? stem.getTotalLength() : 20;
  // Origins: the cursor presses about its tip; leaves unfold from where they meet the stem.
  [cursor, ring].forEach(function (el) { el.style.transformBox = 'fill-box'; });
  cursor.style.transformOrigin = '0% 0%';
  ring.style.transformOrigin = '50% 50%';
  a.style.transformBox = b.style.transformBox = 'fill-box';
  a.style.transformOrigin = '0% 100%';
  b.style.transformOrigin = '100% 100%';

  function play() {
    stem.style.strokeDasharray = len; stem.style.strokeDashoffset = len;
    a.style.transform = b.style.transform = 'scale(0)';
    // 1. cursor drops in with a spring
    M.animate(cursor, { transform: ['translateY(-12px)', 'translateY(0px)'], opacity: [0, 1] }, { type: 'spring', stiffness: 420, damping: 26, delay: 0.05 });
    // words arrive alongside, one beat each (overlap, not a queue)
    [w1, amp, w2].forEach(function (el, i) {
      M.animate(el, { opacity: [0, 1], transform: ['translateX(-8px)', 'translateX(0)'] }, { duration: 0.5, delay: 0.15 + i * 0.09, ease: EASE });
    });
    // 2. the click: press and release
    setTimeout(function () {
      M.animate(cursor, { transform: ['scale(1)', 'scale(0.9)', 'scale(1)'] }, { duration: 0.18, ease: 'easeOut' });
      // 3. ring ripples from the tip
      M.animate(ring, { transform: ['scale(0)', 'scale(1.6)'], opacity: [0.9, 0] }, { duration: 0.45, ease: EASE });
      // 4. stem draws, 5. leaves unfold
      M.animate(stem, { strokeDashoffset: [len, 0] }, { duration: 0.35, delay: 0.08, ease: EASE });
      M.animate(b, { transform: ['scale(0) rotate(30deg)', 'scale(1) rotate(0deg)'] }, { type: 'spring', stiffness: 300, damping: 16, delay: 0.25 });
      M.animate(a, { transform: ['scale(0) rotate(-30deg)', 'scale(1) rotate(0deg)'] }, { type: 'spring', stiffness: 300, damping: 15, delay: 0.38 });
    }, 380);
  }

  var swaying = false;
  function sway() {
    if (swaying) return;
    swaying = true;
    M.animate(ring, { transform: ['scale(0.2)', 'scale(1.6)'], opacity: [0.8, 0] }, { duration: 0.45, ease: EASE });
    M.animate(a, { transform: ['rotate(0deg)', 'rotate(-6deg)', 'rotate(4deg)', 'rotate(0deg)'] }, { duration: 0.7, ease: 'easeInOut' });
    M.animate(b, { transform: ['rotate(0deg)', 'rotate(6deg)', 'rotate(-4deg)', 'rotate(0deg)'] }, { duration: 0.7, ease: 'easeInOut' }).then(function () { swaying = false; });
  }

  play();
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) logo.addEventListener('pointerenter', sway);
})();
