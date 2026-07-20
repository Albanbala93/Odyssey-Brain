export function IntentCard({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border bg-surface hover:bg-accent-soft rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors"
    >
      {label}
    </button>
  );
}
