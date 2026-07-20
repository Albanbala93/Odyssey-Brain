"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CapabilityCard } from "@/components/CapabilityCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CAPABILITIES } from "@/domain/capabilities-catalog";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProgressPage() {
  const router = useRouter();
  const { state, isReady } = useAppState();

  useEffect(() => {
    if (isReady && !state.user.onboardingCompletedAt) router.replace("/welcome");
  }, [isReady, state.user.onboardingCompletedAt, router]);

  if (!isReady || !state.user.onboardingCompletedAt) return <Splash />;

  const practiced = state.user.capabilities.filter((c) => c.attemptCount > 0);
  const notYet = state.user.capabilities.filter((c) => c.attemptCount === 0);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="text-2xl font-bold">Tes progrès</h1>

        {practiced.length === 0 ? (
          <EmptyState
            title="Aucune capacité travaillée pour l'instant"
            description="Termine ta première mission pour voir apparaître ta progression ici."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {practiced.map((progress) => {
              const definition = CAPABILITIES.find((c) => c.id === progress.capabilityId);
              if (!definition) return null;
              return (
                <CapabilityCard
                  key={progress.capabilityId}
                  labelFr={definition.labelFr}
                  progress={progress}
                />
              );
            })}
          </div>
        )}

        {notYet.length > 0 && (
          <div>
            <p className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              À découvrir
            </p>
            <div className="flex flex-col gap-2">
              {notYet.map((progress) => {
                const definition = CAPABILITIES.find((c) => c.id === progress.capabilityId);
                if (!definition) return null;
                return (
                  <CapabilityCard
                    key={progress.capabilityId}
                    labelFr={definition.labelFr}
                    progress={progress}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
      <BottomNavigation />
    </AppShell>
  );
}
