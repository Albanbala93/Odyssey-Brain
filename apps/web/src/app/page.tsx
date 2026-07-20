"use client";

import { Splash } from "@/components/AppShell";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();
  const { state, isReady } = useAppState();

  useEffect(() => {
    if (!isReady) return;
    router.replace(state.user.onboardingCompletedAt ? "/today" : "/welcome");
  }, [isReady, state.user.onboardingCompletedAt, router]);

  return <Splash />;
}
