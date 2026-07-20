/**
 * Whether Supabase is configured for this deployment. When false, the app
 * runs entirely in guest/local mode (ODYSSEY_MASTER_PROMPT_CODEX.md §5.1) —
 * no auth screens are shown, and `LocalStorageStateRepository` is the only
 * persistence used. Safe to call from client or server code; only reads
 * `NEXT_PUBLIC_*` variables.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabasePublicConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
