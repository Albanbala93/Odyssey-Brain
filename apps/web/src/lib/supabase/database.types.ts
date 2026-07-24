/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql. Keep in
 * sync manually until Phase 2+ adds `supabase gen types` to the toolchain.
 *
 * Shape follows what `supabase gen types typescript` produces (each table
 * needs Row/Insert/Update/Relationships for @supabase/postgrest-js's
 * generics to resolve column types instead of falling back to `never`).
 */

interface CapabilitiesRow {
  id: string;
  slug: string;
  label_fr: string;
  description_fr: string;
}

interface MissionsRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  target_capability_id: string;
  context_type: string;
  difficulty: number;
  estimated_minutes: number;
  opening_prompt: unknown;
  success_criteria: unknown;
  content: unknown;
  active: boolean;
}

interface ProfilesRow {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  native_language: string;
  target_language: string;
  profession: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UserPreferencesRow {
  user_id: string;
  translation_mode: string;
  auto_speak: boolean;
  slow_speech: boolean;
  preferred_session_minutes: number;
  difficulty_level: string;
  notification_settings: unknown;
  consent: unknown;
}

interface GoalsRow {
  id: string;
  user_id: string;
  category: string;
  label: string;
  priority: number;
  active: boolean;
}

interface UserContextsRow {
  id: string;
  user_id: string;
  type: string;
  label: string;
  metadata: unknown;
}

interface SessionsRow {
  id: string;
  user_id: string;
  mission_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  learner_word_count: number;
  coach_word_count: number;
  translation_usage_count: number;
  aggregate_scores: unknown;
  debrief: unknown;
}

interface ConversationTurnsRow {
  id: string;
  session_id: string;
  turn_index: number;
  role: string;
  english_text: string;
  french_text: string | null;
  transcription_confidence: number | null;
  created_at: string;
}

interface UserCapabilitiesRow {
  user_id: string;
  capability_id: string;
  status: string;
  confidence_score: number;
  demonstrated_score: number;
  attempt_count: number;
  trend: string;
  evidence: unknown;
  last_practiced_at: string | null;
}

interface RecurringErrorsRow {
  id: string;
  user_id: string;
  category: string;
  pattern: string;
  example: string;
  count: number;
  status: string;
  last_seen_at: string;
}

interface UserMemoriesRow {
  id: string;
  user_id: string;
  category: string;
  content: string;
  source: string;
  confidence: number;
  expires_at: string | null;
  created_at: string;
}

interface ConsentRecordsRow {
  id: string;
  user_id: string;
  consent_type: string;
  granted: boolean;
  version: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      capabilities: {
        Row: CapabilitiesRow;
        Insert: CapabilitiesRow;
        Update: Partial<CapabilitiesRow>;
        Relationships: [];
      };
      missions: {
        Row: MissionsRow;
        Insert: Partial<MissionsRow> & { id: string };
        Update: Partial<MissionsRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfilesRow;
        Insert: Partial<ProfilesRow> & { auth_user_id: string };
        Update: Partial<ProfilesRow>;
        Relationships: [];
      };
      user_preferences: {
        Row: UserPreferencesRow;
        Insert: Partial<UserPreferencesRow> & { user_id: string };
        Update: Partial<UserPreferencesRow>;
        Relationships: [];
      };
      goals: {
        Row: GoalsRow;
        Insert: Partial<GoalsRow> & { user_id: string; category: string; label: string };
        Update: Partial<GoalsRow>;
        Relationships: [];
      };
      user_contexts: {
        Row: UserContextsRow;
        Insert: Partial<UserContextsRow> & { user_id: string; type: string; label: string };
        Update: Partial<UserContextsRow>;
        Relationships: [];
      };
      sessions: {
        Row: SessionsRow;
        Insert: Partial<SessionsRow> & { user_id: string; mission_id: string };
        Update: Partial<SessionsRow>;
        Relationships: [];
      };
      conversation_turns: {
        Row: ConversationTurnsRow;
        Insert: Partial<ConversationTurnsRow> & {
          session_id: string;
          turn_index: number;
          role: string;
          english_text: string;
        };
        Update: Partial<ConversationTurnsRow>;
        Relationships: [];
      };
      user_capabilities: {
        Row: UserCapabilitiesRow;
        Insert: Partial<UserCapabilitiesRow> & { user_id: string; capability_id: string };
        Update: Partial<UserCapabilitiesRow>;
        Relationships: [];
      };
      recurring_errors: {
        Row: RecurringErrorsRow;
        Insert: Partial<RecurringErrorsRow> & {
          user_id: string;
          category: string;
          pattern: string;
          example: string;
        };
        Update: Partial<RecurringErrorsRow>;
        Relationships: [];
      };
      user_memories: {
        Row: UserMemoriesRow;
        Insert: Partial<UserMemoriesRow> & {
          user_id: string;
          category: string;
          content: string;
          source: string;
          confidence: number;
        };
        Update: Partial<UserMemoriesRow>;
        Relationships: [];
      };
      consent_records: {
        Row: ConsentRecordsRow;
        Insert: Partial<ConsentRecordsRow> & {
          user_id: string;
          consent_type: string;
          granted: boolean;
        };
        Update: Partial<ConsentRecordsRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
}
