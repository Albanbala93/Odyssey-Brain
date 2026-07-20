import type { OdysseyState } from "@/domain/types";

/**
 * Persistence abstraction. `LocalStorageStateRepository` (Phase 1, active
 * today) and a future `SupabaseStateRepository` (Phase 2) both implement
 * this so the rest of the app never talks to `localStorage` or Supabase
 * directly (AGENTS.md §3.4).
 */
export interface UserStateRepository {
  load(): OdysseyState | null;
  save(state: OdysseyState): void;
  clear(): void;
}

export const STATE_SCHEMA_VERSION = 1;
