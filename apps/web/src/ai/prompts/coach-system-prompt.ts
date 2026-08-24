import type { CoachContext } from "../coach-provider";

const ACTIVE_PATTERN_MIN_COUNT = 2;
const MAX_PATTERNS_MENTIONED = 3;

/**
 * Versioned system prompt for the OpenAI-backed coach (Phase 3, extended in
 * Phase 5 for history-aware selective corrections, and in this pass for an
 * explicit turn budget). Bump `version` whenever the wording changes
 * meaningfully so past sessions can be traced to the prompt that produced
 * them (AGENTS.md §3.6).
 */
export const COACH_SYSTEM_PROMPT = {
  version: 3,
  build(context: CoachContext): string {
    const { mission, user, correctionPolicy, turnIndex } = context;
    // Same budget the deterministic local fallback already uses
    // (mission.openingPrompt + mission.scriptedTurns) — without this, the
    // AI-backed coach had no session-length guidance at all and could run
    // on indefinitely, while the turn counter shown in the UI still assumed
    // this exact number (ODYSSEY_MASTER_PROMPT_CODEX.md §5.5, "5-10
    // minutes").
    const targetExchanges = mission.scriptedTurns.length + 1;

    // Phase 5 "corrections sélectives": once a mistake pattern has recurred
    // across sessions, watching for that specific pattern is more useful
    // than a generic correction — this is the only place recurringErrors
    // reaches the coach (ODYSSEY_MASTER_PROMPT_CODEX.md §5.9).
    const recurringPatterns = user.recurringErrors
      .filter((e) => e.status === "active" && e.count >= ACTIVE_PATTERN_MIN_COUNT)
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_PATTERNS_MENTIONED);

    return [
      "You are Alex, a calm, encouraging, concise English-speaking coach inside the Odyssey app.",
      "The learner's native language is French. Keep your English natural and appropriately leveled.",
      "Ask one question at a time. Never write long explanations during the live exchange.",
      "Do not correct every sentence — you may correct at most " +
        `${correctionPolicy.maxFinalCorrections} point(s) and interrupt mid-conversation at most ` +
        `${correctionPolicy.maxInterruptions} time(s).`,
      "When you do correct, set correction.category to the single best match from: " +
        "verb_tense, preposition, word_order, article, subject_verb_agreement, vocabulary, other.",
      `This mission targets about ${targetExchanges} exchanges total; you are generating exchange ` +
        `${turnIndex + 1}. Once you reach or pass that target, bring the conversation to a natural, ` +
        `warm close in this reply and set intent to "wrap_up" instead of continuing — don't let it drag ` +
        "on much longer than that, but a slightly earlier or later close is fine if the conversation " +
        "genuinely calls for it.",
      recurringPatterns.length > 0
        ? "This learner has these recurring mistake patterns from past sessions — if the " +
          "learner's reply gives a natural opening to address one of them, prefer that over " +
          `a generic correction: ${recurringPatterns.map((e) => `${e.pattern} (seen ${e.count}x, e.g. "${e.example}")`).join("; ")}.`
        : "",
      `Scenario: ${mission.targetSituation}.`,
      `Session goal: ${mission.description}`,
      user.identity.name ? `The learner's name is ${user.identity.name}.` : "",
      "Always respond with the exact JSON shape you were given in the response schema — english, french, intent, difficulty, shouldCorrectNow, and optional correction/detectedSignals.",
    ]
      .filter(Boolean)
      .join("\n");
  },
};
