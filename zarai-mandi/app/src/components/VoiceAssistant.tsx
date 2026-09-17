import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";

export interface SpeakOptions {
  lang?: "ur-PK" | "en-US" | "ur" | "en";
  signal?: AbortSignal;
}

export interface VoiceAssistantProps {
  text?: string;
  urduText?: string;
  englishText?: string;
  currentLang?: "ur" | "en";
  className?: string;
  size?: number;
  color?: string;
}

const TTS_API_URL =
  (import.meta.env.VITE_TTS_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api/tts";

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let activeRequest: AbortController | null = null;

export function cleanSpokenText(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/[•★✓›‹→←▲▼🌾·]/g, " ").replace(/\s+/g, " ").trim();
}

function releaseActiveAudio(): void {
  activeRequest?.abort();
  activeRequest = null;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.removeAttribute("src");
    activeAudio.load();
    activeAudio = null;
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function stopUrduSpeech(): void {
  releaseActiveAudio();
}

function speakWithBrowser(text: string, lang: "ur-PK" | "en-US"): HTMLAudioElement {
  const placeholder = new Audio();
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    throw new Error("Speech synthesis is unavailable in this browser.");
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = lang === "ur-PK" ? 0.9 : 0.95;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (voice) utterance.voice = voice;
  utterance.onend = () => placeholder.dispatchEvent(new Event("ended"));
  utterance.onerror = () => placeholder.dispatchEvent(new Event("error"));
  window.speechSynthesis.speak(utterance);
  return placeholder;
}

/** Uses the backend's facebook/mms-tts-urd model and keeps the existing API. */
export async function speakUrdu(text: string, options: SpeakOptions = {}): Promise<HTMLAudioElement> {
  releaseActiveAudio();
  const cleaned = cleanSpokenText(text);
  if (!cleaned) throw new Error("There is no text to speak.");

  const isUrdu = options.lang !== "en" && options.lang !== "en-US";
  if (!isUrdu) return speakWithBrowser(cleaned, "en-US");

  const controller = new AbortController();
  activeRequest = controller;
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(TTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaned, language: "ur" }),
      signal: controller.signal,
    });
    activeRequest = null;
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `Urdu TTS failed (${response.status}).`);
    }

    const blob = await response.blob();
    if (!blob.size) throw new Error("The TTS server returned empty audio.");
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    audio.preload = "auto";
    activeAudio = audio;
    activeObjectUrl = objectUrl;

    const cleanup = () => {
      if (activeAudio === audio) activeAudio = null;
      if (activeObjectUrl === objectUrl) activeObjectUrl = null;
      URL.revokeObjectURL(objectUrl);
    };
    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });
    await audio.play();
    return audio;
  } catch (err) {
    activeRequest = null;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    console.warn("Urdu TTS backend unreachable or error, falling back to browser synthesis:", err);
    return speakWithBrowser(cleaned, "ur-PK");
  }
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  text, urduText, englishText, currentLang = "ur", className = "", size = 18, color = "#166534",
}) => {
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const handleSpeak = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isPlaying) {
      stopUrduSpeech();
      setIsPlaying(false);
      return;
    }
    const value = currentLang === "ur" ? urduText || text : englishText || text;
    if (!value?.trim()) return;

    setLoading(true);
    try {
      const audio = await speakUrdu(value, { lang: currentLang === "ur" ? "ur-PK" : "en-US" });
      if (!mounted.current) return;
      setIsPlaying(true);
      const finish = () => mounted.current && setIsPlaying(false);
      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) console.warn("TTS error:", error);
      if (mounted.current) setIsPlaying(false);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [currentLang, englishText, isPlaying, text, urduText]);

  const label = currentLang === "ur"
    ? (isPlaying ? "آواز بند کریں" : "آواز سنیں")
    : (isPlaying ? "Stop audio" : "Listen to audio");

  return (
    <button type="button" onClick={handleSpeak} disabled={loading} aria-label={label} title={label}
      className={`tap-target inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${className}`}
      style={{ background: isPlaying ? "#DCFCE7" : "rgba(240, 253, 244, 0.9)", border: `1px solid ${isPlaying ? "#16A34A" : "#D5E2DD"}`, cursor: loading ? "wait" : "pointer" }}>
      {loading ? <Loader2 size={size} className="animate-spin" color={color} />
        : isPlaying ? <VolumeX size={size} color="#166534" />
        : <Volume2 size={size} color={color} />}
    </button>
  );
};

// CustomerFaceApp.tsx currently imports this name.
export const VoiceButton = VoiceAssistant;
export default VoiceAssistant;
