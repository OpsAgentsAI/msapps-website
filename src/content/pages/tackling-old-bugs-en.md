---
title: "Tackling Old Bugs and Building Future-Ready Code"
lang: en
metaTitle: "Tackling Old Bugs & Future-Ready Code | MSApps"
metaDescription: "How to triage legacy bugs, refactor without breaking production, and build code that survives the next 5 years — lessons from 15 years of dev."
h1: "Tackling old bugs without breaking what's still working."
subhead: "A practical playbook for engineering leaders inheriting a 5-year-old codebase — how we triage, refactor, and ship without a quarterly fire drill."
cta: "Let's talk"
ctaHref: "mailto:info@msapps.mobi"
---

Every engineering team eventually inherits the code someone wrote three jobs ago. The bugs are real, the documentation is partial, and the original author moved to a startup that since pivoted twice. Here's how we approach it — both for our own legacy projects and the ones clients bring us to rescue.

## 1. Start with a real bug inventory, not a feeling

Before you touch a line, audit what's actually broken. We use four buckets:

- **Crashes & data loss** — fix first, no discussion.
- **User-visible breakage** — fix next.
- **Degraded behavior** (slow, awkward, ugly) — schedule.
- **"Looks wrong in the code"** — note, don't act yet.

The mistake we see most often: jumping into the fourth bucket because it's the most fun. Resist.

## 2. Build a safety net before you refactor

No refactor is safe without tests, period. If the code base has 10% coverage, your first sprint is dragging it to 40% on the modules you're about to touch. We use a "write tests for the broken behavior first, then fix" pattern — it doubles as a regression suite and a specification.

## 3. Refactor in commit-sized slices

Big refactor PRs are dangerous because they're hard to review and impossible to revert cleanly. We aim for refactor commits under ~200 lines each — small enough to read in 5 minutes, big enough to be meaningful. Each commit either keeps the tests green or fails one specific test for a documented reason.

## 4. Build for the next person, not the current crisis

When you fix a bug in legacy code, ask: would the next engineer find this fix obvious? If not, leave a comment — but a useful one ("this null check is here because the upstream API can return undefined for deleted records") not a useless one ("// fix bug 1234"). Future-ready code is code that explains itself.

## 5. Know when to rewrite vs. refactor

The honest answer: rewrite is almost never the right call. Joel Spolsky's "Things You Should Never Do, Part I" still holds up. But there's one case where rewrite wins: when the original architecture makes the new requirements physically impossible. Then it's not a rewrite — it's a different product.

## The playbook

Legacy code isn't a problem to solve once — it's a discipline to practice. Triage honestly, test before you touch, ship small commits, and write for the next person. That's it. That's the playbook.

Inheriting a legacy codebase and not sure where to start? We've rescued more than a few.
