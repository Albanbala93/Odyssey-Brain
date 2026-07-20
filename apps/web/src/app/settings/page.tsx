"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TranslationMode } from "@/domain/types";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const { state, isReady, updatePreferences, resetProfile } = useAppState();
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    if (isReady && !state.user.onboardingCompletedAt) router.replace("/welcome");
  }, [isReady, state.user.onboardingCompletedAt, router]);

  if (!isReady || !state.user.onboardingCompletedAt) return <Splash />;

  const { preferences } = state.user;

  function handleReset() {
    resetProfile();
    router.push("/welcome");
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold">{state.user.identity.name || "Profil"}</h1>
          <p className="text-muted mt-1 text-sm">
            {state.user.identity.isGuest
              ? "Mode invité — progression stockée sur cet appareil uniquement."
              : "Compte"}
          </p>
        </div>

        <Card className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Traduction
            <select
              value={preferences.translationMode}
              onChange={(e) =>
                updatePreferences({ translationMode: e.target.value as TranslationMode })
              }
              className="border-border bg-surface rounded-xl border px-3 py-2.5"
            >
              <option value="always">Toujours afficher</option>
              <option value="adaptive">Laisser Odyssey décider</option>
              <option value="on_demand">À la demande</option>
            </select>
          </label>

          <label className="flex items-center justify-between text-sm font-medium">
            Lecture automatique du coach
            <input
              type="checkbox"
              checked={preferences.autoSpeak}
              onChange={(e) => updatePreferences({ autoSpeak: e.target.checked })}
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between text-sm font-medium">
            Lecture ralentie
            <input
              type="checkbox"
              checked={preferences.slowSpeech}
              onChange={(e) => updatePreferences({ slowSpeech: e.target.checked })}
              className="h-5 w-5"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Durée de session préférée : {preferences.preferredSessionMinutes} min
            <input
              type="range"
              min={3}
              max={15}
              value={preferences.preferredSessionMinutes}
              onChange={(e) =>
                updatePreferences({ preferredSessionMinutes: Number(e.target.value) })
              }
            />
          </label>
        </Card>

        <Card>
          <p className="text-sm font-semibold">Confidentialité</p>
          <p className="text-muted mt-1 text-xs">
            Consentements enregistrés : stockage vocal{" "}
            {state.user.consent.storeVoice ? "activé" : "désactivé"}, mémoire personnelle{" "}
            {state.user.consent.storePersonalMemory ? "activée" : "désactivée"}, analytics{" "}
            {state.user.consent.analytics ? "activé" : "désactivé"}.
          </p>
        </Card>

        <div className="mt-auto flex flex-col gap-2">
          {confirmingReset ? (
            <>
              <p className="text-danger text-center text-sm">
                Toute ta progression locale sera supprimée. Confirmer ?
              </p>
              <Button
                variant="secondary"
                onClick={handleReset}
                className="border-danger text-danger"
              >
                Oui, réinitialiser
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingReset(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setConfirmingReset(true)}>
              Réinitialiser le profil
            </Button>
          )}
        </div>
      </div>
      <BottomNavigation />
    </AppShell>
  );
}
