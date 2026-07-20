import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border flex flex-col items-center gap-3 rounded-3xl border border-dashed p-8 text-center">
      <p className="text-foreground text-base font-semibold">{title}</p>
      {description && <p className="text-muted text-sm">{description}</p>}
      {action}
    </div>
  );
}
