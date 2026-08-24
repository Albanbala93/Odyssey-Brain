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

// trend (capability.ts, updateCapabilityProgress) was computed after every
// attempt but never shown anywhere — this is the one place a learner could
// see "am I getting better at this specific thing" rather than only a
// point-in-time score.
const TREND_ICON: Record<CapabilityProgress["trend"], string> = {
  up: "↗",
  down: "↘",
  flat: "→",
};
const TREND_LABEL_FR: Record<CapabilityProgress["trend"], string> = {
  up: "en progression",
  down: "en baisse",
  flat: "stable",
};

export function CapabilityCard({
  labelFr,
  progress,
}: {
  labelFr: string;
  progress: CapabilityProgress;
}) {
  // A trend after a single attempt is trivially "up" (comparing against a
  // score of 0) and not a meaningful signal yet.
  const showTrend = progress.attemptCount >= 2;

  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{labelFr}</h3>
        <span className="text-muted flex items-center gap-1 text-xs font-medium">
          {STATUS_LABEL_FR[progress.status]}
          {showTrend && (
            <span
              aria-label={TREND_LABEL_FR[progress.trend]}
              title={TREND_LABEL_FR[progress.trend]}
            >
              {TREND_ICON[progress.trend]}
            </span>
          )}
        </span>
      </div>
      <div className="mt-2">
        <ProgressIndicator value={progress.demonstratedScore} label={labelFr} />
      </div>
    </div>
  );
}
