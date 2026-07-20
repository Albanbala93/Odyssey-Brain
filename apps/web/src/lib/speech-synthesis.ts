/** Coach speech playback (ODYSSEY_MASTER_PROMPT_CODEX.md §5.7). No-ops when unsupported. */
export function speakEnglish(text: string, options: { slow?: boolean } = {}): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = options.slow ? 0.7 : 0.95;
  window.speechSynthesis.speak(utterance);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
