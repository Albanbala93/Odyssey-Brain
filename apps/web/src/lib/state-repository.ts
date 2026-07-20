import type { OdysseyState } from "@/domain/types";

/**
 * Persistence abstraction. `LocalStorageStateRepository` (guest mode) and
 * `SupabaseStateRepository` (Phase 2, authenticated accounts) both
 * implement this so the rest of the app never talks to `localStorage` or
 * Supabase directly (AGENTS.md §3.4). Async throughout so a
 * network-backed implementation is a drop-in replacement for the
 * synchronous local one.
 */
export interface UserStateRepository {
  load(): Promise<OdysseyState | null>;
  save(state: OdysseyState): Promise<void>;
  clear(): Promise<void>;
}

export const STATE_SCHEMA_VERSION = 1;
