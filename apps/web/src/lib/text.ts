export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
