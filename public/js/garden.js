/* Digital Garden: the cursor seed, fireflies, click-to-plant, the scroll vine, and every scene that grows.
   GSAP (window.gsap + ScrollTrigger) drives scenes; without it, or under reduced motion, everything shows grown. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function len(p) { try { return p.getTotalLength(); } catch (e) { return 600; } }
  function prepDraw(p) { var l = len(p); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; return l; }
  var interactive = 'a, button, input, select, textarea, label, summary, form, dialog, [role="button"], .bed, .frame, .est-choice';

  /* ---------- cursor seed / watering can ---------- */
  var cur = $('#cur');
  if (fine && cur && !reduce) {
    document.documentElement.classList.add('has-cur');
    var cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; cur.classList.toggle('water', !!e.target.closest(interactive)); });
    (function loop() { cx += (tx - cx) * .35; cy += (ty - cy) * .35; cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
  }

  /* ---------- fireflies in the hero ---------- */
  var cv = $('#flies'), ctx = cv && cv.getContext('2d');
  if (ctx) {
    var flies = [], on = true, dpr = Math.min(2, devicePixelRatio || 1);
    var size = function () { cv.width = cv.offsetWidth * dpr; cv.height = cv.offsetHeight * dpr; };
    size(); addEventListener('resize', size);
    for (var i = 0; i < (innerWidth < 700 ? 20 : 44); i++) flies.push({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.2, s: .2 + Math.random() * .6, p: Math.random() * 6.28, dx: (Math.random() - .5) * .0006, dy: -.0002 - Math.random() * .0005 });
    var draw = function (t) {
      if (on) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        flies.forEach(function (f) {
          if (!reduce) { f.x += f.dx; f.y += f.dy; if (f.y < -.02) { f.y = 1.02; f.x = Math.random(); } if (f.x < 0 || f.x > 1) f.dx *= -1; }
          var a = reduce ? .5 : .35 + .65 * Math.abs(Math.sin(t / 1000 * f.s + f.p)), x = f.x * cv.width, y = f.y * cv.height, r = f.r * dpr;
          var g = ctx.createRadialGradient(x, y, 0, x, y, r * 6); g.addColorStop(0, 'rgba(245,226,122,' + a + ')'); g.addColorStop(1, 'rgba(245,226,122,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 6, 0, 6.28); ctx.fill();
        });
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { on = es[0].isIntersecting; }).observe(cv);
  }

  /* ---------- plants: bloom on hover / tap ---------- */
  $$('.bed').forEach(function (bed) {
    if (fine) { bed.addEventListener('pointerenter', function () { bed.classList.add('open'); }); bed.addEventListener('pointerleave', function () { if (!bed.hasAttribute('data-keep')) bed.classList.remove('open'); }); }
    bed.addEventListener('focus', function () { bed.classList.add('open'); });
    bed.addEventListener('blur', function () { if (!bed.hasAttribute('data-keep')) bed.classList.remove('open'); });
    if (!fine && bed.tagName === 'A') bed.addEventListener('click', function (e) { if (!bed.classList.contains('open')) { e.preventDefault(); $$('.bed').forEach(function (b) { b.classList.remove('open'); }); bed.classList.add('open'); } });
  });
  if (!fine) $$('.hang').forEach(function (h) { h.querySelector('.frame').addEventListener('click', function (e) { if (!h.classList.contains('show')) { e.preventDefault(); $$('.hang').forEach(function (x) { x.classList.remove('show'); }); h.classList.add('show'); } }); });

  if (!G || reduce) {
    $$('.bed[data-bed]').forEach(function (b) { b.classList.add('open'); });
    $$('.step').forEach(function (b) { b.classList.add('on'); });
    return;
  }
  if (window.ScrollTrigger) G.registerPlugin(ScrollTrigger);

  /* ---------- hero: the gardener plants the seed ---------- */
  if ($('#scene')) {
    ['#vine', '#vine2', '#vine3'].forEach(function (s) { prepDraw($(s)); });
    G.set('.vl', { scale: 0, transformOrigin: '0% 72%' });
    G.set('.vf', { scale: 0, transformOrigin: '50% 50%' });
    G.timeline({ delay: .25 })
      .from('.hl', { y: 40, opacity: 0, duration: .8, stagger: .08, ease: 'expo.out' }, 0)
      .fromTo('#mascotWrap', { attr: { transform: 'translate(900 548)' } }, { attr: { transform: 'translate(360 548)' }, duration: 1.1, ease: 'power3.out' }, .2)
      .to('#mbody', { y: -14, duration: .14, yoyo: true, repeat: 5, ease: 'sine.inOut' }, .2)
      .to('#mascotWrap', { attr: { transform: 'translate(282 548)' }, duration: .5, ease: 'power2.inOut' }, 1.3)
      .to('#mbody', { y: -70, duration: .32, ease: 'power2.out' }, 1.85)
      .to('#mbody', { y: 0, duration: .26, ease: 'power3.in' }, 2.17)
      .to('#mbody', { scaleY: .82, scaleX: 1.12, transformOrigin: '50% 100%', duration: .1, yoyo: true, repeat: 1 }, 2.43)
      .fromTo('#ring', { attr: { r: 14 }, opacity: 1 }, { attr: { r: 90 }, opacity: 0, duration: .8, ease: 'expo.out' }, 2.45)
      .to('#seedHalo', { opacity: 1, duration: .6 }, 2.45)
      .to('#mascotWrap', { attr: { transform: 'translate(352 548)' }, duration: .5, ease: 'power2.out' }, 2.6)
      .to('#vine', { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 2.55)
      .to(['#vine2', '#vine3'], { strokeDashoffset: 0, duration: .8, ease: 'power2.out', stagger: .25 }, 3.1)
      .to('.vl', { scale: 1, duration: .7, ease: 'back.out(2.2)', stagger: .09 }, 2.8)
      .to('.vf', { scale: 1, rotate: 30, duration: .9, ease: 'back.out(2)', stagger: .15 }, 3.7);
    G.to('#mbody', { y: -4, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 4.4 });
    G.to('#msprout', { rotate: 8, transformOrigin: '0% 100%', duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    (function blink() { G.to('#lids', { attr: { height: 24 }, duration: .08, yoyo: true, repeat: 1, delay: 2.5 + Math.random() * 3, onComplete: blink }); })();
    var pupils = $$('.pupil'), scene = $('#scene');
    addEventListener('pointermove', function (e) {
      var b = scene.getBoundingClientRect(), dx = e.clientX - (b.left + b.width * .62), dy = e.clientY - (b.top + b.height * .8), d = Math.hypot(dx, dy) || 1;
      pupils.forEach(function (p) { G.to(p, { x: dx / d * 3, y: dy / d * 3, duration: .3 }); });
    });
    var poke = function () {
      G.timeline().to('#mbody', { y: -40, rotate: -10, transformOrigin: '50% 100%', duration: .22, ease: 'power2.out' }).to('#mbody', { y: 0, rotate: 0, duration: .5, ease: 'bounce.out' });
      G.fromTo('#msprout', { scale: 1 }, { scale: 1.4, transformOrigin: '0% 100%', duration: .2, yoyo: true, repeat: 1 });
    };
    $('#mascot').addEventListener('click', function (e) { e.stopPropagation(); poke(); });
    $('#mascot').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });
  }

  /* ---------- click anywhere: plant a sprout ---------- */
  var planted = [];
  document.addEventListener('click', function (e) {
    if (e.button !== 0 || e.target.closest(interactive) || document.querySelector('dialog[open]')) return;
    var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 60 70'); s.setAttribute('class', 'sprout'); s.setAttribute('aria-hidden', 'true');
    var hue = Math.random() < .3 ? '#FF9EC0' : '#C6F432';
    s.innerHTML = '<ellipse cx="30" cy="66" rx="10" ry="3" fill="#000" opacity=".4"/><path class="st" d="M30 66 C 30 50, 26 40, 30 26" fill="none" stroke="#7FBF3A" stroke-width="3" stroke-linecap="round"/><path class="l1" d="M30 40 c -10 -10 -22 -6 -24 0 c 8 6 18 6 24 0z" fill="#7FBF3A"/><path class="l2" d="M30 34 c 10 -10 22 -6 24 0 c -8 6 -18 6 -24 0z" fill="#7FBF3A"/><circle class="bud" cx="30" cy="24" r="6" fill="' + hue + '"/>';
    s.style.left = e.pageX + 'px'; s.style.top = e.pageY + 'px';
    document.body.appendChild(s); planted.push(s);
    if (planted.length > 30) planted.shift().remove();
    var st = s.querySelector('.st'); prepDraw(st);
    G.timeline().to(st, { strokeDashoffset: 0, duration: .45, ease: 'power2.out' })
      .from([s.querySelector('.l1'), s.querySelector('.l2')], { scale: 0, transformOrigin: '100% 50%', duration: .45, ease: 'back.out(2.5)', stagger: .08 }, .2)
      .from(s.querySelector('.bud'), { scale: 0, transformOrigin: '50% 50%', duration: .5, ease: 'back.out(3)' }, .4)
      .to(s, { opacity: 0, y: 10, duration: 1.2, delay: 7, onComplete: function () { s.remove(); } });
  });

  if (!window.ScrollTrigger) return;

  /* ---------- the vine down the left edge ---------- */
  var sp = $('#stemPath');
  if (sp) { prepDraw(sp); G.to(sp, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: .6 } }); }

  /* ---------- service plants: each blooms once as it arrives ---------- */
  var beds = $$('.beds .bed');
  if (beds.length) {
    G.from(beds, { y: 60, opacity: 0, duration: .9, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.beds', start: 'top 85%' } });
    ScrollTrigger.create({ trigger: '.beds', start: 'top 70%', once: true, onEnter: function () {
      beds.forEach(function (b, i) { setTimeout(function () { b.classList.add('open'); setTimeout(function () { if (!b.matches(':hover')) b.classList.remove('open'); }, 900); }, i * 140); });
    } });
  }
  $$('.bed.big').forEach(function (b) { setTimeout(function () { b.classList.add('open'); }, 500); });

  /* ---------- harvest: frames drop onto the branch ---------- */
  $$('.branch').forEach(function (br) {
    var path = br.querySelector('svg path');
    if (path) G.from(path, { strokeDasharray: 1200, strokeDashoffset: 1200, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: br, start: 'top 85%' } });
    G.from(br.querySelectorAll('.hang'), { y: -120, opacity: 0, duration: 1.1, ease: 'bounce.out', stagger: .1, scrollTrigger: { trigger: br, start: 'top 80%' } });
  });

  /* ---------- seasons: scrolling grows one plant ---------- */
  var ss = $('#sStem');
  if (ss) {
    prepDraw(ss);
    G.set('#sLeaves path', { scale: 0, transformOrigin: '50% 100%' });
    G.set('#sFlower', { scale: 0, rotate: -40, transformOrigin: '50% 50%' });
    G.set('#sFruit circle', { scale: 0, transformOrigin: '50% 50%' });
    var steps = $$('.step');
    G.timeline({ scrollTrigger: { trigger: '.g-seasons .track', start: 'top top', end: 'bottom bottom', scrub: .8,
      onUpdate: function (s) { var k = Math.min(3, Math.floor(s.progress * 4)); steps.forEach(function (st, i) { st.classList.toggle('on', i === k); }); } } })
      .to('#sSeed', { scale: 1.25, transformOrigin: '50% 50%', duration: .5 })
      .to('#sSeed', { scaleY: .7, duration: .3 })
      .to(ss, { strokeDashoffset: 0, duration: 1.4, ease: 'none' })
      .to('#sLeaves path', { scale: 1, stagger: .2, duration: .5, ease: 'back.out(2)' }, '-=1')
      .to('#sFlower', { scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.6)' })
      .to('#sFruit circle', { scale: 1, stagger: .12, duration: .4, ease: 'back.out(3)' });
  }

  /* ---------- three pots ---------- */
  if ($('.pots')) {
    G.timeline({ scrollTrigger: { trigger: '.pots', start: 'top 70%' } })
      .from('#tree', { scale: .2, transformOrigin: '50% 100%', duration: 1.4, ease: 'elastic.out(1, .6)' }, .3)
      .to('#wilt', { rotate: 38, transformOrigin: '50% 100%', duration: 1.6, ease: 'power2.in' }, .5)
      .to('#wilt .wc', { stroke: '#8A7A55', duration: 1.2 }, .6)
      .to('#wilt .wl', { fill: '#8A7A55', opacity: .7, duration: 1.2 }, .6)
      .to('.fall', { opacity: 1, y: 6, duration: .6 }, 1.6)
      .fromTo('#ptag', { rotate: -12, transformOrigin: '0% 0%' }, { rotate: 12, transformOrigin: '0% 0%', duration: .9, yoyo: true, repeat: 3, ease: 'sine.inOut' }, .3);
  }

  /* ---------- pots that grow: the enquiry CTA and the estimator ---------- */
  function potFor(root) {
    var stem = root.querySelector('#potStem'); if (!stem) return null;
    var l = prepDraw(stem);
    G.set(root.querySelectorAll('#potLeaves path'), { scale: 0, transformOrigin: '50% 100%' });
    G.set(root.querySelector('#potFlower'), { scale: 0, transformOrigin: '50% 50%' });
    var api = {
      grow: function (k) {
        k = Math.max(.14, Math.min(1, k));
        G.to(stem, { strokeDashoffset: l * (1 - k), duration: .5, ease: 'power2.out' });
        $$('#potLeaves path', root).forEach(function (lf, i) { G.to(lf, { scale: k > (i + 1) * .28 ? 1 : 0, duration: .5, ease: 'back.out(2)' }); });
        G.fromTo(root.querySelector('#drops'), { opacity: 1, y: -10 }, { opacity: 0, y: 30, duration: .6, ease: 'power1.in', overwrite: true });
      },
      bloom: function () {
        api.grow(1);
        G.fromTo(root.querySelector('#potFlower'), { scale: 0, rotate: -60 }, { scale: 1, rotate: 0, duration: 1.1, ease: 'elastic.out(1, .5)', delay: .2 });
      },
      shake: function () { G.fromTo(root.querySelector('svg'), { x: -6 }, { x: 0, duration: .5, ease: 'elastic.out(1, .3)' }); },
    };
    api.grow(0);
    return api;
  }
  var plant = $('[data-plant]');
  if (plant) {
    var pot = potFor(plant), form = plant.querySelector('form');
    if (pot && form) {
      var water = function () {
        var n = 0; $$('input[name="name"], input[name="phone"], input[name="email"], textarea', form).forEach(function (el) { n += el.value.length; });
        if (form.querySelector('select[name="service"]') && form.querySelector('select[name="service"]').value) n += 6;
        pot.grow(n / 26);
      };
      form.addEventListener('input', water); form.addEventListener('change', water);
      form.addEventListener('lead:sent', function (e) { e.preventDefault(); pot.bloom(); setTimeout(function () { location.assign((e.detail && e.detail.redirect) || '/thank-you'); }, 1300); });
      new MutationObserver(function () { if (form.querySelector('.field.has-error')) pot.shake(); }).observe(form, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }
  }
  var estPot = $('[data-est-pot]');
  if (estPot) {
    var ep = potFor(estPot);
    document.addEventListener('est:progress', function (e) { if (ep) ep.grow(e.detail.step / 5); });
    var ef = $('[data-estimator]');
    if (ef) ef.addEventListener('lead:sent', function (e) { if (!ep) return; e.preventDefault(); ep.bloom(); setTimeout(function () { location.assign((e.detail && e.detail.redirect) || '/thank-you'); }, 1300); });
  }

  /* ---------- thank-you bloom, and the 404 plant that revives ---------- */
  var big = $('#bigBloom');
  if (big) {
    G.set('#bbPetals ellipse', { scale: 0, transformOrigin: '50% 100%' });
    G.timeline({ delay: .2 }).from('#bbStem', { scaleY: 0, transformOrigin: '50% 100%', duration: .8, ease: 'power2.out' })
      .to('#bbPetals ellipse', { scale: 1, duration: .8, stagger: .06, ease: 'back.out(2.4)' }, '-=.2')
      .from('#bbCenter', { scale: 0, transformOrigin: '50% 50%', duration: .5, ease: 'back.out(3)' }, '-=.4');
  }
  var wilt = $('#wiltPlant');
  if (wilt) {
    var revived = false;
    G.set('#wpStem', { rotate: 42, svgOrigin: '100 172' });
    G.set('#wpFlower', { scale: 0, transformOrigin: '50% 50%' });
    wilt.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wilt.dispatchEvent(new Event('click')); } });
    wilt.addEventListener('click', function () {
      if (revived) return; revived = true;
      G.to('#wpStem', { rotate: 0, svgOrigin: '100 172', duration: 1.2, ease: 'elastic.out(1, .5)' });
      G.to('#wpStem path, #wpStem ellipse', { fill: '#7FBF3A', stroke: '#7FBF3A', duration: .8 });
      G.to('#wpFlower', { scale: 1, duration: 1, ease: 'back.out(2)', delay: .4 });
      var hint = $('#wiltHint'); if (hint) hint.textContent = 'There we go. Now let’s get you home.';
    });
  }
})();
