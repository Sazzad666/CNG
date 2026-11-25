'use strict';
// Content from content/*.json, loaded once, plus small view helpers.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'content');
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

const data = {
  services: load('services.json'), projects: load('projects.json'), testimonials: load('testimonials.json'),
  faqs: load('faqs.json'), team: load('team.json'), clients: load('clients.json'),
  credits: fs.existsSync(path.join(dir, 'credits.json')) ? load('credits.json') : [],
};
const photoByName = new Map(data.credits.map((c) => [c.name, c]));

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 'Websites that *grow*' → escaped HTML with the starred word in the serif accent. */
function accent(s, cls = 'text-lime') {
  return esc(s).replace(/\*([^*]+)\*/g, `<em class="accent ${cls}">$1</em>`);
}
const plain = (s) => String(s || '').replace(/\*/g, '');

/** Responsive <img> for a photo from content/photos.json. */
function img(name, o = {}) {
  const c = photoByName.get(name);
  if (!c) return `<!-- missing photo ${esc(name)} -->`;
  const sizes = c.sizes;
  const w = sizes[sizes.length - 1];
  const h = Math.round(w / c.ratio);
  const srcset = sizes.map((s) => `/img/${name}-${s}.webp ${s}w`).join(', ');
  const src = `/img/${name}-${sizes[Math.min(1, sizes.length - 1)]}.webp`;
  const alt = o.alt != null ? o.alt : c.alt;
  return `<img src="${src}" srcset="${srcset}" sizes="${esc(o.sizes || '100vw')}" width="${w}" height="${h}" alt="${esc(alt)}"`
    + ` class="${esc(o.cls || '')}" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

module.exports = {
  services: () => data.services,
  service: (key) => data.services.find((s) => s.key === key) || null,
  projects: (service) => (service ? data.projects.filter((p) => p.services.includes(service)) : data.projects),
  project: (slug) => data.projects.find((p) => p.slug === slug) || null,
  testimonials: () => data.testimonials,
  faqs: () => data.faqs,
  team: () => data.team,
  clients: () => data.clients,
  credits: () => data.credits,
  helpers: { img, accent, plain, esc },
};
