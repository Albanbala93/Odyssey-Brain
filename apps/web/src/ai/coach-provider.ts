import type { Mission, UserModel } from "@/domain/types";
import type { CoachTurn } from "./schemas";

/** Everything the coach needs to produce the next turn (§5.8 CoachProvider input). */
export interface CoachContext {
  user: UserModel;
  mission: Mission;
  /** Index of the turn about to be generated, 0 = opening prompt. */
  turnIndex: number;
  /** Learner replies so far, in order. */
  history: Array<{ role: "coach" | "user"; text: string }>;
  correctionPolicy: { maxInterruptions: number; maxFinalCorrections: number };
}

/**
 * Abstraction every coach implementation must satisfy — the deterministic
 * local provider (Phase 1, active today) and the OpenAI-backed provider
 * (Phase 3, implemented behind this same interface per AGENTS.md §3.4) are
 * interchangeable from the caller's point of view.
 */
export interface CoachProvider {
  readonly id: "local_fallback" | "openai";
  generateTurn(context: CoachContext): Promise<CoachTurn>;
}
