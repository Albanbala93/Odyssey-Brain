# Odyssey — Security notes

Status: Phase 6 hardening pass. Revisited at the end of every phase that
touches auth, data storage, or external API calls
(ODYSSEY_MASTER_PROMPT_CODEX.md §10).

## Secrets

- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are read only in
  server-only modules (`import "server-only"` in
  `src/ai/providers/openai-coach-provider.ts`,
  `src/ai/providers/openai-transcription-provider.ts`, and
  `src/lib/supabase/server.ts`'s service-role client). Neither is ever
  passed to a Client Component or embedded in the JS bundle.
- `NEXT_PUBLIC_*` variables are the only ones allowed in client code, by
  Next.js convention — `.env.example` documents exactly which variables
  are public vs. server-only.
- No secret is committed. `.gitignore` excludes `.env*` except
  `.env.example`.

## API input validation

Every server boundary validates its input with Zod before doing anything
with it:

- `src/app/api/coach/turn/route.ts` and `src/app/api/voice/transcribe/route.ts`
  validate their inputs (`RequestSchema`, audio size/content-type bounds)
  and return `400`/`413` on failure without leaking parser internals.
- AI output is validated against `CoachTurnSchema` /
  `TranscriptionResponseSchema` before it ever reaches the client, whether
  it came from the local fallback or OpenAI. Invalid AI output is rejected
  and the request falls back to the deterministic local coach rather than
  showing malformed content.

## Rate limiting

`src/lib/rate-limit.ts` applies a per-client (by `x-forwarded-for`)
sliding-window limit to both AI-calling routes (`/api/coach/turn`: 30
requests/minute; `/api/voice/transcribe`: 20/minute) — the only two routes
that can incur real, per-request OpenAI cost.

**Known limitation, not silently hidden**: this is an in-memory limiter
scoped to a single warm serverless instance. A production deployment runs
multiple instances, each with its own independent counter, so a
determined client spread across instances (or hitting a cold start) can
exceed the nominal limit. A real distributed limiter needs shared state
(e.g. Vercel KV / Upstash Redis) — tracked here as a deliberate follow-up,
not claimed as solved.

## Security headers

`apps/web/next.config.ts` sets `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
and a `Permissions-Policy` that allows the microphone for this origin only
(needed for Phase 4 voice input) while denying camera and geolocation,
which the app never uses.

**Known gap**: no Content-Security-Policy yet. Getting one right (Next.js's
hydration scripts, Tailwind, Supabase/OpenAI fetch origins) needs careful
testing to avoid silently breaking the app — shipping an untested CSP would
be worse than documenting the gap. Tracked as a follow-up, not implemented
speculatively.

## Error handling

- Server routes never return raw stack traces or internal error messages
  to the client (`console.error` server-side, generic JSON error to the
  client).
- The local coach provider guarantees a valid, schema-conformant response
  even when nothing else is configured, so the UI never has to render a
  broken AI response.

## Row Level Security

Enforced from Phase 2 onward (`supabase/migrations/0001_init.sql`): every
user-owned table has a policy restricting access to rows where
`auth_user_id = auth.uid()` (via a join through `profiles`), so an
authenticated user can only ever read or write their own data. The public
mission catalogue remains readable without authentication, per §9 and §10
of the master brief.

## Dependency supply chain

- `pnpm`'s `minimumReleaseAge` policy (`pnpm-workspace.yaml`) rejects
  transitive dependencies published too recently, guarding against
  fresh supply-chain compromises landing unnoticed.
- CI runs `pnpm audit --audit-level=high` on every push/PR
  (`.github/workflows/ci.yml`). It's informational
  (`continue-on-error: true`), not blocking — a hard fail would stop
  merges on advisories in transitive dependencies this team can't
  immediately fix. Still strictly better than not checking.

## Known gaps (tracked, not silently ignored)

- No CSRF-specific middleware — Supabase Auth's cookie-based sessions rely
  on `SameSite` cookie defaults; revisit if a session-mutating endpoint
  that accepts cross-origin form posts is ever added (none exist today).
- No distributed rate limiting (see above).
- No Content-Security-Policy (see above).
