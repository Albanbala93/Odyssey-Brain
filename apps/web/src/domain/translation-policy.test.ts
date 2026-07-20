import { describe, expect, it } from "vitest";
import { shouldShowTranslation } from "./translation-policy";

describe("shouldShowTranslation", () => {
  it("is always visible during onboarding regardless of mode", () => {
    expect(shouldShowTranslation({ mode: "on_demand", isOnboarding: true })).toBe(true);
  });

  it("respects an explicit manual override above everything else", () => {
    expect(
      shouldShowTranslation({ mode: "always", isOnboarding: true, manualOverride: false }),
    ).toBe(false);
    expect(shouldShowTranslation({ mode: "on_demand", manualOverride: true })).toBe(true);
  });

  it("'always' mode always shows the translation", () => {
    expect(shouldShowTranslation({ mode: "always" })).toBe(true);
    expect(shouldShowTranslation({ mode: "always", comprehensionRisk: 0 })).toBe(true);
  });

  it("'on_demand' mode hides the translation by default", () => {
    expect(shouldShowTranslation({ mode: "on_demand", comprehensionRisk: 0.9 })).toBe(false);
  });

  it("'adaptive' mode shows the translation only above the comprehension-risk threshold", () => {
    expect(shouldShowTranslation({ mode: "adaptive", comprehensionRisk: 0.1 })).toBe(false);
    expect(shouldShowTranslation({ mode: "adaptive", comprehensionRisk: 0.4 })).toBe(true);
    expect(shouldShowTranslation({ mode: "adaptive" })).toBe(false);
  });
});
