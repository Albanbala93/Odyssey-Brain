/**
 * Generates a random v4 UUID without pulling in an external dependency.
 * Every id produced here ends up, unchanged, as the primary key of a
 * Postgres `uuid` column once Supabase persistence is active
 * (supabase/migrations/0001_init.sql) — it must always be a valid UUID,
 * never a prefixed string like "session_...", or writes fail with
 * "invalid input syntax for type uuid".
 */
export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Defensive fallback for environments without crypto.randomUUID; not
  // expected to run given this project's supported browser/Node versions.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
