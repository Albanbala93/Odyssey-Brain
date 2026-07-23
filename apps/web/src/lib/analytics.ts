/**
 * Vendor-agnostic analytics hook point (Phase 6,
 * ODYSSEY_MASTER_PROMPT_CODEX.md §10). No analytics vendor is wired up —
 * there is no account or write key to send events to. `trackEvent` is a
 * genuine no-op unless both `NEXT_PUBLIC_ANALYTICS_WRITE_KEY` is set and
 * the learner has opted in (`UserModel.consent.analytics`); every call site
 * already goes through this one function, so plugging in a real vendor
 * later means filling in `send()` below and nothing else.
 */
function isAnalyticsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY);
}

function send(event: string, properties: Record<string, unknown>): void {
  // Intentionally unimplemented: no vendor has been chosen for this
  // deployment yet. Replace this with a real call (e.g. fetch to your
  // provider's collect endpoint) when one is — do not add a vendor
  // integration here speculatively.
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event, properties);
  }
}

export function trackEvent(
  event: string,
  consentGranted: boolean,
  properties: Record<string, unknown> = {},
): void {
  if (!isAnalyticsConfigured() || !consentGranted) return;
  send(event, properties);
}
