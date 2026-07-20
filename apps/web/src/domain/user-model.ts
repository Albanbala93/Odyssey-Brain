import { createId } from "@/lib/id";
import { CAPABILITIES } from "./capabilities-catalog";
import type { CapabilityProgress, GoalCategory, UserModel } from "./types";

/**
 * Creates a fresh guest user model. Guest progress lives only on the device
 * (see ODYSSEY_MASTER_PROMPT_CODEX.md §5.1) until the user creates an
 * account (Phase 2).
 */
export function createGuestUserModel(now: Date = new Date()): UserModel {
  const iso = now.toISOString();
  return {
    identity: {
      id: createId("guest"),
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

export interface OnboardingAnswers {
  name: string;
  goalCategory: GoalCategory;
  professionalContext?: string;
  situations: string[];
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
        id: createId("goal"),
        category: answers.goalCategory,
        label: answers.goalCategory,
        priority: 1,
        active: true,
      },
    ],
    contexts: answers.situations.map((label) => ({
      id: createId("ctx"),
      type: "other" as const,
      label,
    })),
    memories: answers.professionalContext
      ? [
          ...user.memories,
          {
            id: createId("mem"),
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
