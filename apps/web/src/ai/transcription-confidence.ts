/**
 * Whisper doesn't return a single confidence score. `avg_logprob` (natural
 * log of the average per-token probability for a segment) is the closest
 * proxy available in `verbose_json` — exponentiating it back to a
 * roughly-[0,1] scale and averaging across segments gives a reasonable
 * heuristic, not a calibrated probability.
 *
 * Deliberately separate from openai-transcription-provider.ts (which is
 * `server-only`, guarded because it makes the actual OpenAI request) so
 * this pure function can be unit tested directly.
 */
export function estimateConfidence(
  segments: { avg_logprob: number }[] | undefined,
): number | undefined {
  if (!segments || segments.length === 0) return undefined;
  const perSegment = segments.map((s) => Math.exp(s.avg_logprob));
  const mean = perSegment.reduce((sum, v) => sum + v, 0) / perSegment.length;
  return Math.min(1, Math.max(0, mean));
}
