import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./analytics";

describe("trackEvent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does not call console.debug when no write key is configured, even with consent", () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_WRITE_KEY", "");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackEvent("session_started", true);
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not call console.debug when consent is withheld, even with a write key configured", () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_WRITE_KEY", "test-key");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackEvent("session_started", false);
    expect(spy).not.toHaveBeenCalled();
  });
});
