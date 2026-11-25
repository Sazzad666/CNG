'use strict';
// Lead alert email to the agency. Never throws: a failed email must never lose or block a lead.
const config = require('../config');

let transport = null;
function getTransport() {
  if (transport) return transport;
  const nodemailer = require('nodemailer');
  const { host, port, user, pass } = config.smtp;
  transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: user ? { user, pass } : undefined });
  return transport;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TYPE_LABEL = { enquiry: 'New enquiry', estimate: 'New project estimate', audit: 'New free audit request' };

function render(lead) {
  const rows = [
    ['Name', lead.name], ['Phone', lead.phone], ['Email', lead.email], ['Service', lead.service], ['Budget', lead.budget],
    ['Website', lead.website], ['Message', lead.message], ['Page', lead.source_page],
    ['Source', [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ')], ['Referrer', lead.referrer],
  ].filter(([, v]) => v);
  const answers = lead.answers ? `<h3 style="margin:24px 0 8px">Estimator answers</h3><pre style="background:#f4f4f0;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(JSON.stringify(lead.answers, null, 2))}</pre>` : '';
  const link = `${config.baseUrl}/admin/leads/${lead.id}`;
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#0B0F0C">
<h2 style="margin:0 0 16px">${esc(TYPE_LABEL[lead.type] || 'New lead')}: ${esc(lead.name)}</h2>
<table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#55625A;vertical-align:top">${k}</td><td style="padding:4px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>
${answers}
<p style="margin-top:24px"><a href="${esc(link)}" style="background:#C6F432;color:#0B0F0C;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:600">Open in admin</a></p></div>`;
}

/** → { sent: true } | { sent: false, reason } */
async function sendLeadAlert(lead) {
  try {
    if (!config.smtp.host || !config.smtp.alertTo) return { sent: false, reason: 'smtp-not-configured' };
    await getTransport().sendMail({
      from: config.smtp.from || config.smtp.user, to: config.smtp.alertTo, replyTo: lead.email || undefined,
      subject: `${TYPE_LABEL[lead.type] || 'New lead'}: ${lead.name} (${lead.phone})`, html: render(lead),
    });
    return { sent: true };
  } catch (e) {
    console.error('Lead alert email failed:', e.message);
    return { sent: false, reason: 'send-failed' };
  }
}

module.exports = { sendLeadAlert, render };
