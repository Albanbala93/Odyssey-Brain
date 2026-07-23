import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientKey } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then blocks", () => {
    const key = `test-key-${Math.random()}`;
    expect(checkRateLimit(key, 3)).toBe(true);
    expect(checkRateLimit(key, 3)).toBe(true);
    expect(checkRateLimit(key, 3)).toBe(true);
    expect(checkRateLimit(key, 3)).toBe(false);
  });

  it("tracks distinct keys independently", () => {
    const keyA = `test-key-a-${Math.random()}`;
    const keyB = `test-key-b-${Math.random()}`;
    expect(checkRateLimit(keyA, 1)).toBe(true);
    expect(checkRateLimit(keyA, 1)).toBe(false);
    expect(checkRateLimit(keyB, 1)).toBe(true);
  });

  it("resets the count once the window passes", () => {
    const key = `test-key-${Math.random()}`;
    expect(checkRateLimit(key, 1)).toBe(true);
    expect(checkRateLimit(key, 1)).toBe(false);

    vi.advanceTimersByTime(61_000);

    expect(checkRateLimit(key, 1)).toBe(true);
  });
});

describe("getClientKey", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(getClientKey(request)).toBe("203.0.113.5");
  });

  it("falls back to 'unknown' when the header is absent", () => {
    const request = new Request("http://localhost");
    expect(getClientKey(request)).toBe("unknown");
  });
});
