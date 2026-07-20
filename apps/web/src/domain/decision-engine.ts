import { getCapabilityBySlug } from "./capabilities-catalog";
import type { CapabilityProgress, Mission, MissionDifficulty, UserModel } from "./types";

function clampDifficulty(value: number): MissionDifficulty {
  return Math.min(5, Math.max(1, Math.round(value))) as MissionDifficulty;
}

function findCapabilityProgress(
  user: UserModel,
  capabilitySlug: string,
): CapabilityProgress | undefined {
  const definition = getCapabilityBySlug(capabilitySlug);
  if (!definition) return undefined;
  return user.capabilities.find((c) => c.capabilityId === definition.id);
}

function wasPracticedToday(progress: CapabilityProgress | undefined, now: Date): boolean {
  if (!progress?.lastPracticedAt) return false;
  const last = new Date(progress.lastPracticedAt);
  return (
    last.getUTCFullYear() === now.getUTCFullYear() &&
    last.getUTCMonth() === now.getUTCMonth() &&
    last.getUTCDate() === now.getUTCDate()
  );
}

export interface MissionRecommendation {
  mission: Mission;
  reason: string;
}

/**
 * Scores every active mission and returns the single best next
 * recommendation, per docs/brain/brain.md §9 (activity_score) simplified to
 * a deterministic, explainable MVP version:
 *
 *   score = context_relevance + learning_value - repetition_fatigue - difficulty_penalty
 *
 * Every decision must be explainable (docs/brain/decision-engine.md, "Règles
 * d'or" #1), hence the `reason` string on the result.
 */
export function recommendMission(
  user: UserModel,
  missions: Mission[],
  now: Date = new Date(),
): MissionRecommendation {
  const candidates = missions.filter((m) => m.active);
  if (candidates.length === 0) {
    throw new Error("No active missions available");
  }

  let best = candidates[0];
  let bestScore = -Infinity;
  let bestReason = "";

  for (const mission of candidates) {
    const progress = findCapabilityProgress(user, mission.targetCapabilitySlug);
    const contextRelevance = user.contexts.some((c) => c.type === mission.contextType) ? 3 : 0;

    let learningValue = 0;
    let learningReason = "";
    if (!progress || progress.status === "not_explored") {
      learningValue = 3;
      learningReason = "capacité pas encore explorée";
    } else if (progress.status === "discovered") {
      learningValue = 2;
      learningReason = "capacité en découverte";
    } else if (progress.status === "in_progress") {
      learningValue = 1;
      learningReason = "capacité en cours d'acquisition";
    } else {
      learningValue = 0;
      learningReason = "capacité déjà solide";
    }

    const repetitionFatigue = wasPracticedToday(progress, now) ? 2 : 0;
    const difficultyPenalty = user.confidence.global < 0.4 ? (mission.difficulty - 1) * 0.5 : 0;

    const score = contextRelevance + learningValue - repetitionFatigue - difficultyPenalty;

    if (score > bestScore) {
      bestScore = score;
      best = mission;
      const relevanceReason = contextRelevance > 0 ? "correspond à un contexte prioritaire, " : "";
      bestReason = `${relevanceReason}${learningReason}`.trim();
    }
  }

  return { mission: best, reason: bestReason || "meilleure option disponible actuellement" };
}

/**
 * Difficulty stays in the learner's progression zone: hard enough to teach
 * something, easy enough to protect confidence (docs/brain/decision-engine.md
 * "Politique de difficulté"). Low global confidence always wins and forces
 * the easiest setting.
 */
export function decideDifficulty(user: UserModel, capabilitySlug: string): MissionDifficulty {
  if (user.confidence.global < 0.35) return 1;

  const progress = findCapabilityProgress(user, capabilitySlug);
  if (!progress || progress.attemptCount === 0) return 1;

  return clampDifficulty(1 + Math.floor(progress.demonstratedScore / 25));
}

export type SupportLevel = "low" | "medium" | "high";

/** Lower confidence gets more scaffolding, per the "confiance faible" matrix case. */
export function decideSupportLevel(confidenceGlobal: number): SupportLevel {
  if (confidenceGlobal < 0.4) return "high";
  if (confidenceGlobal < 0.7) return "medium";
  return "low";
}

export interface CorrectionPolicy {
  maxInterruptions: number;
  maxFinalCorrections: number;
}

/**
 * Never interrupt more than necessary; a short session gets at most a
 * handful of final corrections (docs/brain/decision-engine.md "Politique de
 * correction" and §4 limit recommendation).
 */
export function decideCorrectionPolicy(confidenceGlobal: number): CorrectionPolicy {
  if (confidenceGlobal < 0.4) return { maxInterruptions: 0, maxFinalCorrections: 1 };
  if (confidenceGlobal < 0.7) return { maxInterruptions: 1, maxFinalCorrections: 2 };
  return { maxInterruptions: 1, maxFinalCorrections: 3 };
}

/**
 * Detects learner overload from typed-session signals (very short replies
 * repeated across turns). Voice-derived hesitation signals are added in
 * Phase 4; this heuristic keeps the rule testable and useful today
 * (docs/brain/decision-engine.md "Détection de surcharge").
 */
export function detectOverload(userTurnsWordCounts: number[]): boolean {
  if (userTurnsWordCounts.length < 2) return false;
  const shortReplies = userTurnsWordCounts.filter((count) => count <= 2).length;
  return shortReplies / userTurnsWordCounts.length >= 0.6;
}

export interface SessionPlan {
  mission: Mission;
  difficulty: MissionDifficulty;
  supportLevel: SupportLevel;
  correctionPolicy: CorrectionPolicy;
  targetCapabilitySlug: string;
  reason: string;
}

/** Combines the individual decisions into the structured plan that starts a session. */
export function buildSessionPlan(
  user: UserModel,
  missions: Mission[],
  now: Date = new Date(),
): SessionPlan {
  const { mission, reason } = recommendMission(user, missions, now);
  return {
    mission,
    difficulty: decideDifficulty(user, mission.targetCapabilitySlug),
    supportLevel: decideSupportLevel(user.confidence.global),
    correctionPolicy: decideCorrectionPolicy(user.confidence.global),
    targetCapabilitySlug: mission.targetCapabilitySlug,
    reason,
  };
}
