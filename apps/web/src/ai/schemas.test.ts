import { describe, expect, it } from "vitest";
import { CoachTurnResponseSchema, CoachTurnSchema } from "./schemas";

describe("CoachTurnSchema", () => {
  it("accepts a minimal valid turn", () => {
    const result = CoachTurnSchema.safeParse({
      english: "Tell me more.",
      french: "Dis-m'en plus.",
      intent: "follow_up",
      difficulty: 2,
      shouldCorrectNow: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a turn with an optional correction and detected signals", () => {
    const result = CoachTurnSchema.safeParse({
      english: "Good try.",
      french: "Bien essayé.",
      intent: "support",
      difficulty: 1,
      shouldCorrectNow: true,
      correction: {
        original: "I go yesterday",
        improved: "I went yesterday",
        explanationFr: "Passé simple.",
      },
      detectedSignals: { hesitation: 0.3, confidence: 0.6, comprehensionRisk: 0.2 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid intent", () => {
    const result = CoachTurnSchema.safeParse({
      english: "Hi",
      french: "Salut",
      intent: "not_a_real_intent",
      difficulty: 1,
      shouldCorrectNow: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a difficulty outside 1-5", () => {
    const result = CoachTurnSchema.safeParse({
      english: "Hi",
      french: "Salut",
      intent: "prompt",
      difficulty: 7,
      shouldCorrectNow: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const result = CoachTurnSchema.safeParse({
      french: "Salut",
      intent: "prompt",
      difficulty: 1,
      shouldCorrectNow: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("CoachTurnResponseSchema", () => {
  it("requires a valid source label", () => {
    const result = CoachTurnResponseSchema.safeParse({
      turn: {
        english: "Hi",
        french: "Salut",
        intent: "prompt",
        difficulty: 1,
        shouldCorrectNow: false,
      },
      source: "local_fallback",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown source", () => {
    const result = CoachTurnResponseSchema.safeParse({
      turn: {
        english: "Hi",
        french: "Salut",
        intent: "prompt",
        difficulty: 1,
        shouldCorrectNow: false,
      },
      source: "anthropic",
    });
    expect(result.success).toBe(false);
  });
});
