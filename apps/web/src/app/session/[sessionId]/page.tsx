"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingCoach } from "@/components/ui/LoadingCoach";
import { CoachMessage } from "@/components/coach/CoachMessage";
import { UserMessage } from "@/components/coach/UserMessage";
import { VoiceRecorder } from "@/components/coach/VoiceRecorder";
import { shouldShowTranslation } from "@/domain/translation-policy";
import { speakEnglish } from "@/lib/speech-synthesis";
import { useAppState } from "@/lib/app-state";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const {
    state,
    isReady,
    getSession,
    getMissionForSession,
    submitUserTurn,
    finishSession,
    recordTranslationToggle,
  } = useAppState();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lastSpokenTurnId = useRef<string | null>(null);

  const session = isReady ? getSession(sessionId) : undefined;
  const mission = isReady ? getMissionForSession(sessionId) : undefined;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.turns.length]);

  useEffect(() => {
    if (!session || !state.user.preferences.autoSpeak) return;
    const lastTurn = session.turns[session.turns.length - 1];
    if (lastTurn?.role === "coach" && lastTurn.id !== lastSpokenTurnId.current) {
      lastSpokenTurnId.current = lastTurn.id;
      speakEnglish(lastTurn.englishText, { slow: state.user.preferences.slowSpeech });
    }
  }, [session, state.user.preferences.autoSpeak, state.user.preferences.slowSpeech]);

  if (!isReady) return <Splash />;

  if (!session || !mission) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col justify-center gap-4 px-6">
          <ErrorState message="Cette session est introuvable." />
          <Button variant="secondary" onClick={() => router.push("/today")}>
            Retour à Today
          </Button>
        </div>
      </AppShell>
    );
  }

  const totalExpectedTurns = mission.scriptedTurns.length + 1;
  const coachTurnsSoFar = session.turns.filter((t) => t.role === "coach").length;

  async function handleSend(text: string, transcriptionConfidence?: number) {
    if (!text.trim() || isSending || session!.status !== "in_progress") return;
    setIsSending(true);
    setError(null);
    try {
      await submitUserTurn(sessionId, text, transcriptionConfidence);
      setDraft("");
    } catch {
      setError("La réponse du coach n'a pas pu être générée. Réessaie.");
    } finally {
      setIsSending(false);
    }
  }

  function handleFinish() {
    finishSession(sessionId);
    router.push(`/session/${sessionId}/debrief`);
  }

  return (
    <AppShell>
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/today")}
          aria-label="Retour à Today"
          className="border-border rounded-full border px-3 py-1.5 text-sm"
        >
          ←
        </button>
        <p className="text-muted text-xs font-semibold">
          {mission.titleFr} • {Math.min(coachTurnsSoFar, totalExpectedTurns)}/{totalExpectedTurns}
        </p>
        <span className="w-8" />
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {session.turns.map((turn) =>
          turn.role === "coach" ? (
            <CoachMessage
              key={turn.id}
              english={turn.englishText}
              french={turn.frenchText ?? ""}
              showTranslation={shouldShowTranslation({
                mode: state.user.preferences.translationMode,
                comprehensionRisk: turn.comprehensionRisk,
              })}
              onToggleTranslation={(visible) => recordTranslationToggle(sessionId, visible)}
              source={turn.source}
            />
          ) : (
            <UserMessage key={turn.id} text={turn.englishText} />
          ),
        )}
        {isSending && <LoadingCoach />}
        <div ref={chatEndRef} />
      </div>

      {error && (
        <div className="px-4">
          <ErrorState message={error} onRetry={() => setError(null)} />
        </div>
      )}

      <div className="border-border flex flex-col gap-3 border-t px-4 py-4">
        {session.status === "in_progress" ? (
          <>
            <VoiceRecorder onResult={handleSend} disabled={isSending} />
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(draft)}
                placeholder="Ou écris ta réponse…"
                aria-label="Ta réponse"
                disabled={isSending}
                className="border-border bg-surface flex-1 rounded-2xl border px-4 py-3 text-base"
              />
              <Button
                className="w-auto px-5"
                onClick={() => handleSend(draft)}
                disabled={isSending || !draft.trim()}
              >
                Envoyer
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  speakEnglish(session.turns[session.turns.length - 1]?.englishText ?? "")
                }
              >
                🔊 Réécouter
              </Button>
              <Button variant="secondary" onClick={handleFinish}>
                Terminer
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={() => router.push(`/session/${sessionId}/debrief`)}>
            Voir le débrief
          </Button>
        )}
      </div>
    </AppShell>
  );
}
