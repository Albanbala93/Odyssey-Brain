"use client";

import { useState } from "react";

export interface TranslationLayerProps {
  english: string;
  french: string;
  /** Initial visibility, decided by the translation policy (src/domain/translation-policy.ts). */
  defaultVisible: boolean;
  onToggle?: (visible: boolean) => void;
}

/**
 * Reusable translation display (ODYSSEY_MASTER_PROMPT_CODEX.md §5.6):
 * English is always visually primary, French is secondary and can be
 * toggled per message. The default visibility is decided once by the
 * caller via `shouldShowTranslation` when the message is created — this
 * component only owns the per-message toggle interaction afterwards. If a
 * caller needs to reset visibility for the same message, pass a new `key`
 * rather than relying on prop-driven resync.
 */
export function TranslationLayer({
  english,
  french,
  defaultVisible,
  onToggle,
}: TranslationLayerProps) {
  const [visible, setVisible] = useState(defaultVisible);

  function toggle() {
    const next = !visible;
    setVisible(next);
    onToggle?.(next);
  }

  return (
    <div>
      <p className="text-base leading-relaxed font-semibold">{english}</p>
      {visible && <p className="text-muted mt-1.5 text-sm leading-relaxed">{french}</p>}
      <button
        type="button"
        onClick={toggle}
        className="text-accent mt-2 text-xs font-semibold"
        aria-pressed={visible}
      >
        {visible ? "Masquer la traduction" : "Afficher la traduction"}
      </button>
    </div>
  );
}
