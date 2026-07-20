export function ProgressIndicator({ value, label }: { value: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="bg-accent-soft h-2 w-full overflow-hidden rounded-full"
    >
      <span
        className="bg-accent block h-full rounded-full transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
