"use client";

import type { OdysseyState, Session } from "@/domain/types";
import type { UserStateRepository } from "@/lib/state-repository";
import { createSupabaseBrowserClient } from "./client";
import type { Database } from "./database.types";
import {
  mapRowsToOdysseyState,
  mapSessionToTurnUpserts,
  mapStateToCapabilityUpserts,
  mapStateToContextUpserts,
  mapStateToGoalUpserts,
  mapStateToMemoryUpserts,
  mapStateToPreferencesUpsert,
  mapStateToProfileUpsert,
  mapStateToSessionUpserts,
  type OdysseyStateRows,
} from "./state-mapper";

type Tables = Database["public"]["Tables"];
type ProfileRow = Tables["profiles"]["Row"];
type PreferencesRow = Tables["user_preferences"]["Row"];
type GoalRow = Tables["goals"]["Row"];
type ContextRow = Tables["user_contexts"]["Row"];
type CapabilityRow = Tables["user_capabilities"]["Row"];
type RecurringErrorRow = Tables["recurring_errors"]["Row"];
type MemoryRow = Tables["user_memories"]["Row"];
type SessionRow = Tables["sessions"]["Row"];
type TurnRow = Tables["conversation_turns"]["Row"];

function groupBySessionId<T extends { session_id: string }>(rows: T[]): Record<string, T[]> {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    (acc[row.session_id] ??= []).push(row);
    return acc;
  }, {});
}

/**
 * postgrest-js@2.110.7's generic inference against our ~13-table Database
 * breaks down for `.upsert()` specifically (verified in isolation:
 * `.select().returns<T>()` infers correctly against the full schema;
 * `.upsert()` against the same schema resolves its Row/Insert generics to
 * `never` regardless of what's passed — even a plain, non-intersection
 * argument type fails identically; the same `.upsert()` call against a
 * trivial 1-table schema infers fine). This is an upstream limitation, not
 * a real type-safety gap: row shapes are already checked at their source
 * by the `mapStateTo*Upsert(s)` functions (state-mapper.ts, covered by
 * state-mapper.test.ts) — these two casts only bypass the broken
 * re-checking at the `.upsert()` boundary itself.
 */
function asUpsertArg<T>(rows: T): never {
  return rows as never;
}
function asWrite(builder: unknown): Promise<{ error: unknown } | undefined> {
  return builder as Promise<{ error: unknown } | undefined>;
}

/**
 * Supabase-backed persistence for authenticated accounts (Phase 2). Reads
 * and writes the normalized tables from supabase/migrations/0001_init.sql
 * rather than a single JSON blob, but exposes the same
 * `UserStateRepository` interface as the guest-mode local repository so
 * `src/lib/app-state.tsx` can swap between them without change.
 */
export class SupabaseStateRepository implements UserStateRepository {
  constructor(private readonly authUserId: string) {}

  async load(): Promise<OdysseyState | null> {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", this.authUserId)
      .maybeSingle()
      .returns<ProfileRow>();

    if (profileError) {
      // Distinct from "no profile row exists yet" (which `.maybeSingle()`
      // reports as `data: null, error: null`, handled below): a real query
      // error here must not be treated as "first sign-in" by the caller, or
      // it re-runs the guest-to-account migration against an account that
      // already exists, minting a new profile id that conflicts with
      // existing foreign keys (e.g. user_preferences.user_id).
      console.error("[SupabaseStateRepository] failed to load profile", profileError);
      throw new Error("Failed to load Supabase profile");
    }
    if (!profile) return null;

    const userId = profile.id;
    const [preferences, goals, contexts, capabilities, recurringErrors, memories, sessions] =
      await Promise.all([
        supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
          .returns<PreferencesRow>(),
        supabase.from("goals").select("*").eq("user_id", userId).returns<GoalRow[]>(),
        supabase.from("user_contexts").select("*").eq("user_id", userId).returns<ContextRow[]>(),
        supabase
          .from("user_capabilities")
          .select("*")
          .eq("user_id", userId)
          .returns<CapabilityRow[]>(),
        supabase
          .from("recurring_errors")
          .select("*")
          .eq("user_id", userId)
          .returns<RecurringErrorRow[]>(),
        supabase.from("user_memories").select("*").eq("user_id", userId).returns<MemoryRow[]>(),
        supabase.from("sessions").select("*").eq("user_id", userId).returns<SessionRow[]>(),
      ]);

    const sessionIds = (sessions.data ?? []).map((s) => s.id);
    const turnsResult =
      sessionIds.length > 0
        ? await supabase
            .from("conversation_turns")
            .select("*")
            .in("session_id", sessionIds)
            .returns<TurnRow[]>()
        : { data: [] as TurnRow[] };

    const rows: OdysseyStateRows = {
      profile,
      preferences: preferences.data ?? null,
      goals: goals.data ?? [],
      contexts: contexts.data ?? [],
      capabilities: capabilities.data ?? [],
      recurringErrors: recurringErrors.data ?? [],
      memories: memories.data ?? [],
      sessions: sessions.data ?? [],
      turnsBySessionId: groupBySessionId(turnsResult.data ?? []),
    };

    return mapRowsToOdysseyState(rows);
  }

  async save(state: OdysseyState): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const profileUpsertResult = await supabase
      .from("profiles")
      .upsert(asUpsertArg(mapStateToProfileUpsert(this.authUserId, state)), {
        onConflict: "auth_user_id",
      })
      .select()
      .single();
    // See asUpsertArg's comment: .returns<T>() doesn't reliably override the
    // result type after an .upsert() call against our full schema, so this
    // one is cast directly instead.
    const profile = profileUpsertResult.data as ProfileRow | null;
    const profileError = profileUpsertResult.error;

    if (profileError || !profile) {
      console.error("[SupabaseStateRepository] failed to save profile", profileError);
      return;
    }

    const userId = profile.id;
    const writes: Promise<{ error: unknown } | undefined>[] = [
      asWrite(
        supabase
          .from("user_preferences")
          .upsert(asUpsertArg(mapStateToPreferencesUpsert(userId, state))),
      ),
    ];

    const goals = mapStateToGoalUpserts(userId, state);
    if (goals.length > 0) writes.push(asWrite(supabase.from("goals").upsert(asUpsertArg(goals))));

    const contexts = mapStateToContextUpserts(userId, state);
    if (contexts.length > 0)
      writes.push(asWrite(supabase.from("user_contexts").upsert(asUpsertArg(contexts))));

    const memories = mapStateToMemoryUpserts(userId, state);
    if (memories.length > 0)
      writes.push(asWrite(supabase.from("user_memories").upsert(asUpsertArg(memories))));

    const capabilities = mapStateToCapabilityUpserts(userId, state);
    if (capabilities.length > 0) {
      writes.push(
        asWrite(
          supabase
            .from("user_capabilities")
            .upsert(asUpsertArg(capabilities), { onConflict: "user_id,capability_id" }),
        ),
      );
    }

    const sessions = mapStateToSessionUpserts(userId, state);
    if (sessions.length > 0)
      writes.push(asWrite(supabase.from("sessions").upsert(asUpsertArg(sessions))));

    const results = await Promise.all(writes);

    // conversation_turns' RLS policy requires its session_id to already
    // exist in `sessions` (see 0001_init.sql). Writing turns in the same
    // Promise.all as the sessions upsert above is a race: PostgREST issues
    // each upsert as an independent request/transaction, so a turn insert
    // can reach the database before its parent session's insert commits,
    // failing with "new row violates row-level security policy" even
    // though the session upsert itself succeeds moments later. Turns are
    // therefore only written after `sessions` above has been awaited.
    const turnWrites: Promise<{ error: unknown } | undefined>[] = [];
    for (const session of state.sessions) {
      const turns = mapSessionToTurnUpserts(session as Session);
      if (turns.length > 0)
        turnWrites.push(asWrite(supabase.from("conversation_turns").upsert(asUpsertArg(turns))));
    }
    const turnResults = await Promise.all(turnWrites);

    for (const result of [...results, ...turnResults]) {
      if (result?.error)
        console.error("[SupabaseStateRepository] partial save failure", result.error);
    }
  }

  /**
   * No-op by design: clearing an authenticated account's data is a
   * destructive, server-authorized operation (account deletion via the
   * service-role client), not something the client-side repository does
   * silently. See src/app/api/account/delete/route.ts.
   */
  async clear(): Promise<void> {}
}
