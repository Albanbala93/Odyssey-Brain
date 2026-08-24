"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CapabilityCard } from "@/components/CapabilityCard";
import { FeedbackCard } from "@/components/FeedbackCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CAPABILITIES } from "@/domain/capabilities-catalog";
import { useAppState } from "@/lib/app-state";
import { correctionCategoryLabelFr } from "@/lib/correction-labels";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MASTERED_STATUSES = new Set(["solid", "spontaneous"]);

export default function ProgressPage() {
  const router = useRouter();
  const { state, isReady } = useAppState();

  useEffect(() => {
    if (isReady && !state.user.onboardingCompletedAt) router.replace("/welcome");
  }, [isReady, state.user.onboardingCompletedAt, router]);

  if (!isReady || !state.user.onboardingCompletedAt) return <Splash />;

  const practiced = state.user.capabilities.filter((c) => c.attemptCount > 0);
  const notYet = state.user.capabilities.filter((c) => c.attemptCount === 0);
  const completedSessions = state.sessions.filter((s) => s.status === "completed").length;
  const masteredCount = state.user.capabilities.filter((c) =>
    MASTERED_STATUSES.has(c.status),
  ).length;
  // The same data already driving the coach's selective-correction prompt
  // (coach-system-prompt.ts) and the debrief's practice recommendation —
  // surfaced here too so a learner can check "what am I still working on"
  // anytime, not only right after a session that happened to correct it.
  const pointsToPractice = state.user.recurringErrors
    .filter((e) => e.status === "active")
    .slice()
    .sort((a, b) => b.count - a.count);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold">Tes progrès</h1>
          <p className="text-muted mt-1 text-sm">
            {completedSessions} session{completedSessions > 1 ? "s" : ""} terminée
            {completedSessions > 1 ? "s" : ""} • {masteredCount}/{CAPABILITIES.length} capacité
            {masteredCount > 1 ? "s" : ""} maîtrisée{masteredCount > 1 ? "s" : ""}
          </p>
        </div>

        {pointsToPractice.length > 0 && (
          <div>
            <p className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              Points à retravailler
            </p>
            <div className="flex flex-col gap-2">
              {pointsToPractice.map((error) => (
                <FeedbackCard
                  key={error.id}
                  eyebrow={`${correctionCategoryLabelFr(error.category)} • vu ${error.count} fois`}
                >
                  {error.pattern}
                </FeedbackCard>
              ))}
            </div>
          </div>
        )}

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
