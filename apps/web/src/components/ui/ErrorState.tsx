export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger-soft flex flex-col items-center gap-3 rounded-3xl border p-6 text-center"
    >
      <p className="text-danger text-sm font-medium">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-danger text-sm font-semibold underline underline-offset-2"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
