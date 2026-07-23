import { createId } from "@/lib/id";
import type { RecurringError } from "./types";

/**
 * Merges a newly-observed correction into the learner's recurring-error
 * history: increments the count and refreshes the example when the same
 * category is already being tracked as active, otherwise starts tracking a
 * new pattern. Feeds two things: `detectPlateau` (decision-engine.ts) and
 * the coach system prompt's selective-correction hint
 * (ai/prompts/coach-system-prompt.ts) — both read this same array back.
 */
export function upsertRecurringError(
  existing: RecurringError[],
  correction: { category: string; pattern: string; example: string },
  now: Date = new Date(),
): RecurringError[] {
  const match = existing.find((e) => e.category === correction.category && e.status === "active");
  if (match) {
    return existing.map((e) =>
      e.id === match.id
        ? { ...e, count: e.count + 1, example: correction.example, lastSeenAt: now.toISOString() }
        : e,
    );
  }
  const created: RecurringError = {
    id: createId(),
    category: correction.category,
    pattern: correction.pattern,
    example: correction.example,
    count: 1,
    status: "active",
    lastSeenAt: now.toISOString(),
  };
  return [...existing, created];
}
