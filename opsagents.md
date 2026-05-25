# Project: msapps-website (msapps.mobi rebuild)

## What This Is

Marketing site for msapps.mobi — REV 5 fresh-stack, replacing the legacy WP-on-DREAM-VPS prod site
and serving as the Google hackathon submission (msapps.mobi redesign as ADK multi-agent).
Currently Astro 5 + i18n (he/en) → Firebase Hosting on `opsagent-prod`. WP+ADK-on-GCE is an
open fork (see HITL Gates).

## Execution Model — Cloud Agents + HITL

All work on this repo is done by agents running on the cloud (Cloud Run jobs via `agents-cli`,
Cloud Run services via ADK SDK, GHA workflows via WIF). Local-Mac execution is the exception
path, not the default. Routine work auto-runs; HITL gates require a Trello card on
[board ok093nJc](https://trello.com/b/ok093nJc) to clear before agents proceed.

| Tier | Trigger | Runtime |
|---|---|---|
| Routine | Cloud Scheduler | Cloud Run Job + `agents-cli run` |
| Request-path | HTTPS | Cloud Run service + ADK SDK |
| CI | GitHub event | GHA + WIF → Firebase / Cloud Run |
| HITL | Trello `ok093nJc` | Michal |
| Local-Mac | Operator (exception) | This Mac |

## Tech Stack

- Astro 5, TypeScript strict, Tailwind v4 + MSApps design tokens
- i18n (he/en) via Astro content collections in `src/content/pages/*.md`
- Firebase Hosting target `msapps-website-staging` on GCP project `opsagent-prod`
- Deploys via GHA `deploy-staging.yml` using WIF (no SA keys) — SA `gha-deployer@opsagent-prod`
- ADK agents (sprint 2+) = separate Cloud Run services/jobs, called from build pipeline or
  scheduled by Cloud Scheduler; `google/agents-cli` for routine tier, direct ADK SDK for
  request-path tier

## Code Conventions

- Astro pages: one route = one `.astro` file under `src/pages/`, content in `src/content/pages/*.md`
- Content schema enforced via `src/content.config.ts` — extend the schema before adding new fields
- TypeScript strict; use const/let, triple equals, named exports
- Tailwind classes follow MSApps design tokens (see opsagents-frontend-jedi skill)
- New page = MD file + optional `<route>.astro` that renders it
- Hebrew copy is RTL-aware; English copy LTR — `dir` set per page via i18n config
- Commit messages reference the Trello card (`feat(card-XXX): …`)

## Output Preferences

- Push to `origin` immediately after each task completes — never sit on uncommitted work
- Log task output to the Trello card (comment or description update)
- Move the card through the standard MSApps flow: Dev → Code Review → QA → Deploy → Done
- For agents running on cloud: write structured run logs to Cloud Logging with
  `labels.trello_card=<id>` for traceability

## Boundaries

HITL Gates (require Trello card on `ok093nJc` to clear before agents proceed):

1. Astro-vs-WP architectural fork — until resolved, both paths stay parallel
2. Visual direction changes (design tokens, color palette, typography scale)
3. Copy that ships to production (he or en) — staging is auto, prod is gated
4. DNS / registrar work — msapps.mobi registrar is iFastNet-orphaned, recovery is operator-only
5. Paid integrations or recurring spend > $20/mo
6. Anything touching `firebase.json` `prod` target or production Cloud DNS records

Never touch: `node_modules/`, `dist/`, `.astro/`, `package-lock.json` (regenerate, never hand-edit).

Always: run `npm run build` before opening a PR (CI also enforces it).

Merge gate: `/opsagents-cto` approves; CI green on the exact head commit per recruiter rule #22.

## Skill Owners

- `/gcloud-devops-expert` — Firebase Hosting, GHA workflow, WIF, Cloud Run, Cloud SQL
- `/msapps-web-content` — page copy (he/en)
- `/msapps-web-seo` — meta tags, og:image, hreflang, 301s, sitemap
- `/opsagents-frontend-jedi` — components, Tailwind, design tokens
- `/google-adk-expert` — ADK agent design, agents-cli routines, Vertex Agent Runtime
- `/opsagents-cto` — merge gate, cross-skill coordination
- `/opsagent-pm` — scoping, "is this worth building", roadmap

## Quick Reference

- Trello board: [ok093nJc](https://trello.com/b/ok093nJc) (msapps-website-rebuild)
- Repo: github.com/OpsAgentsAI/msapps-website
- Staging: https://msapps-website-staging.web.app
- Prod (legacy WP, being migrated off): https://msapps.mobi
- GCP project: `opsagent-prod`
- Deploy SA: `gha-deployer@opsagent-prod` (WIF pool `github-actions-pool`, provider `github-oidc`)
- Local dev: `npm install && npm run dev` (localhost:4321)
- Content: `src/content/pages/*.md`, schema in `src/content.config.ts`
- Workflow: `.github/workflows/deploy-staging.yml`
- Memory keys: `project_msapps_staging_rev5_design`, `project_msapps_full_migration_to_google`,
  `project_msapps_mobi_domain_orphaned`, `feedback_msapps_has_own_design_system`,
  `project_hackathon_rev5_msapps_wp_adk`
