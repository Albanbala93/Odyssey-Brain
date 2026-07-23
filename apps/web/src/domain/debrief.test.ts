import { describe, expect, it } from "vitest";
import { computeSessionDebrief } from "./debrief";
import { getMissionBySlug } from "./missions";

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
});
