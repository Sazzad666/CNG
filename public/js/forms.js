/* Lead forms: post as JSON, show errors next to each field, never submit twice.
   Without JS the same forms post normally to /api/leads and land on /thank-you. */
(function () {
  'use strict';
  function fillAttribution(form) {
    try {
      var s = window.sessionStorage;
      ['utm_source', 'utm_medium', 'utm_campaign', 'referrer'].forEach(function (k) {
        var input = form.querySelector('input[name="' + k + '"]');
        if (input && !input.value && s.getItem('cg_' + k)) input.value = s.getItem('cg_' + k);
      });
      var src = form.querySelector('input[name="source_page"]');
      if (src) src.value = location.pathname;
    } catch (e) { /* storage blocked */ }
  }

  function setError(form, name, msg) {
    var input = form.querySelector('[name="' + name + '"]');
    var field = input && input.closest('.field');
    var out = field && field.querySelector('.error');
    if (!field || !out) return false;
    field.classList.toggle('has-error', !!msg);
    out.hidden = !msg;
    out.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    return true;
  }

  function track(type) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { lead_type: type });
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_category: type });
    } catch (e) { /* ignore */ }
  }

  function bind(form) {
    if (form._bound) return;
    form._bound = true;
    fillAttribution(form);
    // clear a field's error as soon as the visitor fixes it
    form.addEventListener('input', function (e) { if (e.target.name) setError(form, e.target.name, ''); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form._sending) return;
      var btn = form.querySelector('[data-submit]');
      var label = btn && btn.querySelector('[data-label]');
      var status = form.querySelector('.form-status');
      var original = label ? label.textContent : '';
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (form._answers) data.answers = form._answers;

      form._sending = true;
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
      if (label) label.textContent = 'Sending…';
      if (status) { status.hidden = true; status.textContent = ''; }
      form.querySelectorAll('.field .error').forEach(function (el) { setError(form, (el.id.split('-')[1] || ''), ''); });

      fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
          if (res.body && res.body.ok) {
            track(data.type || 'enquiry');
            if (form.dispatchEvent(new CustomEvent('lead:sent', { cancelable: true, detail: res.body }))) location.assign(res.body.redirect || '/thank-you');
            return;
          }
          var first = null;
          if (res.body && res.body.errors) {
            Object.keys(res.body.errors).forEach(function (k) {
              if (setError(form, k, res.body.errors[k]) && !first) first = form.querySelector('[name="' + k + '"]');
              else if (status && !first) { status.hidden = false; status.textContent = res.body.errors[k]; }
            });
          } else if (status) {
            status.hidden = false;
            status.textContent = (res.body && res.body.message) || 'Something went wrong. Please try again, or call us.';
          }
          if (first) first.focus();
          throw new Error('not ok');
        })
        .catch(function (err) {
          if (err && err.message !== 'not ok' && status) { status.hidden = false; status.textContent = 'You seem to be offline. Check your connection and try again.'; }
          form._sending = false;
          if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
          if (label) label.textContent = original;
        });
    });
  }

  function boot() { document.querySelectorAll('form[data-lead-form]').forEach(bind); }
  window.cgBindLeadForm = bind;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
