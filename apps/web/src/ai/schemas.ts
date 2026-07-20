import { z } from "zod";

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
  correction: z
    .object({
      original: z.string(),
      improved: z.string(),
      explanationFr: z.string(),
    })
    .optional(),
  detectedSignals: z
    .object({
      hesitation: z.number().min(0).max(1).optional(),
      confidence: z.number().min(0).max(1).optional(),
      comprehensionRisk: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export type CoachTurn = z.infer<typeof CoachTurnSchema>;

/** Envelope returned by the coach API route, always naming its source so the UI can label fallback mode. */
export const CoachTurnResponseSchema = z.object({
  turn: CoachTurnSchema,
  source: z.enum(["openai", "local_fallback"]),
});

export type CoachTurnResponse = z.infer<typeof CoachTurnResponseSchema>;
