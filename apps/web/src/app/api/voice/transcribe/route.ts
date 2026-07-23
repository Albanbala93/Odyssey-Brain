import { NextResponse } from "next/server";
import { OpenAiTranscriptionProvider } from "@/ai/providers/openai-transcription-provider";
import { TranscriptionResponseSchema } from "@/ai/schemas";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Generous enough for a single spoken reply (well under a typical mission
// turn's length) while keeping the request body bounded.
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
// Lower than the coach route's limit — a spoken reply is naturally slower
// to produce than a typed one, so legitimate usage never comes close.
const MAX_REQUESTS_PER_MINUTE = 20;

/**
 * Server-side voice transcription (ODYSSEY_MASTER_PROMPT_CODEX.md §5.7).
 * This is the only place `OPENAI_API_KEY` is read for voice. The client
 * (VoiceRecorder.tsx) POSTs the recorded audio blob directly as the request
 * body and always has a fallback path (Web Speech API, then plain text) for
 * every response short of 200 — voice is never a hard requirement to
 * complete a mission.
 *
 * `GET` is a cheap capability probe so the client can choose server
 * transcription vs. the Web Speech API fallback *before* requesting
 * microphone access, rather than discovering "not configured" only after
 * already recording (which would mean prompting for the mic twice — once
 * per method). Reveals only a boolean, never the key itself.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ available: Boolean(process.env.OPENAI_API_KEY) });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Voice transcription is not configured" }, { status: 501 });
  }

  if (!checkRateLimit(getClientKey(request), MAX_REQUESTS_PER_MINUTE)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio too large" }, { status: 413 });
  }

  const contentType = request.headers.get("content-type") ?? "audio/webm";
  const audioBuffer = await request.arrayBuffer();
  if (audioBuffer.byteLength === 0) {
    return NextResponse.json({ error: "Empty audio" }, { status: 400 });
  }
  if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio too large" }, { status: 413 });
  }

  const audio = new Blob([audioBuffer], { type: contentType });

  try {
    const provider = new OpenAiTranscriptionProvider();
    const result = await provider.transcribe(audio);
    return NextResponse.json(TranscriptionResponseSchema.parse(result));
  } catch (error) {
    // Never expose internal error details to the client; log server-side
    // only. The client treats any non-200 as "fall back to the next
    // available input method" rather than a fatal error.
    console.error("[voice/transcribe] transcription failed", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
