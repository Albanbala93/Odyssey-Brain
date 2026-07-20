import type { CapabilityProgress, CapabilityStatus } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Score gained from completing a mission attempt, based on how much the
 * learner spoke and whether they hit an expected keyword. Mirrors the
 * scoring used by the V2 prototype (3-8 points), kept deterministic so it
 * can run fully offline (docs/brain/decision-engine.md — no single metric
 * dominates, but this local heuristic stands in for AI-assessed quality
 * until Phase 3).
 */
export function computeScoreDelta(params: {
  turnsCompleted: number;
  usedSuccessKeyword: boolean;
}): number {
  const base = params.turnsCompleted * 2 + 2;
  const bonus = params.usedSuccessKeyword ? 2 : 0;
  return clamp(base + bonus, 3, 10);
}

function deriveStatus(attemptCount: number, demonstratedScore: number): CapabilityStatus {
  if (attemptCount === 0) return "not_explored";
  if (attemptCount === 1) return "discovered";
  if (demonstratedScore >= 90 && attemptCount >= 5) return "spontaneous";
  if (demonstratedScore >= 75 && attemptCount >= 3) return "solid";
  if (demonstratedScore >= 50 && attemptCount >= 2) return "functional";
  return "in_progress";
}

/**
 * Updates a capability after a mission attempt. A capability can never jump
 * straight to "solid" or "spontaneous" from a single success — mastery
 * requires several attempts (docs/brain/decision-engine.md, "Détection de
 * maîtrise").
 */
export function updateCapabilityProgress(
  current: CapabilityProgress,
  outcome: { scoreDelta: number; evidence: string; now?: Date },
): CapabilityProgress {
  const now = outcome.now ?? new Date();
  const nextDemonstrated = clamp(current.demonstratedScore + outcome.scoreDelta, 0, 100);
  const nextConfidence = clamp(current.confidenceScore + outcome.scoreDelta * 0.8, 0, 100);
  const attemptCount = current.attemptCount + 1;

  return {
    ...current,
    attemptCount,
    demonstratedScore: nextDemonstrated,
    confidenceScore: nextConfidence,
    trend:
      nextDemonstrated > current.demonstratedScore
        ? "up"
        : nextDemonstrated < current.demonstratedScore
          ? "down"
          : "flat",
    status: deriveStatus(attemptCount, nextDemonstrated),
    lastPracticedAt: now.toISOString(),
    evidence: [...current.evidence, outcome.evidence].slice(-5),
  };
}
