"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/today", label: "Coach" },
  { href: "/progress", label: "Progrès" },
  { href: "/settings", label: "Profil" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="border-border bg-surface/95 sticky bottom-0 z-10 flex justify-around border-t px-2 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur"
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "rounded-xl px-4 py-1.5 text-xs font-semibold transition-colors",
              active ? "text-accent" : "text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
