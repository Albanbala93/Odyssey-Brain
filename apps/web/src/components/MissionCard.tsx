import type { Mission } from "@/domain/types";
import { Button } from "@/components/ui/Button";

const TRANSLATION_MODE_LABEL: Record<string, string> = {
  always: "Traduction toujours visible",
  adaptive: "Traduction adaptative",
  on_demand: "Traduction à la demande",
};

/** `recommendation.reason` is a comma-joined lowercase explainability fragment (decision-engine.ts) — capitalize and punctuate it for display. */
function formatReason(reason: string): string {
  const trimmed = reason.replace(/,\s*$/, "");
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + ".";
}

export function MissionCard({
  mission,
  translationMode,
  onStart,
  isLoading,
  reason,
}: {
  mission: Mission;
  translationMode: string;
  onStart: () => void;
  isLoading?: boolean;
  reason?: string;
}) {
  return (
    <div className="border-accent-soft bg-accent-soft/60 rounded-3xl border p-5">
      <p className="text-muted text-xs font-semibold tracking-wide uppercase">Mission du jour</p>
      <h2 className="mt-2 text-xl font-bold">{mission.titleFr}</h2>
      <p className="text-muted mt-1 text-sm">{mission.descriptionFr}</p>
      <p className="text-muted mt-3 text-xs">
        {mission.estimatedMinutes} min • Voix ou texte • {TRANSLATION_MODE_LABEL[translationMode]}
      </p>
      {reason && <p className="text-muted mt-1 text-xs italic">{formatReason(reason)}</p>}
      <Button className="mt-4" onClick={onStart} disabled={isLoading}>
        {isLoading ? "Préparation…" : "Commencer"}
      </Button>
    </div>
  );
}
