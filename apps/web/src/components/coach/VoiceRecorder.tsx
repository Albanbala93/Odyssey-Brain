"use client";

import { clsx } from "clsx";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string; confidence: number } } };
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const withSpeech = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return withSpeech.SpeechRecognition ?? withSpeech.webkitSpeechRecognition ?? null;
}

function getMediaRecorderSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window.MediaRecorder !== "undefined"
  );
}

// Browser support never changes during a session, so there is nothing to
// subscribe to — this only exists to read the capability without causing an
// SSR/client hydration mismatch (server always renders the "unsupported"
// state; the client value applies from the first client render onward).
function subscribeToNothing() {
  return () => {};
}
function getWebSpeechSupportSnapshot(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}
function getMediaRecorderSupportSnapshot(): boolean {
  return getMediaRecorderSupport();
}
function getServerFalseSnapshot(): boolean {
  return false;
}

const MAX_RECORDING_MS = 30_000;

/**
 * Browser voice input (ODYSSEY_MASTER_PROMPT_CODEX.md §5.7). Preference
 * order per the brief's MVP path: record audio and transcribe it
 * server-side via OpenAI when configured; fall back to the browser's Web
 * Speech API where supported; the text field next to this component always
 * remains available regardless, so voice is never a hard requirement to
 * complete a mission.
 */
export function VoiceRecorder({
  onResult,
  disabled,
}: {
  onResult: (text: string, confidence?: number) => void;
  disabled?: boolean;
}) {
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const webSpeechSupported = useSyncExternalStore(
    subscribeToNothing,
    getWebSpeechSupportSnapshot,
    getServerFalseSnapshot,
  );
  const mediaRecorderSupported = useSyncExternalStore(
    subscribeToNothing,
    getMediaRecorderSupportSnapshot,
    getServerFalseSnapshot,
  );
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [status, setStatus] = useState("Appuie pour parler");
  const [usingServerRecording, setUsingServerRecording] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/voice/transcribe")
      .then((r) => r.json())
      .then((data: { available?: boolean }) => {
        if (!cancelled) setServerAvailable(Boolean(data.available));
      })
      .catch(() => {
        if (!cancelled) setServerAvailable(false);
      });

    return () => {
      cancelled = true;
      recognitionRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  function startWebSpeech() {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setStatus("La reconnaissance vocale n'est pas disponible. Utilise le champ texte.");
      return;
    }
    setUsingServerRecording(false);
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      setRecording(true);
      setStatus("Je t'écoute…");
    };
    recognition.onresult = (event) => {
      const alternative = event.results[0]?.[0];
      if (alternative?.transcript) onResult(alternative.transcript, alternative.confidence);
    };
    recognition.onerror = () => {
      setStatus("Je n'ai pas bien entendu. Réessaie ou écris ta réponse.");
    };
    recognition.onend = () => {
      setRecording(false);
      setStatus("Appuie pour parler");
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  async function transcribeOnServer(audio: Blob) {
    setTranscribing(true);
    setStatus("Transcription en cours…");
    try {
      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": audio.type || "audio/webm" },
        body: audio,
      });
      if (!response.ok) throw new Error(`transcribe responded with ${response.status}`);
      const data = (await response.json()) as { text?: string; confidence?: number };
      if (!data.text) throw new Error("empty transcription");
      onResult(data.text, data.confidence);
      setStatus("Appuie pour parler");
    } catch (error) {
      console.error("[VoiceRecorder] server transcription failed", error);
      setStatus("La transcription a échoué. Réessaie ou écris ta réponse.");
    } finally {
      setTranscribing(false);
    }
  }

  async function startServerRecording() {
    cancelledRef.current = false;
    setUsingServerRecording(true);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("Micro refusé ou indisponible. Réessaie ou écris ta réponse.");
      if (webSpeechSupported) startWebSpeech();
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setRecording(false);
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      if (cancelledRef.current) {
        setStatus("Appuie pour parler");
        return;
      }
      const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      void transcribeOnServer(audio);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setStatus("Je t'écoute…");
    stopTimerRef.current = setTimeout(() => stopRecording(), MAX_RECORDING_MS);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function cancelRecording() {
    cancelledRef.current = true;
    mediaRecorderRef.current?.stop();
  }

  function toggleListening() {
    if (recording) {
      if (usingServerRecording) stopRecording();
      else recognitionRef.current?.stop();
      return;
    }
    if (transcribing) return;
    if (serverAvailable && mediaRecorderSupported) {
      void startServerRecording();
    } else if (webSpeechSupported) {
      startWebSpeech();
    }
  }

  if (serverAvailable === null) {
    // Briefly loading the capability probe; avoid flashing an incorrect
    // "unsupported" message before we know which path is available.
    return null;
  }

  if (!mediaRecorderSupported && !webSpeechSupported) {
    return (
      <p className="text-muted text-center text-xs">
        La reconnaissance vocale n&apos;est pas prise en charge par ce navigateur. Utilise le champ
        texte ci-dessous.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled || transcribing}
        aria-pressed={recording}
        aria-label={recording ? "Arrêter l'écoute" : "Parler"}
        className={clsx(
          "bg-accent text-accent-foreground flex h-20 w-20 items-center justify-center rounded-full text-2xl shadow-lg transition-transform disabled:opacity-50",
          recording && "animate-pulse",
        )}
      >
        🎙️
      </button>
      <p className="text-muted min-h-[1.25rem] text-xs" role="status">
        {status}
      </p>
      {recording && usingServerRecording && (
        <button
          type="button"
          onClick={cancelRecording}
          className="text-muted text-xs underline underline-offset-2"
        >
          Annuler
        </button>
      )}
    </div>
  );
}
