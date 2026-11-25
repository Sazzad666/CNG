/* Project estimator: five steps, one question set per screen. No prices are shown; the answers go
   with the lead so sales can write the quote. Progress survives a refresh; leaving after step 2
   records an anonymous drop-off so the team can see where people stop. */
(function () {
  'use strict';
  var form = document.querySelector('[data-estimator]');
  if (!form) return;
  var fallback = document.querySelector('[data-estimator-fallback]');
  if (fallback) fallback.hidden = true;
  form.hidden = false;

  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = [0.23, 1, 0.32, 1];
  var TOTAL = 5, KEY = 'cg_estimate';
  var steps = Array.prototype.slice.call(form.querySelectorAll('.est-step'));
  var label = form.querySelector('[data-est-label]');
  var bar = form.querySelector('[data-est-bar]');
  var back = form.querySelector('[data-est-back]');
  var nextBtn = form.querySelector('[data-est-next]');
  var submit = form.querySelector('[data-est-submit]');
  var stage = form.querySelector('[data-est-stage]');
  var step = 1, maxStep = 1, sent = false;

  // ---- answers <-> inputs ---------------------------------------------------
  function collect() {
    var a = {};
    form.querySelectorAll('input[name^="a_"]').forEach(function (el) {
      var k = el.name.slice(2);
      if (el.type === 'checkbox') {
        if (!a[k]) a[k] = [];
        if (el.checked && isVisible(el)) a[k].push(el.value);
      } else if (el.type === 'radio' && el.checked && isVisible(el)) a[k] = el.value;
    });
    Object.keys(a).forEach(function (k) { if (Array.isArray(a[k]) && !a[k].length) delete a[k]; });
    if (a.budget === '') delete a.budget;
    return a;
  }
  // an answer to a question that is hidden (service not chosen) doesn't count
  function isVisible(el) {
    var svc = el.closest('[data-for-service]');
    var cond = el.closest('[data-show-if]');
    return !(svc && svc.hidden) && !(cond && cond.hidden);
  }
  function apply(a) {
    form.querySelectorAll('input[name^="a_"]').forEach(function (el) {
      var v = a[el.name.slice(2)];
      el.checked = Array.isArray(v) ? v.indexOf(el.value) > -1 : v === el.value;
    });
  }
  function sync() {
    var a = collect();
    var services = (a.services || []);
    form.querySelectorAll('[data-for-service]').forEach(function (g) { g.hidden = services.indexOf(g.getAttribute('data-for-service')) === -1; });
    form.querySelectorAll('[data-show-if]').forEach(function (g) {
      var p = g.getAttribute('data-show-if').split('=');
      g.hidden = collect()[p[0]] !== p[1];
    });
    a = collect();
    form._answers = a;
    form.querySelector('input[name="service"]').value = services[0] || '';
    form.querySelector('input[name="budget"]').value = a.budget || '';
    try { sessionStorage.setItem(KEY, JSON.stringify({ answers: a, step: step })); } catch (e) { /* storage blocked */ }
    return a;
  }

  // ---- steps -------------------------------------------------------------------
  function summary(a) {
    var out = form.querySelector('[data-est-summary]');
    if (!out) return;
    var text = function (name, value) {
      var el = form.querySelector('input[name="a_' + name + '"][value="' + value + '"]');
      return el ? el.nextElementSibling.textContent.trim() : value;
    };
    var lines = [];
    if (a.services) lines.push(a.services.map(function (v) { return text('services', v); }).join(', '));
    ['pages', 'ecommerce', 'products', 'branding_need', 'video_type', 'video_length', 'app_platforms', 'app_backend'].forEach(function (k) { if (a[k]) lines.push(text(k, a[k])); });
    if (a.channels) lines.push(a.channels.map(function (v) { return text('channels', v); }).join(', '));
    if (a.extras) lines.push('Extras: ' + a.extras.map(function (v) { return text('extras', v); }).join(', '));
    if (a.timeline) lines.push('Timeline: ' + text('timeline', a.timeline));
    if (a.budget) lines.push('Budget: ' + text('budget', a.budget));
    out.innerHTML = '';
    lines.forEach(function (l) { var li = document.createElement('li'); li.textContent = l; out.appendChild(li); });
  }

  function show(n, dir) {
    var from = steps[step - 1], to = steps[n - 1];
    step = n; maxStep = Math.max(maxStep, n);
    label.textContent = 'Step ' + n + ' of ' + TOTAL;
    bar.style.transform = 'scaleX(' + (n / TOTAL) + ')';
    back.hidden = n === 1;
    nextBtn.hidden = n === TOTAL;
    submit.hidden = n !== TOTAL;
    if (n === TOTAL) summary(sync()); else sync();
    document.dispatchEvent(new CustomEvent('est:progress', { detail: { step: n, answers: form._answers } }));
    if (from === to) { to.hidden = false; return; }
    var focusTarget = function () {
      var t = n === TOTAL ? to.querySelector('input[name="name"]') : to.querySelector('legend');
      if (t) { if (t.tagName === 'LEGEND') { t.tabIndex = -1; } t.focus({ preventScroll: true }); }
    };
    if (reduce || !M || !dir) { from.hidden = true; to.hidden = false; focusTarget(); return; }
    // crossfade: the old step leaves while the new one arrives, without stacking in the layout
    var h = from.offsetHeight;
    stage.style.minHeight = h + 'px';
    from.style.position = 'absolute'; from.style.inset = '0 0 auto 0';
    to.hidden = false;
    M.animate(from, { opacity: [1, 0], transform: ['translateX(0)', 'translateX(' + (-24 * dir) + 'px)'] }, { duration: 0.2, ease: EASE })
      .then(function () { from.hidden = true; from.style.position = ''; from.style.inset = ''; from.style.opacity = ''; from.style.transform = ''; stage.style.minHeight = ''; });
    M.animate(to, { opacity: [0, 1], transform: ['translateX(' + (24 * dir) + 'px)', 'translateX(0)'] }, { duration: 0.25, ease: EASE });
    focusTarget();
  }

  function validStep() {
    var err = steps[step - 1].querySelector('[data-est-error]');
    if (step === 1) {
      var ok = (collect().services || []).length > 0;
      if (err) { err.hidden = ok; err.textContent = ok ? '' : 'Pick at least one to continue.'; }
      return ok;
    }
    return true;
  }
  function next() { if (step < TOTAL && validStep()) show(step + 1, 1); }
  nextBtn.addEventListener('click', next);
  back.addEventListener('click', function () { if (step > 1) show(step - 1, -1); });
  form.addEventListener('change', function () { sync(); var err = form.querySelector('[data-est-error]'); if (err && step === 1 && (collect().services || []).length) err.hidden = true; });
  // Enter on steps 1–4 moves forward instead of submitting the whole form
  form.addEventListener('submit', function (e) { if (step < TOTAL) { e.preventDefault(); e.stopImmediatePropagation(); next(); } }, true);
  form.addEventListener('lead:sent', function () { sent = true; try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ } });

  // ---- drop-off beacon ----------------------------------------------------------
  window.addEventListener('pagehide', function () {
    if (sent || maxStep < 2 || !navigator.sendBeacon) return;
    var body = JSON.stringify({ answers: collect(), last_step: maxStep });
    navigator.sendBeacon('/api/estimate-partial', new Blob([body], { type: 'application/json' }));
  });

  // ---- start: ?service=… pre-answers step 1; otherwise resume a saved session ---------
  var q = new URLSearchParams(location.search).get('service');
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
  if (q && form.querySelector('input[name="a_services"][value="' + q + '"]')) {
    apply({ services: [q] }); sync(); show(2, 0);
  } else if (saved && saved.answers) {
    apply(saved.answers); sync(); show(Math.min(Math.max(1, saved.step || 1), TOTAL), 0);
  } else { sync(); show(1, 0); }
})();
