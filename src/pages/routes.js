'use strict';
const express = require('express');
const config = require('../config');
const content = require('../content');

const router = express.Router();
const { site } = config;

router.use((req, res, next) => { Object.assign(res.locals, content.helpers, { content }); next(); });

const localBusiness = () => ({
  '@context': 'https://schema.org', '@type': 'ProfessionalService', name: site.name, url: config.baseUrl + '/',
  telephone: site.phoneHref.replace('tel:', ''), email: site.email, image: config.baseUrl + '/brand/og.png',
  address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: 'BD' },
  areaServed: 'Bangladesh', priceRange: '৳৳৳',
  sameAs: site.socials.map((s) => s.href).filter((h) => /^https?:/.test(h)),
});

router.get('/', (req, res) => res.render('home', {
  jsonLd: localBusiness(),
  meta: { title: 'Click & Grow | Web design, branding and growth agency in Dhaka', description: 'Click & Grow designs websites, brands, apps and campaigns for ambitious businesses in Bangladesh. Talk to a senior team in Dhaka today.' },
}));

router.get('/services', (req, res) => res.render('services', {
  meta: { title: 'Services | Click & Grow, Dhaka', description: 'Web design, branding, video, apps and digital marketing from one senior team in Dhaka. See what we do and start a project.' },
}));

router.get('/services/:key', (req, res, next) => {
  const s = content.service(req.params.key);
  if (!s) return next();
  res.render('service', {
    s, work: content.projects(s.key),
    meta: { title: `${s.label} in Dhaka | Click & Grow`, description: s.intro.slice(0, 155) },
  });
});

router.get('/work', (req, res) => res.render('work', {
  meta: { title: 'Our work | Click & Grow', description: 'Websites, brands, apps and campaigns we have built for businesses across Bangladesh. Each project starts with a clear goal and ends with numbers.' },
}));

router.get('/work/:slug', (req, res, next) => {
  const p = content.project(req.params.slug);
  if (!p) return next();
  const all = content.projects();
  const next_ = all[(all.indexOf(p) + 1) % all.length];
  res.render('project', {
    p, nextProject: next_,
    meta: { title: `${p.client}: ${p.type} | Click & Grow`, description: `${p.summary} ${p.result}. A sample project showing how Click & Grow works.`, ogImage: `/img/${p.photos[0]}-1024.webp` },
  });
});

router.get('/about', (req, res) => res.render('about', {
  meta: { title: 'About us | Click & Grow, Dhaka', description: 'Click & Grow is a senior team of designers, developers and marketers in Dhaka. Meet the people who will work on your project.' },
}));

router.get('/estimate', (req, res) => res.render('estimate', {
  meta: { title: 'Estimate your project | Click & Grow', description: 'Answer five quick questions about your website, brand, app or campaign and get a custom quote from Click & Grow within 24 hours.' },
}));

router.get('/contact', (req, res) => res.render('contact', {
  formType: 'enquiry', values: { service: req.query.service || '' }, errors: {},
  meta: { title: 'Contact | Click & Grow, Dhaka', description: `Tell us about your project. Call ${site.phone}, message us on WhatsApp, or send the form and we’ll call you within one business day.` },
}));

router.get('/privacy', (req, res) => res.render('privacy', {
  meta: { title: 'Privacy | Click & Grow', description: 'What Click & Grow collects when you send a form on this website, why we keep it, and how to ask us to delete it.' },
}));

router.get('/credits', (req, res) => res.render('credits', {
  meta: { title: 'Photo credits | Click & Grow', description: 'The photographers whose work appears on this website, courtesy of Unsplash. Thank you to every one of them.' },
}));

const PUBLIC = () => ['/', '/services', ...content.services().map((s) => '/services/' + s.key), '/work',
  ...content.projects().map((p) => '/work/' + p.slug), '/about', '/estimate', '/contact', '/privacy'];

router.get('/sitemap.xml', (req, res) => {
  const urls = PUBLIC().map((u) => `  <url><loc>${config.baseUrl}${u}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});
router.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /thank-you\n\nSitemap: ${config.baseUrl}/sitemap.xml\n`));

module.exports = router;
