import { describe, expect, it } from "vitest";
import {
  decideCorrectionPolicy,
  decideDifficulty,
  decideSupportLevel,
  detectOverload,
  detectPlateau,
  recommendMission,
} from "./decision-engine";
import { getCapabilityBySlug } from "./capabilities-catalog";
import { MISSIONS } from "./missions";
import { createGuestUserModel } from "./user-model";
import type { RecurringError, Session } from "./types";

describe("recommendMission", () => {
  it("prefers a mission matching the user's context over an unrelated one", () => {
    const user = createGuestUserModel();
    user.contexts = [{ id: "ctx-1", type: "interviews", label: "Interviews" }];

    const { mission, reason } = recommendMission(user, MISSIONS);

    expect(mission.contextType).toBe("interviews");
    expect(reason).toContain("contexte prioritaire");
  });

  it("deprioritizes a capability already practiced today (repetition fatigue)", () => {
    const user = createGuestUserModel();
    user.contexts = [{ id: "ctx-1", type: "interviews", label: "Interviews" }];
    const interviewMission = MISSIONS.find((m) => m.contextType === "interviews")!;
    const capability = user.capabilities.find((c) => c.capabilityId === "cap-answer-interview")!;
    capability.status = "in_progress";
    capability.attemptCount = 2;
    capability.lastPracticedAt = new Date().toISOString();

    const { mission } = recommendMission(user, MISSIONS, new Date());

    expect(mission.id).not.toBe(interviewMission.id);
  });

  it("throws when there are no active missions", () => {
    const user = createGuestUserModel();
    expect(() => recommendMission(user, [])).toThrow();
  });

  it("avoids recommending a mission whose capability has plateaued, in favor of a different one", () => {
    const user = createGuestUserModel();
    const interviewMission = MISSIONS.find((m) => m.contextType === "interviews")!;
    user.contexts = [{ id: "ctx-1", type: "interviews", label: "Interviews" }];
    const capabilityId = getCapabilityBySlug(interviewMission.targetCapabilitySlug)!.id;
    const capability = user.capabilities.find((c) => c.capabilityId === capabilityId)!;
    capability.status = "in_progress";
    capability.attemptCount = 5; // practiced a lot but never advanced past in_progress

    const { mission } = recommendMission(user, MISSIONS);

    expect(mission.id).not.toBe(interviewMission.id);
  });

  it("names the plateau in the reason when no better alternative exists", () => {
    const user = createGuestUserModel();
    const interviewMission = MISSIONS.find((m) => m.contextType === "interviews")!;
    const capabilityId = getCapabilityBySlug(interviewMission.targetCapabilitySlug)!.id;
    const capability = user.capabilities.find((c) => c.capabilityId === capabilityId)!;
    capability.status = "in_progress";
    capability.attemptCount = 5;

    const { reason } = recommendMission(user, [interviewMission]);

    expect(reason).toContain("stagne");
  });

  it("reaches the daily-life and studies missions added for non-professional goals", () => {
    const dailyLifeUser = createGuestUserModel();
    dailyLifeUser.contexts = [{ id: "ctx-1", type: "daily_life", label: "Everyday life" }];
    expect(recommendMission(dailyLifeUser, MISSIONS).mission.contextType).toBe("daily_life");

    const studiesUser = createGuestUserModel();
    studiesUser.contexts = [{ id: "ctx-1", type: "studies", label: "Classes" }];
    expect(recommendMission(studiesUser, MISSIONS).mission.contextType).toBe("studies");
  });

  it("prefers the easiest missions when the learner explicitly chose 'easy', overriding confidence", () => {
    const user = createGuestUserModel();
    user.confidence.global = 0.9; // would otherwise favor harder missions
    user.preferences.difficultyLevel = "easy";

    const { mission } = recommendMission(user, MISSIONS);

    expect(mission.difficulty).toBeLessThanOrEqual(2);
  });

  it("prefers the hardest missions when the learner explicitly chose 'hard', overriding low confidence", () => {
    const user = createGuestUserModel();
    user.confidence.global = 0.1; // would otherwise force the easiest missions
    user.preferences.difficultyLevel = "hard";

    const { mission } = recommendMission(user, MISSIONS);

    expect(mission.difficulty).toBeGreaterThanOrEqual(4);
  });

  it("two users with different histories receive different recommendations", () => {
    const thriving = createGuestUserModel();
    const struggling = createGuestUserModel();
    struggling.recurringErrors = [
      {
        id: "err-1",
        category: "verb_tense",
        pattern: "past tense",
        example: "I go yesterday -> I went yesterday",
        count: 4,
        status: "active",
        lastSeenAt: new Date().toISOString(),
      },
    ];

    const thrivingPick = recommendMission(thriving, MISSIONS);
    const strugglingPick = recommendMission(struggling, MISSIONS);

    // Same starting state otherwise, but the struggling learner's history
    // changes the explanation given for the recommendation.
    expect(strugglingPick.reason).not.toBe(thrivingPick.reason);
  });
});

describe("detectPlateau", () => {
  const activeError: RecurringError = {
    id: "err-1",
    category: "verb_tense",
    pattern: "past tense",
    example: "I go yesterday -> I went yesterday",
    count: 3,
    status: "active",
    lastSeenAt: new Date().toISOString(),
  };

  function makeSession(learnerWordCount: number, daysAgo: number): Session {
    const startedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: `session-${daysAgo}`,
      userId: "user-1",
      missionId: "mission-1",
      status: "completed",
      startedAt,
      completedAt: startedAt,
      durationSeconds: 60,
      turns: [],
      learnerWordCount,
      coachWordCount: 20,
      translationUsageCount: 0,
      debrief: null,
    };
  }

  it("is false with no signals", () => {
    expect(detectPlateau({ recurringErrors: [], sessions: [] }).isPlateaued).toBe(false);
  });

  it("detects a repeated error at or above the count threshold", () => {
    const signal = detectPlateau({ recurringErrors: [activeError], sessions: [] });
    expect(signal.isPlateaued).toBe(true);
    expect(signal.reasons).toContain("repeated_error");
  });

  it("ignores a resolved recurring error", () => {
    const signal = detectPlateau({
      recurringErrors: [{ ...activeError, status: "resolved" }],
      sessions: [],
    });
    expect(signal.isPlateaued).toBe(false);
  });

  it("detects capability stagnation after many attempts without advancing", () => {
    const signal = detectPlateau({
      capability: {
        capabilityId: "cap-1",
        status: "in_progress",
        confidenceScore: 40,
        demonstratedScore: 40,
        attemptCount: 6,
        lastPracticedAt: null,
        trend: "flat",
        evidence: [],
      },
      recurringErrors: [],
      sessions: [],
    });
    expect(signal.reasons).toContain("capability_stagnation");
  });

  it("does not flag stagnation for a capability that has become solid", () => {
    const signal = detectPlateau({
      capability: {
        capabilityId: "cap-1",
        status: "solid",
        confidenceScore: 80,
        demonstratedScore: 80,
        attemptCount: 6,
        lastPracticedAt: null,
        trend: "flat",
        evidence: [],
      },
      recurringErrors: [],
      sessions: [],
    });
    expect(signal.reasons).not.toContain("capability_stagnation");
  });

  it("detects declining engagement across enough completed sessions", () => {
    const sessions = [
      makeSession(80, 8),
      makeSession(75, 6),
      makeSession(20, 4),
      makeSession(15, 2),
    ];
    const signal = detectPlateau({ recurringErrors: [], sessions });
    expect(signal.reasons).toContain("declining_engagement");
  });

  it("does not flag engagement decline with too few sessions to judge", () => {
    const sessions = [makeSession(80, 2), makeSession(10, 1)];
    const signal = detectPlateau({ recurringErrors: [], sessions });
    expect(signal.reasons).not.toContain("declining_engagement");
  });
});

describe("decideDifficulty", () => {
  it("returns the easiest difficulty when global confidence is low", () => {
    const user = createGuestUserModel();
    user.confidence.global = 0.2;
    expect(decideDifficulty(user, "present_idea")).toBe(1);
  });

  it("returns the easiest difficulty for a never-attempted capability", () => {
    const user = createGuestUserModel();
    user.confidence.global = 0.9;
    expect(decideDifficulty(user, "present_idea")).toBe(1);
  });

  it("increases with demonstrated score once confidence is healthy", () => {
    const user = createGuestUserModel();
    user.confidence.global = 0.9;
    const capability = user.capabilities.find((c) => c.capabilityId === "cap-present-idea")!;
    capability.attemptCount = 3;
    capability.demonstratedScore = 80;
    expect(decideDifficulty(user, "present_idea")).toBe(4);
  });

  it("an explicit level choice overrides the confidence heuristic entirely", () => {
    const user = createGuestUserModel();
    user.confidence.global = 0.9;
    const capability = user.capabilities.find((c) => c.capabilityId === "cap-present-idea")!;
    capability.attemptCount = 3;
    capability.demonstratedScore = 80;

    user.preferences.difficultyLevel = "easy";
    expect(decideDifficulty(user, "present_idea")).toBe(1);

    user.preferences.difficultyLevel = "hard";
    expect(decideDifficulty(user, "present_idea")).toBe(5);
  });
});

describe("decideSupportLevel", () => {
  it.each([
    [0.1, "high"],
    [0.5, "medium"],
    [0.9, "low"],
  ] as const)("confidence %s -> %s", (confidence, expected) => {
    expect(decideSupportLevel(confidence)).toBe(expected);
  });
});

describe("decideCorrectionPolicy", () => {
  it("never interrupts when confidence is low", () => {
    expect(decideCorrectionPolicy(0.2)).toEqual({ maxInterruptions: 0, maxFinalCorrections: 1 });
  });

  it("allows the most corrections when confidence is high", () => {
    expect(decideCorrectionPolicy(0.9)).toEqual({ maxInterruptions: 1, maxFinalCorrections: 3 });
  });
});

describe("detectOverload", () => {
  it("is false with fewer than two turns", () => {
    expect(detectOverload([1])).toBe(false);
  });

  it("is true when most replies are very short", () => {
    expect(detectOverload([1, 2, 1, 8])).toBe(true);
  });

  it("is false when replies are substantial", () => {
    expect(detectOverload([10, 12, 8])).toBe(false);
  });
});
