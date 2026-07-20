import type { DataSource, MemoryCategory } from "./types";

export interface MemoryCandidate {
  category: MemoryCategory;
  content: string;
  source: DataSource;
  confidence: number; // 0..1
}

export interface MemoryDecision {
  retain: boolean;
  reason:
    | "sensitive_content_excluded"
    | "confidence_too_low"
    | "durable_useful_fact"
    | "temporary_context";
  expiresAt: string | null;
  needsConfirmation: boolean;
}

const DURABLE_CATEGORIES: MemoryCategory[] = [
  "identity",
  "professional_context",
  "goals",
  "recurring_vocabulary",
  "recurring_error",
  "successful_formulation",
];

const MIN_CONFIDENCE_TO_RETAIN = 0.3;
const TEMPORARY_MEMORY_TTL_DAYS = 30;

/**
 * Minimal, auditable sensitive-content filter. Not exhaustive by design —
 * anything that matches is excluded from default storage
 * (docs/brain/brain.md §6.9, "ne pas stocker de contenu hautement sensible
 * par défaut"). Extend this list deliberately, not silently.
 */
const SENSITIVE_PATTERNS: RegExp[] = [
  /\b(maladie|diagnostic|handicap|religion|orientation sexuelle|parti politique|salaire exact)\b/i,
  /\b(disease|diagnosed|disability|religion|sexual orientation|political party|exact salary)\b/i,
];

function containsSensitiveContent(content: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(content));
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Decides whether a candidate memory should be retained, and for how long.
 * Mirrors docs/brain/decision-engine.md "Politique mémoire": memory must
 * improve the experience, never become invasive, and low-confidence
 * inferences with real impact must be confirmed rather than trusted blindly.
 */
export function evaluateMemoryCandidate(
  candidate: MemoryCandidate,
  now: Date = new Date(),
): MemoryDecision {
  if (containsSensitiveContent(candidate.content)) {
    return {
      retain: false,
      reason: "sensitive_content_excluded",
      expiresAt: null,
      needsConfirmation: false,
    };
  }

  if (candidate.confidence < MIN_CONFIDENCE_TO_RETAIN) {
    return {
      retain: false,
      reason: "confidence_too_low",
      expiresAt: null,
      needsConfirmation: false,
    };
  }

  const isDurable = DURABLE_CATEGORIES.includes(candidate.category);
  const needsConfirmation = candidate.source === "inferred" && candidate.confidence < 0.7;

  return {
    retain: true,
    reason: isDurable ? "durable_useful_fact" : "temporary_context",
    expiresAt: isDurable ? null : addDays(now, TEMPORARY_MEMORY_TTL_DAYS).toISOString(),
    needsConfirmation,
  };
}
