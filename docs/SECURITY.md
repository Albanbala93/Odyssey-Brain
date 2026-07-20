# Odyssey — Security notes

Status: Phase 0/1 baseline. Revisited at the end of every phase that
touches auth, data storage, or external API calls (ODYSSEY_MASTER_PROMPT_CODEX.md §10).

## Secrets

- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are read only in
  server-only modules (`src/ai/providers/openai-coach-provider.ts` imports
  `"server-only"`; the Supabase service client, added in Phase 2, will do
  the same). Neither is ever passed to a Client Component or embedded in
  the JS bundle.
- `NEXT_PUBLIC_*` variables are the only ones allowed in client code, by
  Next.js convention — `.env.example` documents exactly which variables
  are public vs. server-only.
- No secret is committed. `.gitignore` excludes `.env*` except
  `.env.example`.

## API input validation

Every server boundary validates its input with Zod before doing anything
with it:

- `src/app/api/coach/turn/route.ts` validates the request body
  (`RequestSchema`) and returns `400` on failure without leaking parser
  internals.
- AI output is validated against `CoachTurnSchema` before it ever reaches
  the client, whether it came from the local fallback or (Phase 3) OpenAI.
  Invalid AI output is rejected and the request falls back to the
  deterministic local coach rather than showing malformed content.

## Rate limiting

Not yet implemented — flagged for Phase 3, when the OpenAI-backed coach
route is actually wired into the UI and becomes a cost/abuse surface. The
route handler (`src/app/api/coach/turn/route.ts`) already isolates all AI
calls behind a single endpoint, which is where a rate limiter will attach.

## Error handling

- Server routes never return raw stack traces or internal error messages
  to the client (`console.error` server-side, generic JSON error to the
  client).
- The local coach provider guarantees a valid, schema-conformant response
  even when nothing else is configured, so the UI never has to render a
  broken AI response.

## Row Level Security (Phase 2+)

Not applicable yet — Phase 1 has no database. `docs/IMPLEMENTATION_PLAN.md`
and the future `supabase/migrations/` will enforce RLS so a user can only
access their own rows, with the public mission catalogue readable without
authentication, per §9 and §10 of the master brief.

## Known gaps (tracked, not silently ignored)

- No CSRF-specific middleware yet — Phase 1 has no session-mutating GET
  requests and no cross-origin form posts; revisit once Supabase Auth
  (Phase 2) introduces cookie-based sessions.
- No rate limiting on `/api/coach/turn` yet (see above).
- No dependency vulnerability scanning wired into CI yet — recommended
  addition for Phase 6 hardening.
