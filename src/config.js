'use strict';
require('dotenv').config({ quiet: true });
const site = require('../config/site');

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const config = {
  isProd,
  isTest: env.NODE_ENV === 'test',
  port: Number(env.PORT || 3000),
  host: env.HOST || undefined,
  baseUrl: (env.BASE_URL || `http://localhost:${env.PORT || 3000}`).replace(/\/+$/, ''),
  sessionSecret: env.SESSION_SECRET || '',
  trustProxy: /^[1-9]$/.test(env.TRUST_PROXY || '') ? Number(env.TRUST_PROXY) : (env.TRUST_PROXY === 'true' ? 1 : 0),
  db: {
    host: env.DB_HOST || 'localhost', port: Number(env.DB_PORT || 3306),
    database: env.DB_NAME || 'cng', user: env.DB_USER || 'cng', password: env.DB_PASS || '',
  },
  smtp: {
    host: env.SMTP_HOST || '', port: Number(env.SMTP_PORT || 465), user: env.SMTP_USER || '', pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || '', alertTo: env.LEAD_ALERT_TO || '',
  },
  tracking: { ga4: env.GA4_ID || '', metaPixel: env.META_PIXEL_ID || '' },
  site,
};

if (isProd) {
  if (!config.sessionSecret || config.sessionSecret.length < 32) throw new Error('SESSION_SECRET must be a long random value in production.');
  if (!/^https:\/\//.test(config.baseUrl)) throw new Error('BASE_URL must start with https:// in production.');
  if (!config.trustProxy) throw new Error('Set TRUST_PROXY=1 in production (the app runs behind nginx).');
}
if (!config.sessionSecret) config.sessionSecret = 'dev-only-secret-' + require('crypto').randomBytes(8).toString('hex');

module.exports = config;
