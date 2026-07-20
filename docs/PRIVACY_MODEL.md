# Odyssey — Privacy model

Status: Phase 0/1 baseline (ODYSSEY_MASTER_PROMPT_CODEX.md §10, §5.12,
docs/brain/brain.md §6.9 and §12).

## Guest mode (Phase 1, active today)

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

This engine is implemented and unit-tested (`memory-policy.test.ts`) but
not yet wired into the live conversation loop — Phase 1's local coach is
scripted and does not yet extract memories from free text. It becomes load-
bearing in Phase 5 (learning intelligence) once the AI coach can propose
memory candidates.

## Consent

`UserModel.consent` (`storeVoice`, `storePersonalMemory`, `analytics`) is
initialized to `false` by default — nothing sensitive is opted in
automatically. The settings screen displays current consent state; consent
toggles wire up to real persistence in Phase 2 alongside account creation
(guest mode has no server-side consent record to manage today).

## Voice data

Per §5.7 of the master brief: by default Odyssey stores transcripts and
learning signals, not raw audio. Phase 1 does not record or transmit audio
at all — the Web Speech API performs recognition entirely in the browser
and only the resulting text ever enters app state.

## What's not built yet

- The "Ce qu'Odyssey retient de moi" memory-review screen (§5.12) — the
  data model and retention policy exist and are tested, but there's no
  dedicated UI to browse/delete individual memories yet. Tracked for
  Phase 2/5 alongside real memory extraction.
- Data export (§5.11) — meaningful once there's a server-side account to
  export from (Phase 2).
