import type { NextConfig } from "next";

// Baseline security headers (Phase 6 hardening,
// ODYSSEY_MASTER_PROMPT_CODEX.md §10). A strict Content-Security-Policy is
// deliberately not included here yet — getting one right (Next.js's
// hydration scripts, Tailwind, Supabase/OpenAI fetch origins) needs careful
// testing to avoid silently breaking the app, and shipping an untested CSP
// would be worse than documenting the gap (see docs/SECURITY.md).
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Voice input (Phase 4) needs the microphone for this origin;
          // camera and geolocation are never used, so they're denied.
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
