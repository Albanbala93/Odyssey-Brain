import { ProgressIndicator } from "@/components/ui/ProgressIndicator";
import type { CapabilityProgress } from "@/domain/types";

const STATUS_LABEL_FR: Record<CapabilityProgress["status"], string> = {
  not_explored: "Non explorée",
  discovered: "Découverte",
  in_progress: "En cours d'acquisition",
  functional: "Fonctionnelle",
  solid: "Solide",
  spontaneous: "Spontanée",
};

export function CapabilityCard({
  labelFr,
  progress,
}: {
  labelFr: string;
  progress: CapabilityProgress;
}) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{labelFr}</h3>
        <span className="text-muted text-xs font-medium">{STATUS_LABEL_FR[progress.status]}</span>
      </div>
      <div className="mt-2">
        <ProgressIndicator value={progress.demonstratedScore} label={labelFr} />
      </div>
    </div>
  );
}
