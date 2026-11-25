'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./src/config');

const app = express();
app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', config.trustProxy);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const scriptSrc = ["'self'"], connectSrc = ["'self'"], imgSrc = ["'self'", 'data:'];
if (config.tracking.ga4) { scriptSrc.push('https://www.googletagmanager.com'); connectSrc.push('https://*.google-analytics.com', 'https://*.googletagmanager.com'); imgSrc.push('https://*.google-analytics.com'); }
if (config.tracking.metaPixel) { scriptSrc.push('https://connect.facebook.net'); connectSrc.push('https://www.facebook.com'); imgSrc.push('https://www.facebook.com'); }
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': scriptSrc, 'connect-src': connectSrc, 'img-src': imgSrc,
      'style-src': ["'self'", "'unsafe-inline'"], 'font-src': ["'self'"],
      'frame-src': ['https://www.google.com'],
      'upgrade-insecure-requests': config.isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  strictTransportSecurity: config.isProd ? { maxAge: 31536000, includeSubDomains: false } : false,
}));
app.use(compression());

// Libraries served straight from node_modules so they update with npm.
const vendor = {
  '/vendor/motion.js': 'node_modules/motion/dist/motion.js',
  '/vendor/gsap.min.js': 'node_modules/gsap/dist/gsap.min.js',
  '/vendor/ScrollTrigger.min.js': 'node_modules/gsap/dist/ScrollTrigger.min.js',
};
for (const [url, file] of Object.entries(vendor)) {
  app.get(url, (req, res) => res.sendFile(path.join(__dirname, file), { maxAge: config.isProd ? '30d' : 0 }));
}
app.use(express.static(path.join(__dirname, 'public'), { maxAge: config.isProd ? '7d' : 0 }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.json({ limit: '50kb' }));

app.locals.site = config.site;
app.locals.baseUrl = config.baseUrl;
app.locals.tracking = config.tracking;
app.locals.year = new Date().getFullYear();
app.use((req, res, next) => { res.locals.path = req.path; res.locals.meta = {}; Object.assign(res.locals, require('./src/content').helpers); next(); });

const health = async (req, res) => {
  try { await require('./src/db').pool.query('SELECT 1'); res.set('Cache-Control', 'no-store').json({ ok: true }); }
  catch (e) { res.status(503).json({ ok: false, error: 'database' }); }
};
app.get('/healthz', health);

const mount = (mod) => { try { app.use(require(mod)); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND' || !e.message.includes(mod.replace('./', ''))) throw e; } };
mount('./src/leads/routes');
mount('./src/admin/routes');
mount('./src/pages/routes');

app.use((req, res) => res.status(404).render('not-found', { meta: { title: 'Page not found — Click & Grow' } }));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  if (res.headersSent) return;
  res.status(500);
  if ((req.get('accept') || '').includes('json')) return res.json({ ok: false, message: 'Something went wrong on our side. Please try again, or call us.' });
  res.send('<h1 style="font-family:sans-serif">Something went wrong on our side. Please call +880 1732-508485.</h1>');
});

if (require.main === module) {
  const server = app.listen(config.port, config.host, () => console.log(`Click & Grow running on ${config.baseUrl}`));
  const stop = () => server.close(() => require('./src/db').pool.end().catch(() => {}).then(() => process.exit(0)));
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
}
module.exports = app;
