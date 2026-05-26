# msapps-website functions

Firebase Functions (Gen 2, Node.js 22) for msapps.mobi.

## contactForm

`POST /api/contact` — Zoho Mail REST API-backed contact form backend.

- Accepts JSON `{ name, email, phone, message, hp_field?, lang? }`
- Validates, rate-limits per IP (10/hour, in-memory per instance), rejects honeypot
- Sends ops notification → `info@msapps.mobi` **from** `jobs@msapps.mobi` (Reply-To = submitter)
- Sends localized auto-reply to submitter (HE/EN detected from body `lang` or `Accept-Language`)
- Origin allowlist: msapps-website-staging.web.app + msapps.mobi
- Structured Cloud Logging only (never raw message body — email is hashed)

## Required secrets

All four already populated in opsagent-prod Secret Manager:
- `zoho-mail-jobs-client-id`
- `zoho-mail-jobs-client-secret`
- `zoho-mail-jobs-refresh-token` (scope: `ZohoMail.messages.READ ZohoMail.messages.CREATE ZohoMail.accounts.READ`)
- `ZOHO_ACCOUNT_ID` (8368231000000008002 = jobs@msapps.mobi mailbox)

The default Gen-2 runtime SA (`523955774086-compute@developer.gserviceaccount.com`) needs `roles/secretmanager.secretAccessor` on each.

## Why Zoho Mail REST API (not Resend, not SMTP)

- **Resend**: requires a paid Resend account + verified `msapps.mobi` sending domain (operator step)
- **SMTP**: Zoho SMTP works but requires an app-password for jobs@msapps.mobi (operator step)
- **Zoho Mail REST API**: uses existing OAuth grant. No operator action needed. `jobs@msapps.mobi` is an already-provisioned mailbox at msapps.mobi. Same domain, same deliverability.

## Local dev

```bash
npm install
firebase emulators:start --only functions
```
