"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { FeedbackCard } from "@/components/FeedbackCard";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { getMissionById } from "@/domain/missions";
import { useAppState } from "@/lib/app-state";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DebriefPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { isReady, getSession, finishSession, startMission } = useAppState();

  const session = isReady ? getSession(sessionId) : undefined;

  useEffect(() => {
    if (session && session.status === "in_progress") {
      finishSession(sessionId);
    }
  }, [session, sessionId, finishSession]);

  if (!isReady) return <Splash />;

  if (!session) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col justify-center gap-4 px-6">
          <ErrorState message="Ce débrief est introuvable." />
          <Button variant="secondary" onClick={() => router.push("/today")}>
            Retour à Today
          </Button>
        </div>
      </AppShell>
    );
  }

  const debrief = session.debrief;
  const mission = getMissionById(session.missionId);
  const nextMission = debrief?.recommendedNextMissionId
    ? getMissionById(debrief.recommendedNextMissionId)
    : undefined;

  async function replay() {
    const newSessionId = await startMission(session!.missionId);
    router.push(`/session/${newSessionId}`);
  }

  async function startNext() {
    const newSessionId = await startMission(nextMission?.id);
    router.push(`/session/${newSessionId}`);
  }

  if (!debrief || !mission) return <Splash />;

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-4 px-6 py-8">
        <div className="text-center">
          <span className="bg-success-soft text-success inline-block rounded-full px-3 py-1 text-xs font-bold">
            Mission terminée
          </span>
          <p className="text-success mt-3 text-4xl font-black">+{debrief.scoreDelta}%</p>
          <h1 className="mt-1 text-xl font-bold">{mission.titleFr}</h1>
          <p className="text-muted mt-1 text-sm">
            Tu as répondu {session.turns.filter((t) => t.role === "user").length} fois et produit
            environ {debrief.learnerWordCount} mots en anglais.
          </p>
        </div>

        {debrief.strengths.map((strength, i) => (
          <FeedbackCard key={i} eyebrow="Point fort" tone="success">
            {strength}
          </FeedbackCard>
        ))}
        <FeedbackCard eyebrow="Prochaine amélioration">{debrief.priorityImprovement}</FeedbackCard>
        <FeedbackCard eyebrow="Exemple amélioré">“{debrief.improvedExample}”</FeedbackCard>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          {nextMission && (
            <Button onClick={startNext}>Mission suivante : {nextMission.titleFr}</Button>
          )}
          <Button variant="secondary" onClick={replay}>
            Rejouer cette mission
          </Button>
          <Button variant="ghost" onClick={() => router.push("/today")}>
            Retour à Today
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
