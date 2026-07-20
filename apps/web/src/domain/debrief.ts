import { countWords } from "@/lib/text";
import { computeScoreDelta } from "./capability";
import type { Mission, SessionDebrief } from "./types";

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
  recommendedNextMissionId: string | null;
}): SessionDebrief {
  const { mission, userTurns, recommendedNextMissionId } = params;
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

  return {
    missionId: mission.id,
    capabilityId: mission.targetCapabilitySlug,
    strengths: strengths.slice(0, 2),
    priorityImprovement: mission.exampleDebrief.improvement,
    improvedExample: mission.exampleDebrief.improvedExample,
    learnerWordCount,
    scoreDelta: computeScoreDelta({ turnsCompleted, usedSuccessKeyword }),
    recommendedNextMissionId,
  };
}
