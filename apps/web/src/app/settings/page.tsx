"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DifficultyLevel, TranslationMode } from "@/domain/types";
import { useAppState } from "@/lib/app-state";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const { state, isReady, updatePreferences, updateConsent, resetProfile, deleteAccount } =
    useAppState();
  const { user, supabaseConfigured, signOut } = useAuth();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !state.user.onboardingCompletedAt) router.replace("/welcome");
  }, [isReady, state.user.onboardingCompletedAt, router]);

  if (!isReady || !state.user.onboardingCompletedAt) return <Splash />;

  const { preferences } = state.user;
  const isGuest = state.user.identity.isGuest;

  function handleReset() {
    resetProfile();
    router.push("/welcome");
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      router.push("/welcome");
    } catch {
      setDeleteError("La suppression du compte a échoué. Réessaie.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/welcome");
  }

  // ODYSSEY_MASTER_PROMPT_CODEX.md §5.11 data export: everything Odyssey
  // holds about the learner is already loaded client-side as `state` (guest
  // or authenticated, same shape either way), so exporting it is a direct
  // download with no extra server round-trip.
  function handleExportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `odyssey-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold">{state.user.identity.name || "Profil"}</h1>
          <p className="text-muted mt-1 text-sm">
            {isGuest
              ? "Mode invité — progression stockée sur cet appareil uniquement."
              : (user?.email ?? "Compte")}
          </p>
        </div>

        {isGuest && supabaseConfigured && (
          <Card>
            <p className="text-sm font-semibold">Sauvegarder ta progression</p>
            <p className="text-muted mt-1 text-xs">
              Crée un compte pour retrouver tes missions et ta progression sur n&apos;importe quel
              appareil. Ta progression actuelle sera conservée.
            </p>
            <Button className="mt-3" variant="secondary" onClick={() => router.push("/auth")}>
              Créer un compte
            </Button>
          </Card>
        )}

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

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Niveau
            <select
              value={preferences.difficultyLevel}
              onChange={(e) =>
                updatePreferences({ difficultyLevel: e.target.value as DifficultyLevel })
              }
              className="border-border bg-surface rounded-xl border px-3 py-2.5"
            >
              <option value="adaptive">Laisser Odyssey décider</option>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
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

        <Card className="flex flex-col gap-4">
          <p className="text-sm font-semibold">Confidentialité</p>

          <label className="flex items-center justify-between gap-4 text-sm font-medium">
            <span>
              Stockage vocal
              <span className="text-muted block text-xs font-normal">
                Conserver l&apos;audio de tes réponses (sinon seule la transcription texte est
                gardée).
              </span>
            </span>
            <input
              type="checkbox"
              checked={state.user.consent.storeVoice}
              onChange={(e) => updateConsent({ storeVoice: e.target.checked })}
              className="h-5 w-5 shrink-0"
            />
          </label>

          <label className="flex items-center justify-between gap-4 text-sm font-medium">
            <span>
              Mémoire personnelle
              <span className="text-muted block text-xs font-normal">
                Autoriser Odyssey à retenir des faits sur toi entre les sessions (objectifs,
                réussites…).
              </span>
            </span>
            <input
              type="checkbox"
              checked={state.user.consent.storePersonalMemory}
              onChange={(e) => updateConsent({ storePersonalMemory: e.target.checked })}
              className="h-5 w-5 shrink-0"
            />
          </label>

          <label className="flex items-center justify-between gap-4 text-sm font-medium">
            <span>
              Analytics
              <span className="text-muted block text-xs font-normal">
                Autoriser la mesure d&apos;usage anonymisée pour améliorer l&apos;app.
              </span>
            </span>
            <input
              type="checkbox"
              checked={state.user.consent.analytics}
              onChange={(e) => updateConsent({ analytics: e.target.checked })}
              className="h-5 w-5 shrink-0"
            />
          </label>

          <Button variant="secondary" onClick={() => router.push("/settings/memories")}>
            Ce qu&apos;Odyssey retient de moi ({state.user.memories.length})
          </Button>

          <Button variant="secondary" onClick={handleExportData}>
            Exporter mes données
          </Button>
        </Card>

        <div className="mt-auto flex flex-col gap-2">
          {!isGuest && (
            <Button variant="secondary" onClick={handleSignOut}>
              Se déconnecter
            </Button>
          )}

          {isGuest ? (
            confirmingReset ? (
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
            )
          ) : confirmingDelete ? (
            <>
              <p className="text-danger text-center text-sm">
                Ton compte et toutes tes données seront définitivement supprimés. Confirmer ?
              </p>
              {deleteError && <p className="text-danger text-center text-sm">{deleteError}</p>}
              <Button
                variant="secondary"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="border-danger text-danger"
              >
                {isDeleting ? "Suppression…" : "Oui, supprimer mon compte"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmingDelete(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
              className="text-danger"
            >
              Supprimer mon compte
            </Button>
          )}
        </div>
      </div>
      <BottomNavigation />
    </AppShell>
  );
}
