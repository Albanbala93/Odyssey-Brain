import { describe, expect, it } from "vitest";
import { applyOnboardingAnswers, createGuestUserModel } from "./user-model";

describe("applyOnboardingAnswers", () => {
  it("stores each selected situation with its real ContextType, not a generic 'other'", () => {
    const user = createGuestUserModel();

    const updated = applyOnboardingAnswers(user, {
      name: "Sam",
      goalCategory: "personal",
      situations: [
        { type: "daily_life", label: "Everyday life" },
        { type: "travel", label: "Travel" },
      ],
    });

    expect(updated.contexts).toHaveLength(2);
    expect(updated.contexts.map((c) => c.type).sort()).toEqual(["daily_life", "travel"]);
  });

  it("supports professional situations the same way", () => {
    const user = createGuestUserModel();

    const updated = applyOnboardingAnswers(user, {
      name: "Sam",
      goalCategory: "work",
      professionalContext: "product manager",
      situations: [{ type: "meetings", label: "Meetings" }],
    });

    expect(updated.contexts).toEqual([
      expect.objectContaining({ type: "meetings", label: "Meetings" }),
    ]);
  });

  it("records the declared professional context as a memory when provided", () => {
    const user = createGuestUserModel();

    const updated = applyOnboardingAnswers(user, {
      name: "Sam",
      goalCategory: "work",
      professionalContext: "product manager",
      situations: [{ type: "meetings", label: "Meetings" }],
    });

    expect(updated.memories).toEqual([
      expect.objectContaining({ category: "professional_context", content: "product manager" }),
    ]);
  });
});
