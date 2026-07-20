import { TranslationLayer } from "./TranslationLayer";

export function CoachMessage({
  english,
  french,
  showTranslation,
  onToggleTranslation,
  source,
}: {
  english: string;
  french: string;
  showTranslation: boolean;
  onToggleTranslation?: (visible: boolean) => void;
  source?: "openai" | "local_fallback";
}) {
  return (
    <div className="bg-accent-soft max-w-[88%] self-start rounded-2xl rounded-bl-sm px-4 py-3">
      {source === "local_fallback" && (
        <p className="text-muted mb-1.5 text-[10px] font-semibold tracking-wide uppercase">
          Mode hors ligne
        </p>
      )}
      <TranslationLayer
        english={english}
        french={french}
        defaultVisible={showTranslation}
        onToggle={onToggleTranslation}
      />
    </div>
  );
}
