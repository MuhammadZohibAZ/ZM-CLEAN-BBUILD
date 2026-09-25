import { useState, useRef } from "react";

import { ZMMessageCard } from "../components/ZMMessage";
import { FEED_MESSAGES } from "../shared/data/mandis";

// ─── VOICE ────────────────────────────────────────────────────────────────────

export function VoiceScreen({
  onResult,
}: {
  onResult: (v: string, c: string) => void;
}) {
  const [phase, setPhase] = useState<
    "idle" | "recording" | "processing" | "result"
  >("idle");
  const [transcript, setTranscript] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => {
    if (phase === "recording") return;
    setPhase("recording");
    setTranscript("");
    timer.current = setTimeout(
      () => setTranscript("آج گندم کا ملتان میں ریٹ کیا ہے؟"),
      1000,
    );
  };
  const stop = () => {
    if (phase !== "recording") return;
    if (timer.current) clearTimeout(timer.current);
    setTranscript("آج گندم کا ملتان میں ریٹ کیا ہے؟");
    setPhase("processing");
    setTimeout(() => setPhase("result"), 1200);
  };

  return (
    <div
      className="flex flex-col h-full screen-enter items-center pt-16 px-6"
      style={{ background: "#F1F7F4" }}
    >
      <h1 className="font-extrabold text-2xl mb-1 text-center">Voice Search</h1>
      <p className="text-sm text-center mb-8" style={{ color: "#52635F" }}>
        Press &amp; hold · Urdu or English
      </p>
      <button
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        className="tap-target flex items-center justify-center rounded-full mb-6 select-none"
        style={{
          width: 112,
          height: 112,
          touchAction: "none",
          background: phase === "recording" ? "#C94A43" : "#087F63",
          boxShadow:
            phase === "recording"
              ? "0 0 0 20px rgba(220,38,38,0.15),0 0 0 40px rgba(220,38,38,0.07)"
              : "0 8px 32px rgba(15,138,95,0.35)",
          transition: "all 0.2s ease",
        }}
      >
        <span style={{ fontSize: 48 }}>🎙️</span>
      </button>
      {phase === "idle" && (
        <p className="text-sm text-center" style={{ color: "#52635F" }}>
          Hold mic and speak
        </p>
      )}
      {phase === "recording" && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1 items-end h-8">
            {[4, 7, 5, 10, 6, 8, 4, 9, 5, 7].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full animate-pulse"
                style={{
                  height: h * 3,
                  background: "#C94A43",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
          <p className="font-semibold text-red-600">Listening…</p>
          {transcript && (
            <p className="urdu text-lg font-bold text-center mt-2">
              {transcript}
            </p>
          )}
        </div>
      )}
      {phase === "processing" && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
          <p className="font-semibold" style={{ color: "#087F63" }}>
            Processing…
          </p>
        </div>
      )}
      {phase === "result" && (
        <div className="w-full screen-enter flex flex-col gap-4">
          <p className="urdu text-lg font-bold text-center">{transcript}</p>
          <ZMMessageCard msg={FEED_MESSAGES[0]} />
          <button
            onClick={() => onResult("Grains", "Wheat")}
            className="tap-target w-full rounded-2xl py-4 font-bold text-white text-base"
            style={{ background: "#087F63" }}
          >
            See All Mandi Rates for Wheat →
          </button>
          <button
            onClick={() => {
              setPhase("idle");
              setTranscript("");
            }}
            className="tap-target w-full rounded-2xl py-4 font-bold text-base"
            style={{ background: "#E8EFEC", color: "#183B34" }}
          >
            Search Again
          </button>
        </div>
      )}
    </div>
  );
}
