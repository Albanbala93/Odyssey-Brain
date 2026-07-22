import "server-only";
import { TranscriptionResponseSchema, type TranscriptionResponse } from "../schemas";
import { estimateConfidence } from "../transcription-confidence";

interface WhisperVerboseJsonResponse {
  text?: string;
  segments?: { avg_logprob: number }[];
}

/**
 * Server-only OpenAI Whisper transcription (Phase 4,
 * ODYSSEY_MASTER_PROMPT_CODEX.md §5.7). Never imported from client code —
 * the API key must never reach the browser bundle (AGENTS.md §3.1). Only
 * instantiated by the /api/voice/transcribe route when `OPENAI_API_KEY` is
 * set; the client falls back to the Web Speech API (or plain text)
 * otherwise, so voice input is never a hard requirement.
 */
export class OpenAiTranscriptionProvider {
  constructor(private readonly apiKey: string = process.env.OPENAI_API_KEY ?? "") {
    if (!this.apiKey) {
      throw new Error("OpenAiTranscriptionProvider requires OPENAI_API_KEY to be set");
    }
  }

  async transcribe(audio: Blob): Promise<TranscriptionResponse> {
    const form = new FormData();
    form.append("file", audio, "speech.webm");
    form.append("model", "whisper-1");
    form.append("language", "en");
    form.append("response_format", "verbose_json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `OpenAI transcription request failed with status ${response.status}: ${body.slice(0, 500)}`,
      );
    }

    const payload = (await response.json()) as WhisperVerboseJsonResponse;
    const text = payload.text?.trim();
    if (!text) {
      throw new Error("OpenAI transcription response did not contain text");
    }

    return TranscriptionResponseSchema.parse({
      text,
      confidence: estimateConfidence(payload.segments),
    });
  }
}
