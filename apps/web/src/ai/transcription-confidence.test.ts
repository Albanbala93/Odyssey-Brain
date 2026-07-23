import { describe, expect, it } from "vitest";
import { estimateConfidence } from "./transcription-confidence";

describe("estimateConfidence", () => {
  it("returns undefined when there are no segments", () => {
    expect(estimateConfidence(undefined)).toBeUndefined();
    expect(estimateConfidence([])).toBeUndefined();
  });

  it("returns a value near 1 for confident (near-zero log-prob) segments", () => {
    const confidence = estimateConfidence([{ avg_logprob: -0.05 }, { avg_logprob: -0.02 }]);
    expect(confidence).toBeGreaterThan(0.9);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it("returns a low value for unconfident (very negative log-prob) segments", () => {
    const confidence = estimateConfidence([{ avg_logprob: -3 }]);
    expect(confidence).toBeLessThan(0.1);
  });

  it("averages across multiple segments", () => {
    const confidence = estimateConfidence([{ avg_logprob: -0.05 }, { avg_logprob: -3 }]);
    expect(confidence).toBeGreaterThan(0);
    expect(confidence).toBeLessThan(0.6);
  });

  it("clamps to [0, 1]", () => {
    const confidence = estimateConfidence([{ avg_logprob: 5 }]);
    expect(confidence).toBe(1);
  });
});
