@AGENTS.md

## Task Board

Before starting any work, read `docs/tickets/README.md` to understand current project status and find the next ticket to work on. Follow the Session Continuity Protocol defined there.

## Project Structure

- `src/` — Application source code (Next.js app router, components, lib)
- `docs/` — All project documentation
  - `docs/spec.md` — Product specification
  - `docs/reports/` — Audit reports, QA reports, status docs
  - `docs/plans/` — Development phase plans
  - `docs/tickets/` — Project ticket/issue tracking
  - `docs/testing/` — E2E test flow documentation
  - `docs/design-system/` — Design system specs
- `e2e/` — Playwright end-to-end tests
- `prisma/` — Database schema, migrations, RLS policies
- `scripts/` — Utility scripts (RLS applier, seed data)
- `public/` — Static assets