import { describe, expect, it } from "vitest";
import { evaluateMemoryCandidate } from "./memory-policy";

describe("evaluateMemoryCandidate", () => {
  it("excludes sensitive content regardless of confidence", () => {
    const decision = evaluateMemoryCandidate({
      category: "identity",
      content: "I was recently diagnosed with a disease.",
      source: "declared",
      confidence: 1,
    });
    expect(decision.retain).toBe(false);
    expect(decision.reason).toBe("sensitive_content_excluded");
  });

  it("discards low-confidence inferences", () => {
    const decision = evaluateMemoryCandidate({
      category: "preference",
      content: "Might prefer short sessions",
      source: "inferred",
      confidence: 0.1,
    });
    expect(decision.retain).toBe(false);
    expect(decision.reason).toBe("confidence_too_low");
  });

  it("retains durable categories without an expiry date", () => {
    const decision = evaluateMemoryCandidate({
      category: "professional_context",
      content: "Works in marketing",
      source: "declared",
      confidence: 1,
    });
    expect(decision.retain).toBe(true);
    expect(decision.expiresAt).toBeNull();
    expect(decision.needsConfirmation).toBe(false);
  });

  it("gives temporary context a 30-day expiry", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const decision = evaluateMemoryCandidate(
      {
        category: "upcoming_situation",
        content: "Trip to Lisbon next month",
        source: "observed",
        confidence: 0.8,
      },
      now,
    );
    expect(decision.retain).toBe(true);
    expect(decision.expiresAt).toBe("2026-01-31T00:00:00.000Z");
  });

  it("flags low-confidence inferences as needing confirmation", () => {
    const decision = evaluateMemoryCandidate({
      category: "goals",
      content: "Wants a promotion",
      source: "inferred",
      confidence: 0.4,
    });
    expect(decision.retain).toBe(true);
    expect(decision.needsConfirmation).toBe(true);
  });
});
