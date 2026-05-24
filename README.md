# msapps-website

MSApps marketing site — `msapps.mobi` — REV 5 fresh-stack.

**Stack**: Astro 5 + i18n (he/en) → Firebase Hosting on `opsagent-prod`.

**Live**:
- Staging: <https://msapps-website-staging.web.app> (push to `main` → auto-deploy via GHA)
- Prod (legacy WP on DREAM VPS): <https://msapps.mobi> — being migrated off

**Why this exists**: see Trello card [BzXjWjpe](https://trello.com/c/BzXjWjpe). REV 5 = `msapps.mobi` redesign as ADK multi-agent for the Google hackathon, with prod migration off DREAM VPS as a co-benefit. This repo is the static front; ADK agent islands land in sprint 2.

## Local dev

```
npm install
npm run dev    # http://localhost:4321
npm run build  # → ./dist
```

## Deploy

Push to `main`. GHA workflow `deploy-staging.yml` builds and deploys to the `msapps-website-staging` Firebase site via WIF (no SA keys). Auth: `gha-deployer@opsagent-prod` SA, WIF pool `github-actions-pool` provider `github-oidc`, org-wide trust on `OpsAgentsAI`.

## Content

Pages live in `src/content/pages/*.md`. Schema in `src/content.config.ts`. New page = new MD file + (optionally) a new `src/pages/<route>.astro` that renders it.

## Owners

- `/gcloud-devops-expert` — infra (Firebase Hosting site, GHA workflow, WIF)
- `/msapps-web-content` — page copy
- `/msapps-web-seo` — meta, og:image, hreflang, 301s
- `/opsagents-frontend-jedi` — component craft, Tailwind, design tokens (sprint 2)
- `/opsagents-cto` — merge gate
