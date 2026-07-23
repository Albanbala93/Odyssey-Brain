import { z } from "zod";

/**
 * Controlled vocabulary for what kind of mistake a correction addresses.
 * Shared with the OpenAI provider's raw JSON schema (which can't import
 * Zod's enum shape directly) so the two never drift apart — Phase 5 groups
 * corrections by this category to track recurring patterns across sessions
 * (src/lib/app-state.tsx, ODYSSEY_MASTER_PROMPT_CODEX.md §5.9 "corrections
 * sélectives").
 */
export const CORRECTION_CATEGORIES = [
  "verb_tense",
  "preposition",
  "word_order",
  "article",
  "subject_verb_agreement",
  "vocabulary",
  "other",
] as const;

export type CorrectionCategory = (typeof CORRECTION_CATEGORIES)[number];

/**
 * Structured coach output contract (ODYSSEY_MASTER_PROMPT_CODEX.md §5.8).
 * Every AI-generated turn shown to the user — whether from the local
 * deterministic fallback or a future OpenAI-backed provider — must validate
 * against this schema before it reaches the UI.
 */
export const CoachTurnSchema = z.object({
  english: z.string().min(1),
  french: z.string().min(1),
  intent: z.enum(["prompt", "follow_up", "challenge", "support", "wrap_up"]),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  shouldCorrectNow: z.boolean(),
  // `.nullish()` + a normalizing transform because the OpenAI provider's
  // strict Structured Outputs schema sends `null` for an absent optional
  // field (it has no concept of "omitted"), while the deterministic local
  // provider simply omits the key (`undefined`) — both must validate the
  // same way, and downstream code only ever needs to check `=== undefined`.
  correction: z
    .object({
      original: z.string(),
      improved: z.string(),
      explanationFr: z.string(),
      category: z.enum(CORRECTION_CATEGORIES),
    })
    .nullish()
    .transform((v) => v ?? undefined),
  detectedSignals: z
    .object({
      hesitation: z
        .number()
        .min(0)
        .max(1)
        .nullish()
        .transform((v) => v ?? undefined),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .nullish()
        .transform((v) => v ?? undefined),
      comprehensionRisk: z
        .number()
        .min(0)
        .max(1)
        .nullish()
        .transform((v) => v ?? undefined),
    })
    .nullish()
    .transform((v) => v ?? undefined),
});

export type CoachTurn = z.infer<typeof CoachTurnSchema>;

/** Envelope returned by the coach API route, always naming its source so the UI can label fallback mode. */
export const CoachTurnResponseSchema = z.object({
  turn: CoachTurnSchema,
  source: z.enum(["openai", "local_fallback"]),
});

export type CoachTurnResponse = z.infer<typeof CoachTurnResponseSchema>;

/**
 * Envelope returned by the voice transcription API route
 * (ODYSSEY_MASTER_PROMPT_CODEX.md §5.7). `confidence` is a best-effort
 * heuristic (see openai-transcription-provider.ts) — absent when the
 * underlying provider didn't return enough information to compute one.
 */
export const TranscriptionResponseSchema = z.object({
  text: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
});

export type TranscriptionResponse = z.infer<typeof TranscriptionResponseSchema>;
