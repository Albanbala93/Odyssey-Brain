import type { TranslationMode } from "./types";

export interface TranslationVisibilityInput {
  mode: TranslationMode;
  /** Onboarding always shows translation automatically (§5.2 / §5.6). */
  isOnboarding?: boolean;
  /** 0..1 signal from the decision engine estimating risk the learner won't understand. */
  comprehensionRisk?: number;
  /** Explicit per-message toggle by the user always wins. */
  manualOverride?: boolean;
}

const ADAPTIVE_RISK_THRESHOLD = 0.4;

/**
 * Decides whether the French translation should be visible for a given
 * coach message (ODYSSEY_MASTER_PROMPT_CODEX.md §5.6). English is always
 * visually primary; this only controls the secondary translation's default
 * visibility — the user can always toggle it manually afterwards.
 */
export function shouldShowTranslation(input: TranslationVisibilityInput): boolean {
  if (input.manualOverride !== undefined) return input.manualOverride;
  if (input.isOnboarding) return true;

  switch (input.mode) {
    case "always":
      return true;
    case "on_demand":
      return false;
    case "adaptive":
      return (input.comprehensionRisk ?? 0) >= ADAPTIVE_RISK_THRESHOLD;
    default:
      return true;
  }
}
