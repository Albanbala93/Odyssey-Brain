import { createId } from "@/lib/id";
import { CAPABILITIES } from "./capabilities-catalog";
import type { CapabilityProgress, ContextType, GoalCategory, UserModel } from "./types";

/**
 * Creates a fresh guest user model. Guest progress lives only on the device
 * (see ODYSSEY_MASTER_PROMPT_CODEX.md §5.1) until the user creates an
 * account (Phase 2).
 */
export function createGuestUserModel(now: Date = new Date()): UserModel {
  const iso = now.toISOString();
  return {
    identity: {
      id: createId(),
      nativeLanguage: "fr",
      targetLanguage: "en",
      isGuest: true,
    },
    goals: [],
    contexts: [],
    languageProfile: {},
    confidence: {
      global: 0.5,
      byContext: {},
      anxietySignals: [],
    },
    capabilities: CAPABILITIES.map((capability): CapabilityProgress => ({
      capabilityId: capability.id,
      status: "not_explored",
      confidenceScore: 0,
      demonstratedScore: 0,
      attemptCount: 0,
      lastPracticedAt: null,
      trend: "flat",
      evidence: [],
    })),
    preferences: {
      translationMode: "adaptive",
      autoSpeak: true,
      slowSpeech: false,
      preferredSessionMinutes: 8,
    },
    recurringErrors: [],
    memories: [],
    consent: {
      storeVoice: false,
      storePersonalMemory: false,
      analytics: false,
      version: 1,
      updatedAt: iso,
    },
    onboardingCompletedAt: null,
    createdAt: iso,
    updatedAt: iso,
  };
}

/** A situation picked on onboarding Screen 5, tied to the real ContextType it represents. */
export interface OnboardingSituation {
  type: ContextType;
  label: string;
}

export interface OnboardingAnswers {
  name: string;
  goalCategory: GoalCategory;
  professionalContext?: string;
  situations: OnboardingSituation[];
}

/** Applies the onboarding answers (ODYSSEY_MASTER_PROMPT_CODEX.md §5.2) to a user model. */
export function applyOnboardingAnswers(
  user: UserModel,
  answers: OnboardingAnswers,
  now: Date = new Date(),
): UserModel {
  const iso = now.toISOString();
  return {
    ...user,
    identity: {
      ...user.identity,
      name: answers.name,
    },
    goals: [
      {
        id: createId(),
        category: answers.goalCategory,
        label: answers.goalCategory,
        priority: 1,
        active: true,
      },
    ],
    // Each selected situation carries its real ContextType from the picker
    // (onboarding/page.tsx) rather than being tagged "other" — this is what
    // lets the decision engine's contextRelevance scoring
    // (decision-engine.ts) actually match missions to what the learner said
    // they need, instead of always falling back to whichever mission is
    // first in the catalogue.
    contexts: answers.situations.map((situation) => ({
      id: createId(),
      type: situation.type,
      label: situation.label,
    })),
    memories: answers.professionalContext
      ? [
          ...user.memories,
          {
            id: createId(),
            category: "professional_context" as const,
            content: answers.professionalContext,
            source: "declared" as const,
            confidence: 1,
            createdAt: iso,
            expiresAt: null,
          },
        ]
      : user.memories,
    onboardingCompletedAt: iso,
    updatedAt: iso,
  };
}
