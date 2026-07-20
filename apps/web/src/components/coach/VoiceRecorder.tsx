"use client";

import { clsx } from "clsx";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
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

// Browser support never changes during a session, so there is nothing to
// subscribe to — this only exists to read the capability without causing an
// SSR/client hydration mismatch (server always renders the "unsupported" state).
function subscribeToNothing() {
  return () => {};
}
function getSupportSnapshot(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}
function getServerSupportSnapshot(): boolean {
  return false;
}

/**
 * Browser-only voice input (ODYSSEY_MASTER_PROMPT_CODEX.md §5.7). Uses the
 * Web Speech API where available and degrades gracefully — text input
 * remains available everywhere, and microphone denial never blocks the
 * conversation.
 */
export function VoiceRecorder({
  onResult,
  disabled,
}: {
  onResult: (text: string) => void;
  disabled?: boolean;
}) {
  const supported = useSyncExternalStore(
    subscribeToNothing,
    getSupportSnapshot,
    getServerSupportSnapshot,
  );
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Appuie pour parler");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      setListening(true);
      setStatus("Je t'écoute…");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };
    recognition.onerror = () => {
      setStatus("Je n'ai pas bien entendu. Réessaie ou écris ta réponse.");
    };
    recognition.onend = () => {
      setListening(false);
      setStatus("Appuie pour parler");
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  if (!supported) {
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
        disabled={disabled}
        aria-pressed={listening}
        aria-label={listening ? "Arrêter l'écoute" : "Parler"}
        className={clsx(
          "bg-accent text-accent-foreground flex h-20 w-20 items-center justify-center rounded-full text-2xl shadow-lg transition-transform disabled:opacity-50",
          listening && "animate-pulse",
        )}
      >
        🎙️
      </button>
      <p className="text-muted min-h-[1.25rem] text-xs" role="status">
        {status}
      </p>
    </div>
  );
}
