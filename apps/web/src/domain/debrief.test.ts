import { describe, expect, it } from "vitest";
import { computeSessionDebrief } from "./debrief";
import { getMissionBySlug } from "./missions";
import type { ConversationTurn, RecurringError } from "./types";

function coachTurn(overrides: Partial<ConversationTurn> = {}): ConversationTurn {
  return {
    id: "turn-1",
    turnIndex: 0,
    role: "coach",
    englishText: "Nice to meet you.",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeSessionDebrief", () => {
  const mission = getMissionBySlug("present-an-idea")!;

  it("counts learner words across all turns", () => {
    const debrief = computeSessionDebrief({
      mission,
      userTurns: ["We should launch a loyalty program", "It would increase repeat purchases"],
      recommendedNextMissionId: null,
    });
    expect(debrief.learnerWordCount).toBe(11);
  });

  it("caps strengths at two entries", () => {
    const debrief = computeSessionDebrief({
      mission,
      userTurns: ["I propose we launch it", "It reduces cost", "Yes, we can start next month"],
      recommendedNextMissionId: null,
    });
    expect(debrief.strengths.length).toBeLessThanOrEqual(2);
  });

  it("carries the recommended next mission through", () => {
    const debrief = computeSessionDebrief({
      mission,
      userTurns: ["We propose this idea"],
      recommendedNextMissionId: "mission-give-opinion",
    });
    expect(debrief.recommendedNextMissionId).toBe("mission-give-opinion");
  });

  it("reports whether the learner used a success keyword", () => {
    const withKeyword = computeSessionDebrief({
      mission,
      userTurns: ["We propose a new loyalty idea"],
      recommendedNextMissionId: null,
    });
    expect(withKeyword.usedSuccessKeyword).toBe(true);

    const withoutKeyword = computeSessionDebrief({
      mission,
      userTurns: ["Hello there, nice to meet you"],
      recommendedNextMissionId: null,
    });
    expect(withoutKeyword.usedSuccessKeyword).toBe(false);
  });

  it("always returns the mission's target capability as the debrief capability", () => {
    const debrief = computeSessionDebrief({
      mission,
      userTurns: [],
      recommendedNextMissionId: null,
    });
    expect(debrief.capabilityId).toBe(mission.targetCapabilitySlug);
    expect(debrief.strengths.length).toBeGreaterThan(0);
  });

  it("falls back to the mission's generic example when the session had no real correction", () => {
    const debrief = computeSessionDebrief({
      mission,
      userTurns: ["We propose this idea"],
      turns: [coachTurn()],
      recommendedNextMissionId: null,
    });
    expect(debrief.correctionSource).toBe("generic");
    expect(debrief.priorityImprovement).toBe(mission.exampleDebrief.improvement);
    expect(debrief.improvedExample).toBe(mission.exampleDebrief.improvedExample);
    expect(debrief.originalText).toBeUndefined();
    expect(debrief.practiceRecommendation).toBeNull();
  });

  it("uses the session's real correction instead of the mission's generic example when one happened", () => {
    const debrief = computeSessionDebrief({
      mission,
      userTurns: ["We propose this idea"],
      turns: [
        coachTurn({
          correction: {
            original: "I go to meeting yesterday",
            improved: "I went to the meeting yesterday",
            explanationFr: "Utilise le passé simple pour une action terminée.",
            category: "verb_tense",
          },
        }),
      ],
      recommendedNextMissionId: null,
    });
    expect(debrief.correctionSource).toBe("session");
    expect(debrief.priorityImprovement).toBe("Utilise le passé simple pour une action terminée.");
    expect(debrief.improvedExample).toBe("I went to the meeting yesterday");
    expect(debrief.originalText).toBe("I go to meeting yesterday");
  });

  it("only recommends a targeted exercise when the correction is a genuine recurring pattern", () => {
    const correction = {
      original: "I go to meeting yesterday",
      improved: "I went to the meeting yesterday",
      explanationFr: "Utilise le passé simple pour une action terminée.",
      category: "verb_tense",
    };
    const oneOff = computeSessionDebrief({
      mission,
      userTurns: ["We propose this idea"],
      turns: [coachTurn({ correction })],
      recurringErrors: [
        {
          id: "e1",
          category: "verb_tense",
          pattern: "past tense",
          example: "x",
          count: 1,
          status: "active",
          lastSeenAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      recommendedNextMissionId: null,
    });
    expect(oneOff.practiceRecommendation).toBeNull();

    const recurring: RecurringError = {
      id: "e1",
      category: "verb_tense",
      pattern: "past tense",
      example: "x",
      count: 3,
      status: "active",
      lastSeenAt: "2026-01-01T00:00:00.000Z",
    };
    const withPattern = computeSessionDebrief({
      mission,
      userTurns: ["We propose this idea"],
      turns: [coachTurn({ correction })],
      recurringErrors: [recurring],
      recommendedNextMissionId: null,
    });
    expect(withPattern.practiceRecommendation).toEqual({
      missionId: mission.id,
      reason: expect.stringContaining("3"),
    });
  });
});
