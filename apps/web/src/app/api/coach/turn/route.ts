import { NextResponse } from "next/server";
import { z } from "zod";
import { getCoachProvider } from "@/ai/coach-service";
import { LocalCoachProvider } from "@/ai/providers/local-coach-provider";
import type { CoachContext } from "@/ai/coach-provider";
import { CoachTurnResponseSchema } from "@/ai/schemas";
import { getMissionById } from "@/domain/missions";
import { createGuestUserModel } from "@/domain/user-model";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Generous for a real conversation (a mission is ~4-6 turns) while still
// bounding the cost/abuse surface of the only route that can call OpenAI's
// paid chat API. See lib/rate-limit.ts for this limiter's real scope.
const MAX_REQUESTS_PER_MINUTE = 30;

/**
 * Server-side coach turn generation (ODYSSEY_MASTER_PROMPT_CODEX.md §5.8,
 * §13). This is the only place `OPENAI_API_KEY` is read. Phase 1's UI does
 * not call this route yet (it uses `LocalCoachProvider` directly, since it
 * needs no secret) — it exists now, fully wired, so Phase 3 only has to
 * point the session UI here.
 */
const RequestSchema = z.object({
  missionId: z.string().min(1),
  turnIndex: z.number().int().min(0),
  history: z.array(z.object({ role: z.enum(["coach", "user"]), text: z.string() })).max(50),
  correctionPolicy: z.object({
    maxInterruptions: z.number().int().min(0).max(5),
    maxFinalCorrections: z.number().int().min(0).max(10),
  }),
  learnerName: z.string().max(80).optional(),
  translationMode: z.enum(["always", "adaptive", "on_demand"]).default("adaptive"),
  confidenceGlobal: z.number().min(0).max(1).default(0.5),
  // Phase 5 "corrections sélectives": the client's own recurring-error
  // history, so the coach can prioritize watching for known patterns
  // instead of correcting generically (see coach-system-prompt.ts).
  recurringErrors: z
    .array(
      z.object({
        id: z.string(),
        category: z.string(),
        pattern: z.string(),
        example: z.string(),
        count: z.number().int().min(0),
        status: z.enum(["active", "resolved"]),
        lastSeenAt: z.string(),
      }),
    )
    .max(20)
    .default([]),
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!checkRateLimit(getClientKey(request), MAX_REQUESTS_PER_MINUTE)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let parsedBody: z.infer<typeof RequestSchema>;
  try {
    const json = await request.json();
    parsedBody = RequestSchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const mission = getMissionById(parsedBody.missionId);
  if (!mission) {
    return NextResponse.json({ error: "Unknown mission" }, { status: 404 });
  }

  const user = createGuestUserModel();
  user.identity.name = parsedBody.learnerName;
  user.preferences.translationMode = parsedBody.translationMode;
  user.confidence.global = parsedBody.confidenceGlobal;
  user.recurringErrors = parsedBody.recurringErrors;

  const context: CoachContext = {
    user,
    mission,
    turnIndex: parsedBody.turnIndex,
    history: parsedBody.history,
    correctionPolicy: parsedBody.correctionPolicy,
  };

  const provider = await getCoachProvider();
  try {
    const turn = await provider.generateTurn(context);
    return NextResponse.json(CoachTurnResponseSchema.parse({ turn, source: provider.id }));
  } catch (error) {
    // Never expose internal error details to the client; log server-side only.
    console.error("[coach/turn] provider failed, falling back to local coach", error);
    const turn = await new LocalCoachProvider().generateTurn(context);
    return NextResponse.json(CoachTurnResponseSchema.parse({ turn, source: "local_fallback" }));
  }
}
