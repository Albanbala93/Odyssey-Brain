import { describe, expect, it } from "vitest";
import { computeScoreDelta, updateCapabilityProgress } from "./capability";
import type { CapabilityProgress } from "./types";

function baseProgress(overrides: Partial<CapabilityProgress> = {}): CapabilityProgress {
  return {
    capabilityId: "cap-test",
    status: "not_explored",
    confidenceScore: 0,
    demonstratedScore: 0,
    attemptCount: 0,
    lastPracticedAt: null,
    trend: "flat",
    evidence: [],
    ...overrides,
  };
}

describe("computeScoreDelta", () => {
  it("stays within the 3-10 clamp", () => {
    expect(
      computeScoreDelta({ turnsCompleted: 0, usedSuccessKeyword: false }),
    ).toBeGreaterThanOrEqual(3);
    expect(computeScoreDelta({ turnsCompleted: 10, usedSuccessKeyword: true })).toBeLessThanOrEqual(
      10,
    );
  });

  it("rewards using an expected success keyword", () => {
    const without = computeScoreDelta({ turnsCompleted: 2, usedSuccessKeyword: false });
    const withKeyword = computeScoreDelta({ turnsCompleted: 2, usedSuccessKeyword: true });
    expect(withKeyword).toBeGreaterThan(without);
  });
});

describe("updateCapabilityProgress", () => {
  it("moves a never-attempted capability to 'discovered' after one attempt", () => {
    const updated = updateCapabilityProgress(baseProgress(), {
      scoreDelta: 5,
      evidence: "first try",
    });
    expect(updated.status).toBe("discovered");
    expect(updated.attemptCount).toBe(1);
    expect(updated.demonstratedScore).toBe(5);
  });

  it("never reaches 'solid' or 'spontaneous' after a single attempt, even with a huge score jump", () => {
    const updated = updateCapabilityProgress(baseProgress(), {
      scoreDelta: 100,
      evidence: "lucky guess",
    });
    expect(updated.status).not.toBe("solid");
    expect(updated.status).not.toBe("spontaneous");
    expect(updated.demonstratedScore).toBe(100);
  });

  it("requires several attempts before reaching 'solid'", () => {
    let progress = baseProgress();
    for (let i = 0; i < 3; i += 1) {
      progress = updateCapabilityProgress(progress, { scoreDelta: 30, evidence: `attempt ${i}` });
    }
    expect(progress.attemptCount).toBe(3);
    expect(progress.status).toBe("solid");
  });

  it("clamps demonstratedScore to 100 and keeps evidence to the last 5 entries", () => {
    let progress = baseProgress({ demonstratedScore: 95 });
    for (let i = 0; i < 6; i += 1) {
      progress = updateCapabilityProgress(progress, { scoreDelta: 10, evidence: `evidence-${i}` });
    }
    expect(progress.demonstratedScore).toBe(100);
    expect(progress.evidence).toHaveLength(5);
    expect(progress.evidence[0]).toBe("evidence-1");
  });
});
