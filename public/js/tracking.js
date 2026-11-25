/* Conversion tracking loader (only included when GA4_ID or META_PIXEL_ID is set in .env).
   Defines window.gtag and window.fbq so lead forms can report generate_lead / Lead. Served from our own
   origin so the content security policy needs no inline scripts. */
(function () {
  'use strict';
  var me = document.currentScript;
  var ga4 = me && me.getAttribute('data-ga4');
  var pixel = me && me.getAttribute('data-pixel');

  if (ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ga4, { transport_type: 'beacon' });
  }

  if (pixel) {
    var n = window.fbq = function () {
      if (n.callMethod) n.callMethod.apply(n, arguments); else n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var s = document.createElement('script');
    s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    window.fbq('init', pixel);
    window.fbq('track', 'PageView');
  }
})();
