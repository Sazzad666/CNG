/* Exit-intent audit offer. Desktop: the pointer leaves through the top of the window.
   Touch: after 45 s and half the page read, a fast scroll back up. At most once per visitor every
   7 days, never while another dialog or a form field is in use. */
(function () {
  'use strict';
  var dlg = document.getElementById('exit-offer');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  var KEY = 'cg_exit_seen', WEEK = 7 * 864e5, ARM_MS = 2000;
  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var armed = false, shown = false;

  function seenRecently() {
    try { var t = Number(localStorage.getItem(KEY)); return t && Date.now() - t < WEEK; } catch (e) { return false; }
  }
  function markSeen() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* storage blocked */ } }
  function busy() {
    if (document.querySelector('dialog[open]')) return true;
    var a = document.activeElement;
    return !!(a && a.matches && a.matches('input, textarea, select'));
  }

  function open() {
    if (shown || !armed || seenRecently() || busy()) return;
    shown = true;
    markSeen();
    dlg.showModal();
    document.documentElement.classList.add('panel-open');
    if (!reduce && M) M.animate(dlg, { opacity: [0, 1], transform: ['scale(0.96)', 'scale(1)'] }, { duration: 0.2, ease: [0.23, 1, 0.32, 1] });
    var first = dlg.querySelector('input[name="name"]');
    if (first) first.focus({ preventScroll: true });
  }
  function close() {
    if (!dlg.open) return;
    var done = function () { dlg.close(); document.documentElement.classList.remove('panel-open'); };
    if (reduce || !M) return done();
    M.animate(dlg, { opacity: 0, transform: 'scale(0.97)' }, { duration: 0.15, ease: [0.4, 0, 1, 1] }).then(done);
  }

  if (seenRecently()) return;
  setTimeout(function () { armed = true; }, ARM_MS);

  // Desktop: leaving through the top edge (towards the tabs or the address bar)
  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget && e.clientY <= 0) open();
  });

  // Touch: a quick flick back up after real reading
  if (window.matchMedia('(pointer: coarse)').matches) {
    var start = Date.now(), lastY = window.scrollY, lastT = Date.now(), deepest = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY, t = Date.now();
      var depth = (y + window.innerHeight) / document.documentElement.scrollHeight;
      deepest = Math.max(deepest, depth);
      var speed = (lastY - y) / Math.max(1, t - lastT); // px per ms, upwards positive
      if (t - start > 45000 && deepest > 0.5 && speed > 2.5 && y > 400) open();
      lastY = y; lastT = t;
    }, { passive: true });
  }

  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-close-exit]')) close(); });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
})();
