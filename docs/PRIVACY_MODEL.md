# Odyssey — Privacy model

Status: Phase 6 hardening pass (ODYSSEY_MASTER_PROMPT_CODEX.md §10, §5.12,
docs/brain/brain.md §6.9 and §12).

## Guest mode

- Everything — profile, sessions, capability progress, memories — is
  stored **only** in the browser's `localStorage`
  (`src/lib/local-storage-repository.ts`), under a single versioned key.
  Nothing is sent to a server.
- `src/app/settings/page.tsx` exposes a "Réinitialiser le profil" action
  that wipes this local state immediately (`resetProfile()` in
  `src/lib/app-state.tsx`), satisfying the account/data-deletion
  requirement for guest users — there is no server-side copy to delete.
- The welcome screen states explicitly, in French, that guest progress
  lives only on the device.

## Authenticated accounts (Phase 2+)

- Magic-link auth via Supabase; account data lives in the normalized
  Postgres tables under Row Level Security (see docs/SECURITY.md) — a user
  can only ever read or write their own rows.
- "Supprimer mon compte" (`/api/account/delete`) deletes the Supabase Auth
  user via the service-role client, cascading through every table via
  `ON DELETE CASCADE` (`supabase/migrations/0001_init.sql`).
- **Data export** (§5.11): `/settings` → "Exporter mes données" downloads
  the learner's full state (profile, preferences, sessions, capabilities,
  memories) as a JSON file — the same in-memory `state` object that drives
  the app, so there's no separate export pipeline to keep in sync or
  trust.

## Data provenance

Every fact in the `UserModel` is typed to distinguish **declared**
(`source: "declared"`), **observed**, and **inferred** information
(`src/domain/types.ts` — `DataSource`, `Sourced<T>`). This mirrors
`docs/brain/user-model.md` "Règles: chaque donnée possède source, date,
confiance, possibilité de révision."

## Memory policy

`src/domain/memory-policy.ts` implements `evaluateMemoryCandidate`,
enforcing docs/brain/brain.md §6.9's memory rules:

- Sensitive content (health, religion, sexual orientation, political
  affiliation, exact salary — see `SENSITIVE_PATTERNS`) is excluded from
  storage by default, regardless of confidence.
- Low-confidence candidates (`< 0.3`) are discarded rather than stored as
  fact.
- Durable, clearly useful categories (identity, professional context,
  goals, recurring vocabulary/errors, successful formulations) are kept
  without expiry; everything else gets a 30-day TTL.
- Inferred facts with moderate confidence (`< 0.7`) are flagged
  `needsConfirmation: true` rather than being silently trusted.

Live since Phase 5: `finishSession` (`src/lib/app-state.tsx`) calls this
policy to record a `successful_formulation` memory whenever the learner
verifiably used one of a mission's expected success keywords — a real,
deterministic signal (`SessionDebrief.usedSuccessKeyword`), never a
fabricated one. Capped at 30 entries per account to bound growth.

## Consent

`UserModel.consent` (`storeVoice`, `storePersonalMemory`, `analytics`) is
initialized to `false` by default — nothing sensitive is opted in
automatically. `/settings` exposes real, interactive toggles for all three
(`updateConsent` in `src/lib/app-state.tsx`) — not just a read-only status
display. `analytics` consent directly gates `src/lib/analytics.ts`'s
`trackEvent`: an event is only ever sent when both this flag is true _and_
an analytics vendor is configured (see "Analytics" below).

## "Ce qu'Odyssey retient de moi" (§5.12)

`/settings/memories` lists every individual memory the app holds, each
with its category, content, source, confidence, and expiry — and a
"Supprimer" action per entry (`deleteMemory` in `src/lib/app-state.tsx`).
This is the fine-grained view; the consent toggles above are the
coarse-grained one.

## Voice data

Per §5.7 of the master brief: by default Odyssey stores transcripts and
learning signals, not raw audio. This holds by construction, not just by
policy: the recorded audio blob (`src/components/coach/VoiceRecorder.tsx`)
is sent to `/api/voice/transcribe`, transcribed, and discarded — it is
never written to `localStorage` or any Supabase table. Only the resulting
text ever enters app state. `consent.storeVoice` exists for a future
feature that would persist raw audio; no such feature exists today, so
the toggle currently has no effect — it's surfaced now so the control is
in place before the feature is, not after.

## Analytics

`src/lib/analytics.ts` is a vendor-agnostic hook, not a live integration —
no analytics account or write key exists for this deployment.
`trackEvent()` is called at three real trigger points (session started,
session completed, account created), but every call is a genuine no-op
unless both `NEXT_PUBLIC_ANALYTICS_WRITE_KEY` is set _and_ the learner
opted in. Choosing a vendor later means filling in one function
(`send()`); every call site already routes through it.
