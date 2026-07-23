import { getCapabilityBySlug } from "./capabilities-catalog";
import type {
  CapabilityProgress,
  Mission,
  MissionDifficulty,
  RecurringError,
  Session,
  UserModel,
} from "./types";

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

export type PlateauReason = "repeated_error" | "capability_stagnation" | "declining_engagement";

export interface PlateauSignal {
  isPlateaued: boolean;
  reasons: PlateauReason[];
}

const PLATEAU_ERROR_COUNT_THRESHOLD = 3;
const PLATEAU_ATTEMPT_THRESHOLD = 4;
const ENGAGEMENT_DECLINE_MIN_SESSIONS = 4;
const ENGAGEMENT_DECLINE_RATIO = 0.7;

/**
 * docs/brain/decision-engine.md "Détection de plateau": the same errors
 * across sessions, a capability that isn't advancing despite practice, or
 * declining engagement are each, independently, a plateau signal.
 */
export function detectPlateau(params: {
  capability?: CapabilityProgress;
  recurringErrors: RecurringError[];
  sessions: Session[];
}): PlateauSignal {
  const reasons: PlateauReason[] = [];

  if (
    params.recurringErrors.some(
      (e) => e.status === "active" && e.count >= PLATEAU_ERROR_COUNT_THRESHOLD,
    )
  ) {
    reasons.push("repeated_error");
  }

  if (
    params.capability &&
    params.capability.attemptCount >= PLATEAU_ATTEMPT_THRESHOLD &&
    params.capability.status !== "solid" &&
    params.capability.status !== "spontaneous"
  ) {
    reasons.push("capability_stagnation");
  }

  const completed = params.sessions
    .filter((s) => s.status === "completed")
    .slice()
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  if (completed.length >= ENGAGEMENT_DECLINE_MIN_SESSIONS) {
    const half = Math.floor(completed.length / 2);
    const average = (sessions: Session[]) =>
      sessions.reduce((sum, s) => sum + s.learnerWordCount, 0) / sessions.length;
    const earlierAverage = average(completed.slice(0, half));
    const recentAverage = average(completed.slice(-half));
    if (earlierAverage > 0 && recentAverage < earlierAverage * ENGAGEMENT_DECLINE_RATIO) {
      reasons.push("declining_engagement");
    }
  }

  return { isPlateaued: reasons.length > 0, reasons };
}

/**
 * Scores every active mission and returns the single best next
 * recommendation, per docs/brain/brain.md §9 (activity_score) simplified to
 * a deterministic, explainable MVP version:
 *
 *   score = context_relevance + learning_value - repetition_fatigue - difficulty_penalty - plateau_penalty
 *
 * Every decision must be explainable (docs/brain/decision-engine.md, "Règles
 * d'or" #1), hence the `reason` string on the result. `sessions` (this
 * learner's history) is optional and defaults to none, so callers that
 * genuinely have no session history yet (e.g. a brand new guest) don't need
 * to thread an empty array through explicitly.
 */
export function recommendMission(
  user: UserModel,
  missions: Mission[],
  now: Date = new Date(),
  sessions: Session[] = [],
): MissionRecommendation {
  const candidates = missions.filter((m) => m.active);
  if (candidates.length === 0) {
    throw new Error("No active missions available");
  }

  let best = candidates[0];
  let bestScore = -Infinity;
  let bestReason = "";
  let bestPlateau: PlateauSignal = { isPlateaued: false, reasons: [] };

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
    const plateau = detectPlateau({
      capability: progress,
      recurringErrors: user.recurringErrors,
      sessions,
    });
    // Biases the recommendation toward a different context/capability when
    // this one is plateaued ("changer le contexte / le scénario"), without
    // ever excluding it outright — if nothing better is available, the
    // learner still gets a mission rather than no recommendation at all.
    const plateauPenalty = plateau.isPlateaued ? 2.5 : 0;

    const score =
      contextRelevance + learningValue - repetitionFatigue - difficultyPenalty - plateauPenalty;

    if (score > bestScore) {
      bestScore = score;
      best = mission;
      bestPlateau = plateau;
      const relevanceReason = contextRelevance > 0 ? "correspond à un contexte prioritaire, " : "";
      bestReason = `${relevanceReason}${learningReason}`.trim();
    }
  }

  // Only surfaced when the winning mission is itself still plateaued (i.e.
  // avoidance couldn't find a better alternative) — otherwise the penalty
  // already did its job silently, consistent with repetitionFatigue and
  // difficultyPenalty, which also influence scoring without dedicated text.
  const plateauNote = bestPlateau.isPlateaued
    ? "cette compétence semble stagner, on varie le contexte pour la suite, "
    : "";

  return {
    mission: best,
    reason: plateauNote + (bestReason || "meilleure option disponible actuellement"),
  };
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
  sessions: Session[] = [],
): SessionPlan {
  const { mission, reason } = recommendMission(user, missions, now, sessions);
  return {
    mission,
    difficulty: decideDifficulty(user, mission.targetCapabilitySlug),
    supportLevel: decideSupportLevel(user.confidence.global),
    correctionPolicy: decideCorrectionPolicy(user.confidence.global),
    targetCapabilitySlug: mission.targetCapabilitySlug,
    reason,
  };
}
