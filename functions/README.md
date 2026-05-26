# msapps-website functions

Firebase Functions (Gen 2, Node.js 22) for msapps.mobi.

## contactForm

`POST /api/contact` — Resend-backed contact form backend.

- Accepts JSON `{ name, email, phone, message, hp_field?, lang? }`
- Validates, rate-limits per IP (10/hour, in-memory per instance), rejects honeypot
- Sends ops notification → `info@msapps.mobi` (from `noreply@msapps.mobi`, Reply-To = submitter)
- Sends localized auto-reply to submitter (HE/EN detected from body `lang` or `Accept-Language`)
- Origin allowlist: msapps-website-staging.web.app + msapps.mobi
- Structured Cloud Logging only (never raw message body — email is hashed)

## Required secret

`resend-api-key` in Secret Manager (opsagent-prod). The function reads it via `defineSecret`; firebase-tools binds at deploy time. The function runtime SA needs `roles/secretmanager.secretAccessor` on this secret (firebase-tools normally grants this on first deploy).

## Required Resend setup

- Verified sending domain: `msapps.mobi` (DNS records added at the registrar)
- The `From:` address `noreply@msapps.mobi` must live in that verified domain.

## Local dev

```bash
npm install
firebase emulators:start --only functions
# then curl http://localhost:5001/opsagent-prod/us-central1/contactForm
```
