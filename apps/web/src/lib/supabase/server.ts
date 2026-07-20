import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";
import type { Database } from "./database.types";

/**
 * Server-side Supabase client (Server Components, Route Handlers, Server
 * Actions), bound to the request's cookies for session handling. Returns
 * `null` when Supabase isn't configured.
 */
export async function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render (not an Action/Route
          // Handler) — cookies can't be written there. The middleware
          // refresh path (src/middleware.ts) covers session refresh in
          // that case, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client for privileged server-only operations (account
 * deletion, data export). Never imported from client code, never uses the
 * anon key. Throws if the service role key isn't configured — callers must
 * only reach this path when they've already confirmed Supabase is set up.
 */
export function createSupabaseServiceRoleClient() {
  const config = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceRoleKey) {
    throw new Error("Supabase service role client requires SUPABASE_SERVICE_ROLE_KEY to be set");
  }
  return createClient<Database>(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
