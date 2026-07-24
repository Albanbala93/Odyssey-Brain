/**
 * Core domain types for Odyssey.
 *
 * This module has zero dependency on React, Next.js, or any transport
 * layer. It is the shared vocabulary between the decision engine, the AI
 * layer, and the UI. See docs/brain/user-model.md and
 * ODYSSEY_MASTER_PROMPT_CODEX.md section 6 for the specification this
 * mirrors.
 */

export type TranslationMode = "always" | "adaptive" | "on_demand";

export type DataSource = "declared" | "observed" | "inferred";

/** A single scalar fact with provenance, used throughout the user model. */
export interface Sourced<T> {
  value: T;
  source: DataSource;
  confidence: number; // 0..1
  updatedAt: string; // ISO date
}

export type GoalCategory = "work" | "travel" | "studies" | "personal";

export interface UserGoal {
  id: string;
  category: GoalCategory;
  label: string;
  priority: number; // 1 (highest) .. 5
  active: boolean;
}

export type ContextType =
  | "meetings"
  | "clients"
  | "emails"
  | "presentations"
  | "interviews"
  | "networking"
  | "travel"
  | "daily_life"
  | "studies"
  | "other";

export interface UserContext {
  id: string;
  type: ContextType;
  label: string;
  metadata?: Record<string, string>;
}

export type CapabilityStatus =
  "not_explored" | "discovered" | "in_progress" | "functional" | "solid" | "spontaneous";

export interface CapabilityDefinition {
  id: string;
  slug: string;
  labelFr: string;
  descriptionFr: string;
}

export interface CapabilityProgress {
  capabilityId: string;
  status: CapabilityStatus;
  confidenceScore: number; // 0..100
  demonstratedScore: number; // 0..100
  attemptCount: number;
  lastPracticedAt: string | null;
  trend: "up" | "down" | "flat";
  evidence: string[];
}

export interface RecurringError {
  id: string;
  category: string;
  pattern: string;
  example: string;
  count: number;
  status: "active" | "resolved";
  lastSeenAt: string;
}

export type MemoryCategory =
  | "identity"
  | "professional_context"
  | "goals"
  | "upcoming_situation"
  | "preference"
  | "recurring_vocabulary"
  | "recurring_error"
  | "confidence_trigger"
  | "successful_formulation"
  | "relationship_context";

export interface UserMemory {
  id: string;
  category: MemoryCategory;
  content: string;
  source: DataSource;
  confidence: number; // 0..1
  createdAt: string;
  expiresAt: string | null;
}

export interface ConsentState {
  storeVoice: boolean;
  storePersonalMemory: boolean;
  analytics: boolean;
  version: number;
  updatedAt: string;
}

export interface UserModel {
  identity: {
    id: string;
    name?: string;
    nativeLanguage: string;
    targetLanguage: string;
    timezone?: string;
    isGuest: boolean;
  };
  goals: UserGoal[];
  contexts: UserContext[];
  languageProfile: {
    inferredCefr?: string;
    vocabularyBreadth?: number;
    grammarControl?: number;
    listeningComprehension?: number;
    speakingFluency?: number;
    pronunciation?: number;
  };
  confidence: {
    global: number; // 0..1
    byContext: Record<string, number>;
    anxietySignals: string[];
  };
  capabilities: CapabilityProgress[];
  preferences: {
    translationMode: TranslationMode;
    autoSpeak: boolean;
    slowSpeech: boolean;
    preferredSessionMinutes: number;
  };
  recurringErrors: RecurringError[];
  memories: UserMemory[];
  consent: ConsentState;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MissionDifficulty = 1 | 2 | 3 | 4 | 5;

export interface MissionTurnScript {
  english: string;
  french: string;
  /** Keywords that, if present in the learner reply, are treated as a strong answer for the local fallback heuristics. */
  successKeywords?: string[];
}

export interface Mission {
  id: string;
  slug: string;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  targetSituation: string;
  targetCapabilitySlug: string;
  contextType: ContextType;
  estimatedMinutes: number;
  difficulty: MissionDifficulty;
  openingPrompt: MissionTurnScript;
  /** Deterministic scripted follow-ups used by the local fallback coach provider. */
  scriptedTurns: MissionTurnScript[];
  followUpIntents: string[];
  successConditions: string[];
  exampleDebrief: {
    strength: string;
    improvement: string;
    improvedExample: string;
  };
  active: boolean;
}

export type SessionStatus = "in_progress" | "completed" | "abandoned";

/** The same structured correction the coach produced live (ai/schemas.ts CoachTurn.correction), kept on the turn so the debrief can reference what was actually said instead of generic mission copy. */
export interface TurnCorrection {
  original: string;
  improved: string;
  explanationFr: string;
  category: string;
}

export interface ConversationTurn {
  id: string;
  turnIndex: number;
  role: "coach" | "user";
  englishText: string;
  frenchText?: string;
  transcriptionConfidence?: number;
  /** For coach turns: the comprehension-risk signal detected from recent learner replies, used by the translation policy. */
  comprehensionRisk?: number;
  /** For coach turns: which provider produced this reply, so the UI can label offline/fallback responses (ODYSSEY_MASTER_PROMPT_CODEX.md §21). */
  source?: "openai" | "local_fallback";
  /** For coach turns: present only when the coach corrected this specific turn. */
  correction?: TurnCorrection;
  createdAt: string;
}

export interface SessionDebrief {
  missionId: string;
  capabilityId: string;
  strengths: string[]; // max 2
  priorityImprovement: string;
  improvedExample: string;
  /** "session" when priorityImprovement/improvedExample came from a real correction made this session; "generic" when they fall back to the mission's canned example (e.g. a flawless or very short session). The debrief UI must not present a generic tip as if it were personalized feedback. */
  correctionSource: "session" | "generic";
  /** The learner's actual phrase that was corrected, only set when correctionSource is "session". */
  originalText?: string;
  /** A targeted replay suggestion, only set when the correction category is a genuine recurring pattern (count >= 2 in user.recurringErrors) — never fabricated from a single mistake. */
  practiceRecommendation: { missionId: string; reason: string } | null;
  learnerWordCount: number;
  scoreDelta: number; // percentage points added to the capability
  recommendedNextMissionId: string | null;
  /** Whether the learner used one of the mission's expected success keywords — feeds Phase 5's basic memory (successful_formulation). */
  usedSuccessKeyword: boolean;
}

export interface Session {
  id: string;
  userId: string;
  missionId: string;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  turns: ConversationTurn[];
  learnerWordCount: number;
  coachWordCount: number;
  translationUsageCount: number;
  debrief: SessionDebrief | null;
}

/** Full local application state, persisted as a single JSON document in Phase 1. */
export interface OdysseyState {
  schemaVersion: number;
  user: UserModel;
  sessions: Session[];
}
