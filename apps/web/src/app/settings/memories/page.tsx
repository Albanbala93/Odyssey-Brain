"use client";

import { AppShell, Splash } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MemoryCategory } from "@/domain/types";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const CATEGORY_LABEL: Record<MemoryCategory, string> = {
  identity: "Identité",
  professional_context: "Contexte professionnel",
  goals: "Objectifs",
  upcoming_situation: "Situation à venir",
  preference: "Préférence",
  recurring_vocabulary: "Vocabulaire récurrent",
  recurring_error: "Erreur récurrente",
  confidence_trigger: "Déclencheur de confiance",
  successful_formulation: "Formulation réussie",
  relationship_context: "Contexte relationnel",
};

/**
 * "Ce qu'Odyssey retient de moi" (ODYSSEY_MASTER_PROMPT_CODEX.md §5.12):
 * lets the learner see and delete every individual memory, rather than only
 * a coarse-grained consent toggle. Every entry already carries its source
 * and confidence (docs/PRIVACY_MODEL.md "Data provenance"), so both are
 * shown here to keep provenance visible, not just the content.
 */
export default function MemoriesPage() {
  const router = useRouter();
  const { state, isReady, deleteMemory } = useAppState();

  useEffect(() => {
    if (isReady && !state.user.onboardingCompletedAt) router.replace("/welcome");
  }, [isReady, state.user.onboardingCompletedAt, router]);

  if (!isReady || !state.user.onboardingCompletedAt) return <Splash />;

  const memories = [...state.user.memories].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <AppShell>
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/settings")}
          aria-label="Retour aux réglages"
          className="border-border rounded-full border px-3 py-1.5 text-sm"
        >
          ←
        </button>
        <p className="text-muted text-xs font-semibold">Ce qu&apos;Odyssey retient de moi</p>
        <span className="w-8" />
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-6">
        {memories.length === 0 ? (
          <p className="text-muted text-center text-sm">
            Rien de mémorisé pour l&apos;instant. Odyssey retient uniquement des faits observés
            pendant tes sessions — jamais de contenu sensible (docs/PRIVACY_MODEL.md).
          </p>
        ) : (
          memories.map((memory) => (
            <Card key={memory.id} className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted text-xs font-semibold tracking-wide uppercase">
                  {CATEGORY_LABEL[memory.category]}
                </p>
                <button
                  type="button"
                  onClick={() => deleteMemory(memory.id)}
                  aria-label="Supprimer ce souvenir"
                  className="text-danger text-xs underline underline-offset-2"
                >
                  Supprimer
                </button>
              </div>
              <p className="text-sm">{memory.content}</p>
              <p className="text-muted text-xs">
                {new Date(memory.createdAt).toLocaleDateString("fr-FR")} • source : {memory.source}{" "}
                • confiance : {Math.round(memory.confidence * 100)}%
                {memory.expiresAt &&
                  ` • expire le ${new Date(memory.expiresAt).toLocaleDateString("fr-FR")}`}
              </p>
            </Card>
          ))
        )}
      </div>

      <div className="px-6 pb-6">
        <Button variant="ghost" onClick={() => router.push("/settings")}>
          Retour aux réglages
        </Button>
      </div>
    </AppShell>
  );
}
