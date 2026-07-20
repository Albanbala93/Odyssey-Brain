import type { OdysseyState } from "@/domain/types";
import { STATE_SCHEMA_VERSION, type UserStateRepository } from "./state-repository";

const STORAGE_KEY = "odyssey_state_v1";

/**
 * Guest-mode persistence: everything stays on this device only
 * (ODYSSEY_MASTER_PROMPT_CODEX.md §5.1). Safe to call during SSR — reads
 * and writes are no-ops when `window` is unavailable.
 */
export class LocalStorageStateRepository implements UserStateRepository {
  load(): OdysseyState | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as OdysseyState;
      if (parsed.schemaVersion !== STATE_SCHEMA_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  save(state: OdysseyState): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable (private browsing): silently skip persistence
      // rather than crashing the session.
    }
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
