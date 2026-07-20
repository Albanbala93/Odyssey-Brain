"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CapabilityCard } from "@/components/CapabilityCard";
import { IntentCard } from "@/components/IntentCard";
import { MissionCard } from "@/components/MissionCard";
import { CAPABILITIES, getCapabilityBySlug } from "@/domain/capabilities-catalog";
import { recommendMission } from "@/domain/decision-engine";
import { MISSIONS } from "@/domain/missions";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function TodayPage() {
  const router = useRouter();
  const { state, isReady, recommendedMission, startMission } = useAppState();
  const [isStarting, setIsStarting] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !state.user.onboardingCompletedAt) router.replace("/welcome");
  }, [isReady, state.user.onboardingCompletedAt, router]);

  const recommendation = useMemo(() => {
    if (!isReady) return null;
    try {
      return recommendedMission();
    } catch {
      return null;
    }
  }, [isReady, recommendedMission]);

  async function handleStart(intentId: string, missionId?: string) {
    setIsStarting(intentId);
    try {
      const sessionId = await startMission(missionId);
      router.push(`/session/${sessionId}`);
    } finally {
      setIsStarting(null);
    }
  }

  if (!isReady || !state.user.onboardingCompletedAt || !recommendation) return <Splash />;

  const recommendedCapabilityDefinition = getCapabilityBySlug(
    recommendation.mission.targetCapabilitySlug,
  );
  const practiced = state.user.capabilities.filter((c) => c.attemptCount > 0);
  const capabilitiesToShow = (
    recommendedCapabilityDefinition
      ? [
          state.user.capabilities.find(
            (c) => c.capabilityId === recommendedCapabilityDefinition.id,
          ),
          ...practiced.filter((c) => c.capabilityId !== recommendedCapabilityDefinition.id),
        ]
      : practiced
  )
    .filter((c): c is (typeof state.user.capabilities)[number] => Boolean(c))
    .slice(0, 2);

  const smallestMission = MISSIONS.reduce(
    (min, m) => (m.estimatedMinutes < min.estimatedMinutes ? m : min),
    MISSIONS[0],
  );

  // "Aide-moi à progresser" must offer a *different* mission than the
  // primary recommendation, otherwise the button feels dead — pick the
  // best option once the top pick is excluded.
  const otherMissions = MISSIONS.filter((m) => m.id !== recommendation.mission.id);
  const progressMission =
    otherMissions.length > 0
      ? recommendMission(state.user, otherMissions).mission
      : recommendation.mission;

  // "Discussion libre" picks among informal/networking scenarios using the
  // same decision engine, so it naturally varies instead of always
  // returning the same hardcoded mission.
  const networkingMissions = MISSIONS.filter((m) => m.contextType === "networking");
  const freeChatMission =
    networkingMissions.length > 0
      ? recommendMission(state.user, networkingMissions).mission
      : recommendation.mission;

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6 px-6 py-8 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-muted text-sm font-black tracking-widest uppercase">Odyssey</p>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Bonjour {state.user.identity.name || ""} 👋</h1>
          <p className="text-muted mt-1 text-sm">
            Ton coach a préparé une mission pour aujourd&apos;hui.
          </p>
        </div>

        <MissionCard
          mission={recommendation.mission}
          translationMode={state.user.preferences.translationMode}
          onStart={() => handleStart("primary", recommendation.mission.id)}
          isLoading={isStarting === "primary"}
        />

        <div>
          <p className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            Autres options
          </p>
          <div className="grid grid-cols-1 gap-2">
            <IntentCard
              label="🎯 Situation réelle"
              onClick={() => handleStart("real", recommendation.mission.id)}
            />
            <IntentCard
              label="💬 Discussion libre"
              onClick={() => handleStart("free", freeChatMission.id)}
            />
            <IntentCard
              label="⏱️ Session de 5 minutes"
              onClick={() => handleStart("short", smallestMission.id)}
            />
            <IntentCard
              label="📈 Aide-moi à progresser"
              onClick={() => handleStart("progress", progressMission.id)}
            />
            <IntentCard
              label="🎲 Surprends-moi"
              onClick={() => {
                const pool = otherMissions.length > 0 ? otherMissions : MISSIONS;
                const pick = pool[Math.floor(Math.random() * pool.length)];
                handleStart("surprise", pick.id);
              }}
            />
          </div>
        </div>

        {capabilitiesToShow.length > 0 && (
          <div>
            <p className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              Capacités en cours
            </p>
            <div className="flex flex-col gap-2">
              {capabilitiesToShow.map((progress) => {
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