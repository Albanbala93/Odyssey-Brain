"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { TranslationLayer } from "@/components/coach/TranslationLayer";
import { VoiceRecorder } from "@/components/coach/VoiceRecorder";
import type { GoalCategory } from "@/domain/types";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GOAL_OPTIONS: { value: GoalCategory; en: string; fr: string; emoji: string }[] = [
  { value: "work", en: "Work", fr: "Travail", emoji: "💼" },
  { value: "travel", en: "Travel", fr: "Voyage", emoji: "🧳" },
  { value: "studies", en: "Studies", fr: "Études", emoji: "🎓" },
  { value: "personal", en: "Personal", fr: "Personnel", emoji: "❤️" },
];

const SITUATION_OPTIONS = [
  { en: "Meetings", fr: "Réunions" },
  { en: "Clients", fr: "Clients" },
  { en: "Emails", fr: "E-mails" },
  { en: "Presentations", fr: "Présentations" },
  { en: "Interviews", fr: "Entretiens" },
  { en: "Networking", fr: "Réseautage" },
  { en: "Other", fr: "Autre" },
];

function CoachBubble({ english, french }: { english: string; french: string }) {
  return (
    <div className="bg-accent-soft rounded-3xl p-5">
      <TranslationLayer english={english} french={french} defaultVisible />
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isReady, completeOnboarding, startMission } = useAppState();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goalCategory, setGoalCategory] = useState<GoalCategory | null>(null);
  const [professionalContext, setProfessionalContext] = useState("");
  const [situations, setSituations] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isReady) return <Splash />;

  function toggleSituation(label: string) {
    setSituations((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
    );
  }

  async function finish() {
    if (situations.length === 0 || isStarting) return;
    setIsStarting(true);
    setError(null);
    try {
      completeOnboarding({
        name: name.trim(),
        goalCategory: goalCategory ?? "personal",
        professionalContext: professionalContext.trim() || undefined,
        situations,
      });
      const sessionId = await startMission();
      router.push(`/session/${sessionId}`);
    } catch {
      setError("Impossible de démarrer ta première mission. Réessaie.");
      setIsStarting(false);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between">
          <p className="text-muted text-sm font-black tracking-widest uppercase">Odyssey</p>
          <p className="text-muted text-xs">Étape {step + 1}/4</p>
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <CoachBubble english="Hi, I'm Alex." french="Salut, je m'appelle Alex." />
            <CoachBubble
              english="I'll help you feel more confident when speaking English."
              french="Je vais t'aider à te sentir plus confiant(e) à l'oral en anglais."
            />
            <CoachBubble english="What's your name?" french="Comment t'appelles-tu ?" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ton prénom"
              aria-label="Ton prénom"
              className="border-border bg-surface rounded-2xl border px-4 py-3.5 text-base"
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(1)}
            />
            <VoiceRecorder onResult={(text) => setName(text)} />
            <Button disabled={!name.trim()} onClick={() => setStep(1)}>
              Continuer
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <CoachBubble
              english="Why are you here today?"
              french="Pourquoi es-tu ici aujourd'hui ?"
            />
            <div className="grid gap-3">
              {GOAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setGoalCategory(option.value);
                    setStep(option.value === "work" ? 2 : 3);
                  }}
                  className="border-border bg-surface hover:bg-accent-soft rounded-2xl border p-4 text-left transition-colors"
                >
                  <span className="text-base font-semibold">
                    {option.emoji} {option.en}
                  </span>
                  <span className="text-muted block text-sm">{option.fr}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <CoachBubble
              english="What kind of work do you do?"
              french="Quel type de travail fais-tu ?"
            />
            <input
              value={professionalContext}
              onChange={(e) => setProfessionalContext(e.target.value)}
              placeholder="Ex : chef de projet marketing"
              aria-label="Ton activité professionnelle"
              className="border-border bg-surface rounded-2xl border px-4 py-3.5 text-base"
              onKeyDown={(e) => e.key === "Enter" && setStep(3)}
            />
            <Button onClick={() => setStep(3)}>Continuer</Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-1 flex-col gap-4">
            <CoachBubble
              english="When do you usually need English?"
              french="Dans quelles situations as-tu généralement besoin de l'anglais ?"
            />
            <div className="grid grid-cols-2 gap-3">
              {SITUATION_OPTIONS.map((option) => {
                const active = situations.includes(option.en);
                return (
                  <button
                    key={option.en}
                    type="button"
                    onClick={() => toggleSituation(option.en)}
                    aria-pressed={active}
                    className={`rounded-2xl border p-3 text-left transition-colors ${
                      active ? "border-accent bg-accent-soft" : "border-border bg-surface"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.en}</span>
                    <span className="text-muted block text-xs">{option.fr}</span>
                  </button>
                );
              })}
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <Button
              disabled={situations.length === 0 || isStarting}
              onClick={finish}
              className="mt-auto"
            >
              {isStarting ? "Préparation de ta première mission…" : "Commencer ma première mission"}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
