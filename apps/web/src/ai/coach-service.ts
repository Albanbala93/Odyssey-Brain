import "server-only";
import type { CoachProvider } from "./coach-provider";
import { LocalCoachProvider } from "./providers/local-coach-provider";

/**
 * Selects the active coach provider. Falls back to the deterministic local
 * provider whenever `OPENAI_API_KEY` is not configured, so the product
 * remains fully usable — clearly labelled as offline mode by the caller —
 * without any secret (ODYSSEY_MASTER_PROMPT_CODEX.md §5.8, §21).
 */
export async function getCoachProvider(): Promise<CoachProvider> {
  if (process.env.OPENAI_API_KEY) {
    // Imported lazily so environments without the key never load the OpenAI client path.
    const { OpenAiCoachProvider } = await import("./providers/openai-coach-provider");
    return new OpenAiCoachProvider();
  }
  return new LocalCoachProvider();
}
