import { describe, expect, it } from "vitest";
import {
  decideCorrectionPolicy,
  decideDifficulty,
  decideSupportLevel,
  detectOverload,
  recommendMission,
} from "./decision-engine";
import { MISSIONS } from "./missions";
import { createGuestUserModel } from "./user-model";

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
