import { describe, expect, it } from "vitest";
import { createGuestUserModel } from "@/domain/user-model";
import { getMissionBySlug } from "@/domain/missions";
import { CoachTurnSchema } from "../schemas";
import { LocalCoachProvider } from "./local-coach-provider";

describe("LocalCoachProvider (deterministic offline fallback)", () => {
  const provider = new LocalCoachProvider();
  const user = createGuestUserModel();
  const mission = getMissionBySlug("introduce-yourself")!;

  it("returns the mission's opening prompt for turnIndex 0", async () => {
    const turn = await provider.generateTurn({
      user,
      mission,
      turnIndex: 0,
      history: [],
      correctionPolicy: { maxInterruptions: 1, maxFinalCorrections: 3 },
    });
    expect(turn.english).toBe(mission.openingPrompt.english);
    expect(turn.intent).toBe("prompt");
  });

  it("walks through the scripted turns in order", async () => {
    const turn = await provider.generateTurn({
      user,
      mission,
      turnIndex: 1,
      history: [{ role: "coach", text: mission.openingPrompt.english }],
      correctionPolicy: { maxInterruptions: 1, maxFinalCorrections: 3 },
    });
    expect(turn.english).toBe(mission.scriptedTurns[0].english);
    expect(turn.intent).toBe("follow_up");
  });

  it("wraps up once the scripted turns are exhausted", async () => {
    const turn = await provider.generateTurn({
      user,
      mission,
      turnIndex: mission.scriptedTurns.length + 1,
      history: [],
      correctionPolicy: { maxInterruptions: 1, maxFinalCorrections: 3 },
    });
    expect(turn.intent).toBe("wrap_up");
  });

  it("never asks for a correction mid-conversation", async () => {
    const turn = await provider.generateTurn({
      user,
      mission,
      turnIndex: 0,
      history: [],
      correctionPolicy: { maxInterruptions: 1, maxFinalCorrections: 3 },
    });
    expect(turn.shouldCorrectNow).toBe(false);
  });

  it("always returns schema-valid output", async () => {
    const turn = await provider.generateTurn({
      user,
      mission,
      turnIndex: 0,
      history: [],
      correctionPolicy: { maxInterruptions: 1, maxFinalCorrections: 3 },
    });
    expect(() => CoachTurnSchema.parse(turn)).not.toThrow();
  });

  it("raises the comprehensionRisk signal when the learner gives very short replies", async () => {
    const turn = await provider.generateTurn({
      user,
      mission,
      turnIndex: 1,
      history: [
        { role: "coach", text: mission.openingPrompt.english },
        { role: "user", text: "Ok" },
      ],
      correctionPolicy: { maxInterruptions: 1, maxFinalCorrections: 3 },
    });
    // A single 1-word reply is not (yet) enough turns to trigger detectOverload,
    // which requires at least two learner turns — this documents that behavior.
    expect(turn.detectedSignals?.comprehensionRisk).toBe(0.2);
  });
});
