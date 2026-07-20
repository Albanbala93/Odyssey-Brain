"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface AuthContextValue {
  /** Whether this deployment has Supabase configured at all (Phase 2 vs guest-only). */
  supabaseConfigured: boolean;
  /** True once the initial session lookup has resolved. */
  isReady: boolean;
  user: User | null;
  session: Session | null;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseConfigured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(!supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, [supabaseConfigured]);

  async function signInWithMagicLink(email: string): Promise<{ error: string | null }> {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return { error: "Supabase n'est pas configuré sur cet environnement." };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message ?? null };
  }

  async function signOut(): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      supabaseConfigured,
      isReady,
      user: session?.user ?? null,
      session,
      signInWithMagicLink,
      signOut,
    }),
    [supabaseConfigured, isReady, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
