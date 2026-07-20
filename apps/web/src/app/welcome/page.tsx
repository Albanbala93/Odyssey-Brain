"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const { state, isReady } = useAppState();

  useEffect(() => {
    if (isReady && state.user.onboardingCompletedAt) {
      router.replace("/today");
    }
  }, [isReady, state.user.onboardingCompletedAt, router]);

  if (!isReady) return <Splash />;

  return (
    <AppShell>
      <div className="flex flex-1 flex-col justify-center px-6 py-10">
        <p className="text-muted text-sm font-black tracking-widest uppercase">Odyssey</p>
        <h1 className="mt-4 text-4xl leading-tight font-bold">Let&apos;s speak.</h1>
        <p className="text-muted mt-3 text-base">
          Ton coach IA est prêt. Tu parleras anglais dès la première minute — pas de test de niveau,
          pas de cours, juste une conversation utile.
        </p>
        <Button className="mt-8" onClick={() => router.push("/onboarding")}>
          Continuer
        </Button>
        <p className="text-muted mt-4 text-xs">
          En continuant, tu acceptes que tes réponses soient utilisées pour personnaliser tes
          missions. En mode invité, tout reste uniquement sur cet appareil.
        </p>
      </div>
    </AppShell>
  );
}
