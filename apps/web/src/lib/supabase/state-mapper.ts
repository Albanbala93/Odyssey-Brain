import { CAPABILITIES } from "@/domain/capabilities-catalog";
import type {
  CapabilityProgress,
  CapabilityStatus,
  ConsentState,
  ConversationTurn,
  DataSource,
  GoalCategory,
  MemoryCategory,
  OdysseyState,
  Session,
  SessionDebrief,
  SessionStatus,
  TranslationMode,
  UserContext,
  UserGoal,
  UserMemory,
  UserModel,
} from "@/domain/types";
import { STATE_SCHEMA_VERSION } from "@/lib/state-repository";
import type { Database } from "./database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PreferencesRow = Database["public"]["Tables"]["user_preferences"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type ContextRow = Database["public"]["Tables"]["user_contexts"]["Row"];
type CapabilityRow = Database["public"]["Tables"]["user_capabilities"]["Row"];
type RecurringErrorRow = Database["public"]["Tables"]["recurring_errors"]["Row"];
type MemoryRow = Database["public"]["Tables"]["user_memories"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type TurnRow = Database["public"]["Tables"]["conversation_turns"]["Row"];

export interface OdysseyStateRows {
  profile: ProfileRow;
  preferences: PreferencesRow | null;
  goals: GoalRow[];
  contexts: ContextRow[];
  capabilities: CapabilityRow[];
  recurringErrors: RecurringErrorRow[];
  memories: MemoryRow[];
  sessions: SessionRow[];
  turnsBySessionId: Record<string, TurnRow[]>;
}

const DEFAULT_CONSENT: ConsentState = {
  storeVoice: false,
  storePersonalMemory: false,
  analytics: false,
  version: 1,
  updatedAt: new Date(0).toISOString(),
};

function parseConsent(raw: unknown): ConsentState {
  if (raw && typeof raw === "object" && "version" in raw) return raw as ConsentState;
  return DEFAULT_CONSENT;
}

export function mapRowsToOdysseyState(rows: OdysseyStateRows): OdysseyState {
  const {
    profile,
    preferences,
    goals,
    contexts,
    capabilities,
    recurringErrors,
    memories,
    sessions,
    turnsBySessionId,
  } = rows;

  const capabilityProgress: CapabilityProgress[] = CAPABILITIES.map((definition) => {
    const row = capabilities.find((c) => c.capability_id === definition.id);
    if (!row) {
      return {
        capabilityId: definition.id,
        status: "not_explored",
        confidenceScore: 0,
        demonstratedScore: 0,
        attemptCount: 0,
        lastPracticedAt: null,
        trend: "flat",
        evidence: [],
      };
    }
    return {
      capabilityId: definition.id,
      status: row.status as CapabilityStatus,
      confidenceScore: row.confidence_score,
      demonstratedScore: row.demonstrated_score,
      attemptCount: row.attempt_count,
      lastPracticedAt: row.last_practiced_at,
      trend: row.trend as CapabilityProgress["trend"],
      evidence: Array.isArray(row.evidence) ? (row.evidence as string[]) : [],
    };
  });

  const user: UserModel = {
    identity: {
      id: profile.id,
      name: profile.display_name ?? undefined,
      nativeLanguage: profile.native_language,
      targetLanguage: profile.target_language,
      isGuest: false,
    },
    goals: goals.map((g): UserGoal => ({
      id: g.id,
      category: g.category as GoalCategory,
      label: g.label,
      priority: g.priority,
      active: g.active,
    })),
    contexts: contexts.map((c): UserContext => ({
      id: c.id,
      type: c.type as UserContext["type"],
      label: c.label,
      metadata: (c.metadata as Record<string, string>) ?? undefined,
    })),
    languageProfile: {},
    confidence: { global: 0.5, byContext: {}, anxietySignals: [] },
    capabilities: capabilityProgress,
    preferences: {
      translationMode: (preferences?.translation_mode as TranslationMode) ?? "adaptive",
      autoSpeak: preferences?.auto_speak ?? true,
      slowSpeech: preferences?.slow_speech ?? false,
      preferredSessionMinutes: preferences?.preferred_session_minutes ?? 8,
    },
    recurringErrors: recurringErrors.map((e) => ({
      id: e.id,
      category: e.category,
      pattern: e.pattern,
      example: e.example,
      count: e.count,
      status: e.status as "active" | "resolved",
      lastSeenAt: e.last_seen_at,
    })),
    memories: memories.map((m): UserMemory => ({
      id: m.id,
      category: m.category as MemoryCategory,
      content: m.content,
      source: m.source as DataSource,
      confidence: m.confidence,
      createdAt: m.created_at,
      expiresAt: m.expires_at,
    })),
    consent: parseConsent(preferences?.consent),
    onboardingCompletedAt: profile.onboarding_completed_at,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };

  const mappedSessions: Session[] = sessions.map((s) => ({
    id: s.id,
    userId: profile.id,
    missionId: s.mission_id,
    status: s.status as SessionStatus,
    startedAt: s.started_at,
    completedAt: s.completed_at,
    durationSeconds: s.duration_seconds,
    turns: (turnsBySessionId[s.id] ?? [])
      .slice()
      .sort((a, b) => a.turn_index - b.turn_index)
      .map((t): ConversationTurn => ({
        id: t.id,
        turnIndex: t.turn_index,
        role: t.role as "coach" | "user",
        englishText: t.english_text,
        frenchText: t.french_text ?? undefined,
        transcriptionConfidence: t.transcription_confidence ?? undefined,
        correction: (t.correction as ConversationTurn["correction"]) ?? undefined,
        createdAt: t.created_at,
      })),
    learnerWordCount: s.learner_word_count,
    coachWordCount: s.coach_word_count,
    translationUsageCount: s.translation_usage_count,
    debrief: (s.debrief as SessionDebrief | null) ?? null,
  }));

  return { schemaVersion: STATE_SCHEMA_VERSION, user, sessions: mappedSessions };
}

export function mapStateToProfileUpsert(
  authUserId: string,
  state: OdysseyState,
): Database["public"]["Tables"]["profiles"]["Insert"] {
  return {
    id: state.user.identity.id,
    auth_user_id: authUserId,
    display_name: state.user.identity.name ?? null,
    native_language: state.user.identity.nativeLanguage,
    target_language: state.user.identity.targetLanguage,
    onboarding_completed_at: state.user.onboardingCompletedAt,
    updated_at: new Date().toISOString(),
  };
}

export function mapStateToPreferencesUpsert(
  userId: string,
  state: OdysseyState,
): Database["public"]["Tables"]["user_preferences"]["Insert"] {
  return {
    user_id: userId,
    translation_mode: state.user.preferences.translationMode,
    auto_speak: state.user.preferences.autoSpeak,
    slow_speech: state.user.preferences.slowSpeech,
    preferred_session_minutes: state.user.preferences.preferredSessionMinutes,
    consent: state.user.consent,
  };
}

export function mapStateToGoalUpserts(
  userId: string,
  state: OdysseyState,
): Database["public"]["Tables"]["goals"]["Insert"][] {
  return state.user.goals.map((g) => ({
    id: g.id,
    user_id: userId,
    category: g.category,
    label: g.label,
    priority: g.priority,
    active: g.active,
  }));
}

export function mapStateToContextUpserts(
  userId: string,
  state: OdysseyState,
): Database["public"]["Tables"]["user_contexts"]["Insert"][] {
  return state.user.contexts.map((c) => ({
    id: c.id,
    user_id: userId,
    type: c.type,
    label: c.label,
    metadata: c.metadata ?? {},
  }));
}

export function mapStateToMemoryUpserts(
  userId: string,
  state: OdysseyState,
): Database["public"]["Tables"]["user_memories"]["Insert"][] {
  return state.user.memories.map((m) => ({
    id: m.id,
    user_id: userId,
    category: m.category,
    content: m.content,
    source: m.source,
    confidence: m.confidence,
    expires_at: m.expiresAt,
    created_at: m.createdAt,
  }));
}

export function mapStateToCapabilityUpserts(
  userId: string,
  state: OdysseyState,
): Database["public"]["Tables"]["user_capabilities"]["Insert"][] {
  return state.user.capabilities
    .filter((c) => c.attemptCount > 0)
    .map((c) => ({
      user_id: userId,
      capability_id: c.capabilityId,
      status: c.status,
      confidence_score: c.confidenceScore,
      demonstrated_score: c.demonstratedScore,
      attempt_count: c.attemptCount,
      trend: c.trend,
      evidence: c.evidence,
      last_practiced_at: c.lastPracticedAt,
    }));
}

export function mapStateToSessionUpserts(
  userId: string,
  state: OdysseyState,
): Database["public"]["Tables"]["sessions"]["Insert"][] {
  return state.sessions.map((s) => ({
    id: s.id,
    user_id: userId,
    mission_id: s.missionId,
    status: s.status,
    started_at: s.startedAt,
    completed_at: s.completedAt,
    duration_seconds: s.durationSeconds,
    learner_word_count: s.learnerWordCount,
    coach_word_count: s.coachWordCount,
    translation_usage_count: s.translationUsageCount,
    debrief: s.debrief,
  }));
}

export function mapSessionToTurnUpserts(
  session: Session,
): Database["public"]["Tables"]["conversation_turns"]["Insert"][] {
  return session.turns.map((t) => ({
    id: t.id,
    session_id: session.id,
    turn_index: t.turnIndex,
    role: t.role,
    english_text: t.englishText,
    french_text: t.frenchText ?? null,
    transcription_confidence: t.transcriptionConfidence ?? null,
    correction: t.correction ?? null,
    created_at: t.createdAt,
  }));
}
