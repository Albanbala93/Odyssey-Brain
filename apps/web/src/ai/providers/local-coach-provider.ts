import { detectOverload } from "@/domain/decision-engine";
import { clamp01, countWords } from "@/lib/text";
import type { CoachContext, CoachProvider } from "../coach-provider";
import { CoachTurnSchema, type CoachTurn } from "../schemas";

/**
 * Deterministic, offline coach. Drives every mission from its scripted
 * turns (docs domain: Mission.openingPrompt / scriptedTurns) so the entire
 * product loop works with zero external API calls (Phase 1 exit criteria).
 * It never corrects mid-conversation — corrections are surfaced once, in
 * the debrief — matching the "don't interrupt every mistake" product
 * principle (ODYSSEY_MASTER_PROMPT_CODEX.md §4.5).
 */
export class LocalCoachProvider implements CoachProvider {
  readonly id = "local_fallback" as const;

  async generateTurn(context: CoachContext): Promise<CoachTurn> {
    const { mission, turnIndex, history } = context;
    const script = turnIndex === 0 ? mission.openingPrompt : mission.scriptedTurns[turnIndex - 1];

    const isWrapUp = !script;
    const userWordCounts = history.filter((h) => h.role === "user").map((h) => countWords(h.text));
    const overloaded = detectOverload(userWordCounts);
    const avgWords = userWordCounts.length
      ? userWordCounts.reduce((sum, count) => sum + count, 0) / userWordCounts.length
      : 0;

    const turn: CoachTurn = isWrapUp
      ? {
          english: "That's a great place to stop for today. Well done!",
          french: "C'est un excellent point pour s'arrêter aujourd'hui. Bravo !",
          intent: "wrap_up",
          difficulty: mission.difficulty,
          shouldCorrectNow: false,
          detectedSignals: {
            hesitation: overloaded ? 0.7 : 0.2,
            confidence: clamp01(avgWords / 12),
            comprehensionRisk: overloaded ? 0.6 : 0.2,
          },
        }
      : {
          english: script.english,
          french: script.french,
          intent: turnIndex === 0 ? "prompt" : "follow_up",
          difficulty: mission.difficulty,
          shouldCorrectNow: false,
          detectedSignals: {
            hesitation: overloaded ? 0.7 : 0.2,
            confidence: clamp01(avgWords / 12),
            comprehensionRisk: overloaded ? 0.6 : 0.2,
          },
        };

    return CoachTurnSchema.parse(turn);
  }
}
