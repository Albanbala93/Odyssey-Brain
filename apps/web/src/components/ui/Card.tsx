import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("border-border bg-surface rounded-3xl border p-5 shadow-sm", className)}
      {...props}
    />
  );
}
