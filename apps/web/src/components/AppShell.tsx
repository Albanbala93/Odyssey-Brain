import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col">{children}</div>;
}

export function Splash() {
  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-muted text-sm font-bold tracking-widest uppercase">Odyssey</p>
        <div
          className="border-accent-soft border-t-accent h-6 w-6 animate-spin rounded-full border-2"
          role="status"
          aria-label="Chargement"
        />
      </div>
    </AppShell>
  );
}
