"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { TranslationLayer } from "@/components/coach/TranslationLayer";
import { VoiceRecorder } from "@/components/coach/VoiceRecorder";
import type { OnboardingSituation } from "@/domain/user-model";
import type { ContextType, GoalCategory } from "@/domain/types";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GOAL_OPTIONS: { value: GoalCategory; en: string; fr: string; emoji: string }[] = [
  { value: "work", en: "Work", fr: "Travail", emoji: "💼" },
  { value: "travel", en: "Travel", fr: "Voyage", emoji: "🧳" },
  { value: "studies", en: "Studies", fr: "Études", emoji: "🎓" },
  { value: "personal", en: "Personal", fr: "Personnel", emoji: "❤️" },
];

/**
 * The situations offered on Screen 5 depend on why the learner is here
 * (Screen 3) — a "Personal" or "Travel" learner asking for "Meetings" and
 * "Clients" made every non-work learner get professional missions
 * regardless of what they picked (root cause of the "rubriques ne
 * correspondent pas" bug report). Each option's `type` is the real
 * ContextType the decision engine matches missions against.
 */
const SITUATION_OPTIONS: Record<
  GoalCategory,
  { type: ContextType; en: string; fr: string }[]
> = {
  work: [
    { type: "meetings", en: "Meetings", fr: "Réunions" },
    { type: "clients", en: "Clients", fr: "Clients" },
    { type: "emails", en: "Emails", fr: "E-mails" },
    { type: "presentations", en: "Presentations", fr: "Présentations" },
    { type: "interviews", en: "Interviews", fr: "Entretiens" },
    { type: "networking", en: "Networking", fr: "Réseautage" },
    { type: "other", en: "Other", fr: "Autre" },
  ],
  travel: [
    { type: "travel", en: "Bookings & transport", fr: "Réservations & transports" },
    { type: "daily_life", en: "Restaurants & shops", fr: "Restaurants & commerces" },
    { type: "networking", en: "Meeting people", fr: "Rencontres" },
    { type: "other", en: "Other", fr: "Autre" },
  ],
  studies: [
    { type: "studies", en: "Classes & presentations", fr: "Cours & présentations" },
    { type: "interviews", en: "Applications & interviews", fr: "Candidatures & entretiens" },
    { type: "daily_life", en: "Everyday student life", fr: "Vie quotidienne étudiante" },
    { type: "other", en: "Other", fr: "Autre" },
  ],
  personal: [
    { type: "daily_life", en: "Everyday life", fr: "Vie quotidienne" },
    { type: "travel", en: "Travel", fr: "Voyages" },
    { type: "networking", en: "Meeting people", fr: "Rencontres & amis" },
    { type: "other", en: "Other", fr: "Autre" },
  ],
};

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
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isReady) return <Splash />;

  const situationOptions = SITUATION_OPTIONS[goalCategory ?? "personal"];

  function toggleSituation(label: string) {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
    );
  }

  async function finish() {
    if (selectedLabels.length === 0 || isStarting) return;
    setIsStarting(true);
    setError(null);
    try {
      const situations: OnboardingSituation[] = selectedLabels
        .map((label) => situationOptions.find((option) => option.en === label))
        .filter((option): option is (typeof situationOptions)[number] => Boolean(option))
        .map((option) => ({ type: option.type, label: option.en }));
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
                    setSelectedLabels([]);
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
              {situationOptions.map((option) => {
                const active = selectedLabels.includes(option.en);
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
              disabled={selectedLabels.length === 0 || isStarting}
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
