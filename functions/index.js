import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createHash } from 'node:crypto';

const ZOHO_CLIENT_ID = defineSecret('zoho-mail-jobs-client-id');
const ZOHO_CLIENT_SECRET = defineSecret('zoho-mail-jobs-client-secret');
const ZOHO_REFRESH_TOKEN = defineSecret('zoho-mail-jobs-refresh-token');
const ZOHO_ACCOUNT_ID_SECRET = defineSecret('ZOHO_ACCOUNT_ID');

const ZOHO_OAUTH_HOST = 'https://accounts.zoho.com';
const ZOHO_MAIL_HOST = 'https://mail.zoho.com';

const FROM_ADDRESS = 'jobs@msapps.mobi';
const FROM_DISPLAY = 'MSApps Web Contact <jobs@msapps.mobi>';
const TO_ADDRESS = 'info@msapps.mobi';
const REPLY_TO_DEFAULT = 'info@msapps.mobi';

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_PHONE = 32;
const MAX_MESSAGE = 5000;

const ALLOWED_ORIGINS = new Set([
  'https://msapps-website-staging.web.app',
  'https://msapps-website-staging.firebaseapp.com',
  'https://msapps.mobi',
  'https://www.msapps.mobi',
]);

const ipBuckets = new Map();
const RATE_LIMIT_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

function rateLimitCheck(ip) {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) ?? [];
  const fresh = bucket.filter((t) => now - t < HOUR_MS);
  if (fresh.length >= RATE_LIMIT_PER_HOUR) {
    ipBuckets.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  ipBuckets.set(ip, fresh);
  return true;
}

function hashEmail(email) {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 12);
}

// Strip ASCII control characters (NUL through US, plus DEL); keep all printable + Unicode.
const CTRL_RE = /[\x00-\x1F\x7F]/g;
function sanitize(s, max) {
  if (typeof s !== 'string') return '';
  return s.replace(CTRL_RE, '').trim().slice(0, max);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function detectLang(req, bodyLang) {
  if (bodyLang === 'he' || bodyLang === 'en') return bodyLang;
  const accept = (req.headers['accept-language'] || '').toLowerCase();
  if (accept.startsWith('he')) return 'he';
  return 'en';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildOpsEmail({ name, email, phone, message, lang, ip, userAgent }) {
  const subject = `[Web Contact] ${name} — ${phone}`;
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #E8611A; border-bottom: 2px solid #E8611A; padding-bottom: 8px;">New Contact (lang=${lang})</h2>
  <table style="border-collapse: collapse; width: 100%;">
    <tr><td style="padding: 6px 12px; font-weight: 600; background: #f4f4f5;">Name</td><td style="padding: 6px 12px;">${escapeHtml(name)}</td></tr>
    <tr><td style="padding: 6px 12px; font-weight: 600; background: #f4f4f5;">Email</td><td style="padding: 6px 12px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
    <tr><td style="padding: 6px 12px; font-weight: 600; background: #f4f4f5;">Phone</td><td style="padding: 6px 12px;"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
  </table>
  <h3 style="margin-top: 24px; color: #111;">Message</h3>
  <pre style="white-space: pre-wrap; background: #f9fafb; padding: 16px; border-radius: 6px; font-family: inherit;">${escapeHtml(message)}</pre>
  <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
    IP ${escapeHtml(ip)} · UA ${escapeHtml(userAgent)} · ${new Date().toISOString()}
  </p>
</div>`.trim();
  return { subject, html };
}

function buildUserAutoReply({ name, lang }) {
  if (lang === 'he') {
    return {
      subject: 'תודה שפנית ל-MSApps',
      html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;" dir="rtl"><p>שלום ${escapeHtml(name)},</p><p>קיבלנו את הפנייה שלך ונחזור אליך בהקדם, בדרך כלל תוך יום עסקים.</p><p>אם זה דחוף, ניתן להתקשר <a href="tel:+972554338803" dir="ltr">055-4338803</a> או להגיע אלינו ב-<a href="https://wa.me/972544255549">WhatsApp</a>.</p><p>תודה,<br/>צוות <strong>MSApps</strong><br/><a href="https://msapps.mobi">msapps.mobi</a></p></div>`,
    };
  }
  return {
    subject: 'Thanks for reaching out to MSApps',
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;"><p>Hi ${escapeHtml(name)},</p><p>We got your message and will get back to you shortly, usually within one business day.</p><p>If it's urgent, call <a href="tel:+972554338803">+972-55-433-8803</a> or message us on <a href="https://wa.me/972544255549">WhatsApp</a>.</p><p>Thanks,<br/>The <strong>MSApps</strong> Team<br/><a href="https://msapps.mobi">msapps.mobi</a></p></div>`,
  };
}

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

async function getZohoAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessTokenExpiresAt - now > 60_000) {
    return cachedAccessToken;
  }
  const body = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN.value(),
    client_id: ZOHO_CLIENT_ID.value(),
    client_secret: ZOHO_CLIENT_SECRET.value(),
    grant_type: 'refresh_token',
  });
  const res = await fetch(`${ZOHO_OAUTH_HOST}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    const err = new Error(`zoho_oauth_failed status=${res.status} body=${JSON.stringify(data).slice(0, 200)}`);
    throw err;
  }
  cachedAccessToken = data.access_token;
  cachedAccessTokenExpiresAt = now + (data.expires_in ?? 3600) * 1000;
  return cachedAccessToken;
}

// Note: we intentionally do NOT pass replyTo here. Zoho Mail rejects sends with
// `You need to verify the ReplyTo address` (HTTP 500) when the Reply-To is not in
// the jobs@msapps.mobi mailbox's verified-addresses list. The submitter's email
// is already in the subject and as a clickable mailto link in the body, so the
// ops team can reply with one click. Sender stays jobs@msapps.mobi for both
// the ops notification and the user auto-reply.
async function sendZohoMail({ accountId, accessToken, to, subject, html }) {
  const res = await fetch(`${ZOHO_MAIL_HOST}/api/accounts/${accountId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fromAddress: FROM_DISPLAY,
      toAddress: to,
      subject,
      content: html,
      mailFormat: 'html',
      askReceipt: 'no',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status?.code !== 200) {
    throw new Error(`zoho_send_failed status=${res.status} body=${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

export const contactForm = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 10,
    secrets: [ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ACCOUNT_ID_SECRET],
    cors: false,
    // Public invoker (allUsers -> run.invoker) is managed at the infra layer, not in code — see Trello LyD91Uy5.
  },
  async (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || req.ip || 'unknown').toString().split(',')[0].trim();
    const userAgent = (req.headers['user-agent'] || 'unknown').toString().slice(0, 256);
    const origin = req.headers.origin || '';

    if (ALLOWED_ORIGINS.has(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'method_not_allowed' });
      return;
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      console.warn(JSON.stringify({ event: 'origin_rejected', origin, ip }));
      res.status(403).json({ ok: false, error: 'origin_not_allowed' });
      return;
    }

    if (!rateLimitCheck(ip)) {
      console.warn(JSON.stringify({ event: 'rate_limited', ip }));
      res.status(429).json({ ok: false, error: 'rate_limited' });
      return;
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    if (body.hp_field) {
      console.info(JSON.stringify({ event: 'honeypot_triggered', ip }));
      res.status(200).json({ ok: true });
      return;
    }

    const name = sanitize(body.name, MAX_NAME);
    const email = sanitize(body.email, MAX_EMAIL);
    const phone = sanitize(body.phone, MAX_PHONE);
    const message = sanitize(body.message, MAX_MESSAGE);
    const lang = detectLang(req, body.lang);

    const errors = {};
    if (!name) errors.name = 'required';
    if (!email || !EMAIL_RE.test(email)) errors.email = 'invalid';
    if (!phone) errors.phone = 'required';
    if (!message || message.length < 5) errors.message = 'too_short';
    if (Object.keys(errors).length) {
      res.status(400).json({ ok: false, error: 'validation_failed', fields: errors });
      return;
    }

    const accountId = ZOHO_ACCOUNT_ID_SECRET.value();
    if (!accountId) {
      console.error(JSON.stringify({ event: 'missing_zoho_account_id' }));
      res.status(500).json({ ok: false, error: 'server_misconfigured' });
      return;
    }

    let accessToken;
    try {
      accessToken = await getZohoAccessToken();
    } catch (err) {
      console.error(JSON.stringify({ event: 'oauth_failed', error: String(err), ip }));
      res.status(502).json({ ok: false, error: 'mail_send_failed' });
      return;
    }

    const opsMail = buildOpsEmail({ name, email, phone, message, lang, ip, userAgent });
    const autoMail = buildUserAutoReply({ name, lang });

    try {
      await sendZohoMail({
        accountId,
        accessToken,
        to: TO_ADDRESS,
        subject: opsMail.subject,
        html: opsMail.html,
      });
      console.info(JSON.stringify({
        event: 'contact_submission',
        ts: new Date().toISOString(),
        path: req.path,
        status: 'ok',
        email_hash: hashEmail(email),
        lang,
      }));

      try {
        await sendZohoMail({
          accountId,
          accessToken,
          to: email,
          subject: autoMail.subject,
          html: autoMail.html,
        });
      } catch (autoErr) {
        console.warn(JSON.stringify({ event: 'autoreply_failed_nonfatal', email_hash: hashEmail(email), error: String(autoErr) }));
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(JSON.stringify({ event: 'unhandled_error', error: String(err), ip, email_hash: hashEmail(email) }));
      res.status(502).json({ ok: false, error: 'mail_send_failed' });
    }
  }
);
