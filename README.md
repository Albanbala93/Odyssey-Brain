# Odyssey

Odyssey is an AI speaking companion that helps French-speaking adults become
confident speaking English in real-life situations — not a course catalogue.
See `ODYSSEY_MASTER_PROMPT_CODEX.md` for the full product/technical brief and
`docs/brain/` for the pedagogical engine specification.

## Status

**Phase 0 (foundation) and Phase 1 (local vertical slice) are complete.** A
guest user can go through welcome → conversational onboarding → a real
mission → typed conversation with translation → debrief → Today, entirely
offline (no API keys required). See `docs/IMPLEMENTATION_PLAN.md` for the
full phase-by-phase status and known blockers.

## Repository layout

```text
apps/web/               Next.js 16 (App Router) application
  src/domain/            Pure business logic — user model, decision engine, missions, capabilities
  src/ai/                Coach provider abstraction, Zod schemas, prompts, local + OpenAI providers
  src/lib/                Persistence, small utilities
  src/components/         UI components
  src/app/                Routes (App Router)
  e2e/                    Playwright end-to-end tests
docs/
  IMPLEMENTATION_PLAN.md  Audit, architecture decisions, phase plan
  adr/                    Architecture decision records
  brain/                  Odyssey Brain / decision engine / user model specification
  legacy/                 Original static HTML prototype (V2), kept for reference
AGENTS.md                Project rules for anyone (human or AI) contributing here
.env.example             All environment variables, with local/offline fallback behavior documented
```

## Getting started

Requires Node.js ≥ 20.9 and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

No environment variables are required to run the full Phase 1 experience —
copy `.env.example` to `apps/web/.env.local` only when you have real OpenAI
or Supabase credentials for later phases.

## Quality gates

```bash
pnpm lint          # ESLint
pnpm typecheck     # tsc --noEmit (strict mode)
pnpm test          # Vitest — unit + component tests
pnpm --filter web test:e2e   # Playwright — full guest journey, real browser
pnpm build         # Next.js production build
pnpm format        # Prettier (write)
```

## Deployment

The app is a standard Next.js app and deploys to Vercel (or any Node.js
host) without configuration changes. Set the variables from `.env.example`
in your hosting provider's environment — everything degrades gracefully to
local/offline behavior when they are absent.
