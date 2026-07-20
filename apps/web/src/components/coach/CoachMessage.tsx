import { TranslationLayer } from "./TranslationLayer";

export function CoachMessage({
  english,
  french,
  showTranslation,
  onToggleTranslation,
}: {
  english: string;
  french: string;
  showTranslation: boolean;
  onToggleTranslation?: (visible: boolean) => void;
}) {
  return (
    <div className="bg-accent-soft max-w-[88%] self-start rounded-2xl rounded-bl-sm px-4 py-3">
      <TranslationLayer
        english={english}
        french={french}
        defaultVisible={showTranslation}
        onToggle={onToggleTranslation}
      />
    </div>
  );
}
