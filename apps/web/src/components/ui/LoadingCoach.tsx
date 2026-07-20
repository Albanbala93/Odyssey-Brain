export function LoadingCoach({ label = "Alex réfléchit…" }: { label?: string }) {
  return (
    <div
      className="bg-accent-soft text-muted flex items-center gap-2 self-start rounded-2xl px-4 py-3 text-sm"
      role="status"
    >
      <span className="flex gap-1">
        <span className="bg-accent h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
        <span className="bg-accent h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
        <span className="bg-accent h-1.5 w-1.5 animate-bounce rounded-full" />
      </span>
      <span>{label}</span>
    </div>
  );
}
