import { countWords } from "@/lib/text";
import { computeScoreDelta } from "./capability";
import type { ConversationTurn, Mission, RecurringError, SessionDebrief } from "./types";

const ACTIVE_PATTERN_MIN_COUNT = 2;

function containsAnySuccessKeyword(userTurns: string[], keywords: string[] | undefined): boolean {
  if (!keywords || keywords.length === 0) return false;
  const lowerTurns = userTurns.map((t) => t.toLowerCase());
  return keywords.some((keyword) => lowerTurns.some((t) => t.includes(keyword.toLowerCase())));
}

/**
 * Computes the end-of-mission debrief (ODYSSEY_MASTER_PROMPT_CODEX.md
 * §5.9). Deterministic and offline: it does not depend on the AI coach
 * provider, so a mission can always be completed and debriefed even
 * without a configured API key.
 */
export function computeSessionDebrief(params: {
  mission: Mission;
  userTurns: string[];
  /** This session's coach turns, used to surface a real correction instead of the mission's generic example when one happened. */
  turns?: ConversationTurn[];
  /** The learner's up-to-date recurring-error history (already includes any correction from this session), used to decide whether a targeted practice recommendation is warranted. */
  recurringErrors?: RecurringError[];
  recommendedNextMissionId: string | null;
}): SessionDebrief {
  const { mission, userTurns, turns = [], recurringErrors = [], recommendedNextMissionId } = params;
  const learnerWordCount = userTurns.reduce((sum, t) => sum + countWords(t), 0);
  const usedSuccessKeyword = containsAnySuccessKeyword(
    userTurns,
    mission.openingPrompt.successKeywords,
  );
  const turnsCompleted = userTurns.length;

  const strengths: string[] = [];
  if (turnsCompleted >= 2) {
    strengths.push("Tu as développé ta réponse sur plusieurs tours.");
  } else if (turnsCompleted >= 1) {
    strengths.push("Tu as pris la parole rapidement.");
  }
  if (usedSuccessKeyword && strengths.length < 2) {
    strengths.push(mission.exampleDebrief.strength);
  }
  if (strengths.length === 0) {
    strengths.push("Tu as terminé la mission.");
  }

  // Prefer a real correction made during this session over the mission's
  // generic canned example — the whole point is that feedback should
  // reflect what the learner actually said, not a fixed script that never
  // changes no matter what happened in the conversation.
  const sessionCorrections = turns
    .filter((t) => t.role === "coach" && t.correction)
    .map((t) => t.correction!);
  const lastCorrection = sessionCorrections[sessionCorrections.length - 1];

  const priorityImprovement = lastCorrection?.explanationFr ?? mission.exampleDebrief.improvement;
  const improvedExample = lastCorrection?.improved ?? mission.exampleDebrief.improvedExample;
  const correctionSource: "session" | "generic" = lastCorrection ? "session" : "generic";

  // A "practice this again" recommendation is only shown for a genuine
  // recurring pattern (same threshold as the coach system prompt's
  // selective-correction hint) — never framed as "you keep struggling"
  // from a single, possibly one-off, correction.
  const activePattern = lastCorrection
    ? recurringErrors.find(
        (e) =>
          e.category === lastCorrection.category &&
          e.status === "active" &&
          e.count >= ACTIVE_PATTERN_MIN_COUNT,
      )
    : undefined;
  const practiceRecommendation = activePattern
    ? {
        missionId: mission.id,
        reason: `Tu as buté ${activePattern.count} fois sur ce point : ${activePattern.pattern}`,
      }
    : null;

  return {
    missionId: mission.id,
    capabilityId: mission.targetCapabilitySlug,
    strengths: strengths.slice(0, 2),
    priorityImprovement,
    improvedExample,
    correctionSource,
    originalText: lastCorrection?.original,
    practiceRecommendation,
    learnerWordCount,
    scoreDelta: computeScoreDelta({ turnsCompleted, usedSuccessKeyword }),
    recommendedNextMissionId,
    usedSuccessKeyword,
  };
}
