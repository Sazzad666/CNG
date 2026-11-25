/* Click & Grow: page motion and small behaviours. Motion (window.Motion) drives entrances and scroll links.
   Rules: transform/opacity only; one entrance per container; nothing blocks clicking; reduced motion → no movement. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var M = window.Motion;
  var EASE = [0.23, 1, 0.32, 1];
  if (M) doc.classList.add('js');
  // reduced motion: keep gentle opacity fades, drop all movement
  var move = function (from, to) { return reduce ? {} : { transform: [from, to] }; };
  var fx = function (props, extra) { return Object.assign({ opacity: [0, 1] }, props, extra || {}); };

  // Safety net: if anything below fails, never leave content hidden.
  var revealAll = function () { document.querySelectorAll('[data-enter],[data-reveal],[data-reveal-item]').forEach(function (el) { el.style.opacity = 1; }); };
  window.setTimeout(function () { if (!document.documentElement.dataset.motionReady) revealAll(); }, 2500);

  // ---- Hero entrance: one beat per step, 110 ms apart -------------------
  function enter() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-enter]'));
    if (!items.length) return;
    if (!M) { items.forEach(function (el) { el.style.opacity = 1; }); return; }
    items.forEach(function (el) {
      var step = Number(el.getAttribute('data-enter-step') || 0);
      var isLine = el.classList.contains('line');
      if (reduce) return M.animate(el, { opacity: [0, 1] }, { duration: 0.4, delay: step * 0.05 });
      M.animate(el, isLine ? { opacity: [0, 1], transform: ['translateY(0.45em)', 'translateY(0)'], clipPath: ['inset(0 0 100% 0)', 'inset(0 0 -20% 0)'] } : { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] },
        { duration: isLine ? 0.7 : 0.6, delay: 0.08 + step * 0.11, ease: EASE });
    });
  }

  // ---- Section reveals: the section is one beat; its items follow it closely --
  function reveals() {
    var sections = document.querySelectorAll('[data-reveal]');
    if (!M || !M.inView) return;
    sections.forEach(function (section) {
      M.inView(section, function () {
        var items = section.querySelectorAll('[data-reveal-item]');
        // one entrance per container: the items carry it, or the section does when it has none
        if (!items.length) M.animate(section, fx(move('translateY(16px)', 'translateY(0)')), { duration: reduce ? 0.4 : 0.6, ease: EASE });
        items.forEach(function (it, i) {
          // shrinking gaps, capped: a long list never makes the last item wait
          var delay = Math.min(0.35, 0.06 * i + 0.02 * Math.sqrt(i));
          M.animate(it, fx(move('translateY(24px)', 'translateY(0)')), { duration: reduce ? 0.4 : 0.6, delay: reduce ? 0 : delay, ease: EASE });
        });
      }, { amount: 0.15 });
    });
  }

  // ---- Scroll-linked: hero cards drift, process line draws ----------------
  function scrollLinks() {
    if (reduce || !M || !M.scroll) return;
    var hero = document.getElementById('hero');
    document.querySelectorAll('[data-drift]').forEach(function (el) {
      var dist = Number(el.getAttribute('data-drift')) || -40;
      var wrap = document.createElement('div');
      // drift on a wrapper so it never fights the entrance animation on the element itself
      el.parentNode.insertBefore(wrap, el); wrap.appendChild(el);
      wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
      el.style.pointerEvents = 'auto';
      M.scroll(M.animate(wrap, { transform: ['translateY(0px)', 'translateY(' + dist + 'px)'] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
    });
    var line = document.querySelector('[data-process-line]');
    var list = document.querySelector('[data-process]');
    if (line && list) {
      M.scroll(M.animate(line, { transform: ['scaleY(0)', 'scaleY(1)'] }, { ease: 'linear' }), { target: list, offset: ['start 70%', 'end 60%'] });
    }
  }

  // ---- Header: solid background once the page scrolls ----------------------
  function header() {
    var h = document.querySelector('[data-header]');
    if (!h) return;
    var on = false;
    var check = function () {
      var s = window.scrollY > 12;
      if (s !== on) { on = s; h.classList.toggle('is-scrolled', s); }
    };
    window.addEventListener('scroll', check, { passive: true }); check();
  }

  // ---- Services mega menu (hover with intent delay, and keyboard) -----------
  function mega() {
    document.querySelectorAll('[data-mega]').forEach(function (wrap) {
      var trigger = wrap.querySelector('[data-mega-trigger]');
      var t;
      var set = function (open) { wrap.classList.toggle('is-open', open); trigger.setAttribute('aria-expanded', String(open)); };
      wrap.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { clearTimeout(t); t = setTimeout(function () { set(true); }, 60); } });
      wrap.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { clearTimeout(t); t = setTimeout(function () { set(false); }, 140); } });
      wrap.addEventListener('focusin', function () { set(true); });
      wrap.addEventListener('focusout', function (e) { if (!wrap.contains(e.relatedTarget)) set(false); });
      wrap.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); trigger.focus(); } });
    });
  }

  // ---- Mobile menu ------------------------------------------------------------
  function mobileMenu() {
    var btn = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-menu]');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('hidden') === false;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  // ---- Enquiry panel (a native <dialog>) ---------------------------------------
  function panel() {
    var dlg = document.getElementById('enquiry-panel');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var open = function (service, opener) {
      var sel = dlg.querySelector('select[name="service"]');
      if (sel && service) sel.value = service;
      dlg.showModal();
      doc.classList.add('panel-open');
      if (M) M.animate(dlg, fx(move('translateX(40px)', 'translateX(0)')), { duration: reduce ? 0.2 : 0.28, ease: EASE });
      var first = dlg.querySelector('input[name="name"]');
      if (first && window.matchMedia('(pointer: fine)').matches) first.focus();
      dlg._opener = opener;
    };
    var close = function () {
      if (!dlg.open) return;
      var done = function () { dlg.close(); doc.classList.remove('panel-open'); if (dlg._opener) dlg._opener.focus(); };
      if (reduce || !M) return done();
      M.animate(dlg, { transform: 'translateX(40px)', opacity: 0 }, { duration: 0.16, ease: EASE }).then(done);
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-open-enquiry]');
      if (a) { e.preventDefault(); open(a.getAttribute('data-service'), a); return; }
      if (e.target.closest('[data-close-panel]') || e.target === dlg) close();
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    window.cgOpenEnquiry = open;
  }

  // ---- Mobile action bar: shows after the hero, hides while typing --------------
  function mobileBar() {
    var bar = document.querySelector('[data-mobile-bar]');
    if (!bar) return;
    var hero = document.getElementById('hero') || document.querySelector('main > section');
    var past = !hero, typing = false;
    var render = function () { bar.classList.toggle('is-visible', past && !typing); };
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { past = !es[0].isIntersecting; render(); }, { rootMargin: '-40% 0px 0px 0px' }).observe(hero);
    }
    document.addEventListener('focusin', function (e) { if (e.target.matches('input, textarea, select')) { typing = true; render(); } });
    document.addEventListener('focusout', function () { typing = false; setTimeout(render, 100); });
    render();
  }

  // ---- Work filter --------------------------------------------------------------
  function workFilter() {
    var group = document.querySelector('[data-work-filter]');
    if (!group) return;
    group.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (!b) return;
      var key = b.getAttribute('data-filter');
      group.querySelectorAll('[data-filter]').forEach(function (x) {
        var on = x === b;
        x.setAttribute('aria-pressed', String(on));
        x.className = on ? 'rounded-full border border-lime bg-lime px-4 py-2 text-sm font-semibold text-ink' : 'rounded-full border border-cream/20 px-4 py-2 text-sm text-cream/80 hover:border-cream/50';
      });
      document.querySelectorAll('[data-services]').forEach(function (card) {
        var show = !key || card.getAttribute('data-services').split(' ').indexOf(key) > -1;
        card.hidden = !show;
        if (show && !reduce && M) M.animate(card, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] }, { duration: 0.35, ease: EASE });
      });
    });
  }

  // ---- Remember where the visitor came from (for every lead form) -----------------
  function attribution() {
    try {
      var q = new URLSearchParams(location.search);
      var store = window.sessionStorage;
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { if (q.get(k)) store.setItem('cg_' + k, q.get(k).slice(0, 120)); });
      if (!store.getItem('cg_referrer') && document.referrer && document.referrer.indexOf(location.host) === -1) store.setItem('cg_referrer', document.referrer.slice(0, 300));
    } catch (e) { /* storage blocked: forms still work */ }
  }

  function boot() {
    try { attribution(); enter(); reveals(); scrollLinks(); header(); mega(); mobileMenu(); panel(); mobileBar(); workFilter(); }
    catch (e) { revealAll(); if (window.console) console.error(e); }
    document.documentElement.dataset.motionReady = '1';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
