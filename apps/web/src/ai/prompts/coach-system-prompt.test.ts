import { describe, expect, it } from "vitest";
import { COACH_SYSTEM_PROMPT } from "./coach-system-prompt";
import { createGuestUserModel } from "@/domain/user-model";
import { MISSIONS } from "@/domain/missions";

const mission = MISSIONS[0];
const correctionPolicy = { maxInterruptions: 1, maxFinalCorrections: 2 };

describe("COACH_SYSTEM_PROMPT.build", () => {
  it("does not mention recurring patterns when none are active", () => {
    const user = createGuestUserModel();
    const prompt = COACH_SYSTEM_PROMPT.build({
      user,
      mission,
      turnIndex: 0,
      history: [],
      correctionPolicy,
    });
    expect(prompt).not.toContain("recurring mistake patterns");
  });

  it("ignores recurring errors below the count threshold", () => {
    const user = createGuestUserModel();
    user.recurringErrors = [
      {
        id: "err-1",
        category: "verb_tense",
        pattern: "past tense",
        example: "I go yesterday",
        count: 1,
        status: "active",
        lastSeenAt: new Date().toISOString(),
      },
    ];
    const prompt = COACH_SYSTEM_PROMPT.build({
      user,
      mission,
      turnIndex: 0,
      history: [],
      correctionPolicy,
    });
    expect(prompt).not.toContain("recurring mistake patterns");
  });

  it("mentions an active recurring pattern that meets the count threshold", () => {
    const user = createGuestUserModel();
    user.recurringErrors = [
      {
        id: "err-1",
        category: "verb_tense",
        pattern: "past tense of irregular verbs",
        example: "I go yesterday -> I went yesterday",
        count: 3,
        status: "active",
        lastSeenAt: new Date().toISOString(),
      },
    ];
    const prompt = COACH_SYSTEM_PROMPT.build({
      user,
      mission,
      turnIndex: 0,
      history: [],
      correctionPolicy,
    });
    expect(prompt).toContain("recurring mistake patterns");
    expect(prompt).toContain("past tense of irregular verbs");
  });

  it("ignores a resolved recurring error even with a high count", () => {
    const user = createGuestUserModel();
    user.recurringErrors = [
      {
        id: "err-1",
        category: "verb_tense",
        pattern: "past tense",
        example: "I go yesterday",
        count: 5,
        status: "resolved",
        lastSeenAt: new Date().toISOString(),
      },
    ];
    const prompt = COACH_SYSTEM_PROMPT.build({
      user,
      mission,
      turnIndex: 0,
      history: [],
      correctionPolicy,
    });
    expect(prompt).not.toContain("recurring mistake patterns");
  });
});
