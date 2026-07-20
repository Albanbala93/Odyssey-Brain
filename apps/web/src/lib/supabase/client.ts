"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config";
import type { Database } from "./database.types";

/**
 * Browser Supabase client. Returns `null` when Supabase isn't configured —
 * callers must handle the guest/local-mode fallback explicitly rather than
 * crash (AGENTS.md §3.2).
 */
export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  return createBrowserClient<Database>(config.url, config.anonKey);
}
