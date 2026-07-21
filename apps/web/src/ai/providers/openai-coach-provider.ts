import "server-only";
import { COACH_SYSTEM_PROMPT } from "../prompts/coach-system-prompt";
import type { CoachContext, CoachProvider } from "../coach-provider";
import { CoachTurnSchema, type CoachTurn } from "../schemas";

// OpenAI's Structured Outputs (`strict: true`) require every key in
// `properties` to also appear in `required` — there is no separate concept
// of an optional key. A field that's logically optional must instead allow
// `null` in its `type` and still be listed as required; the caller then
// treats `null` the same as "omitted" (see CoachTurnSchema's `.nullish()`).
const COACH_TURN_JSON_SCHEMA = {
  name: "coach_turn",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "english",
      "french",
      "intent",
      "difficulty",
      "shouldCorrectNow",
      "correction",
      "detectedSignals",
    ],
    properties: {
      english: { type: "string" },
      french: { type: "string" },
      intent: { type: "string", enum: ["prompt", "follow_up", "challenge", "support", "wrap_up"] },
      difficulty: { type: "integer", enum: [1, 2, 3, 4, 5] },
      shouldCorrectNow: { type: "boolean" },
      correction: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["original", "improved", "explanationFr"],
        properties: {
          original: { type: "string" },
          improved: { type: "string" },
          explanationFr: { type: "string" },
        },
      },
      detectedSignals: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["hesitation", "confidence", "comprehensionRisk"],
        properties: {
          hesitation: { type: ["number", "null"] },
          confidence: { type: ["number", "null"] },
          comprehensionRisk: { type: ["number", "null"] },
        },
      },
    },
  },
} as const;

/**
 * Server-only OpenAI-backed coach (Phase 3). Never imported from client
 * code — the API key must never reach the browser bundle (AGENTS.md §3.1).
 * Only instantiated by `getCoachProvider()` when `OPENAI_API_KEY` is set;
 * `coach-service.ts` falls back to `LocalCoachProvider` otherwise.
 */
export class OpenAiCoachProvider implements CoachProvider {
  readonly id = "openai" as const;

  constructor(private readonly apiKey: string = process.env.OPENAI_API_KEY ?? "") {
    if (!this.apiKey) {
      throw new Error("OpenAiCoachProvider requires OPENAI_API_KEY to be set");
    }
  }

  async generateTurn(context: CoachContext): Promise<CoachTurn> {
    const messages = [
      { role: "system", content: COACH_SYSTEM_PROMPT.build(context) },
      ...context.history.map((turn) => ({
        role: turn.role === "coach" ? ("assistant" as const) : ("user" as const),
        content: turn.text,
      })),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        response_format: { type: "json_schema", json_schema: COACH_TURN_JSON_SCHEMA },
        temperature: 0.6,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `OpenAI request failed with status ${response.status}: ${body.slice(0, 500)}`,
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI response did not contain message content");
    }

    return CoachTurnSchema.parse(JSON.parse(content));
  }
}
