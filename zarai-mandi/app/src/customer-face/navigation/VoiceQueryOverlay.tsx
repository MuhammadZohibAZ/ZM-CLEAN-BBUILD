import { useState, useRef, useEffect } from "react";

import { MicSVG } from "../components/icons";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type Screen } from "../shared/types";
import { speakText } from "../shared/voice";

export function VoiceWaveform({
  color = "#2FAE68",
  count = 10,
}: {
  color?: string;
  count?: number;
}) {
  const hs = [4, 7, 5, 10, 6, 9, 4, 8, 5, 7];
  return (
    <div className="flex gap-[3px] items-end" style={{ height: 32 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-full animate-pulse"
          style={{
            width: 4,
            height: (hs[i % hs.length] ?? 6) * 2.8,
            background: color,
            animationDelay: `${i * 0.07}s`,
            animationDuration: "0.75s",
          }}
        />
      ))}
    </div>
  );
}

// Voice listening / processing / speaking overlay
export function VoiceQueryOverlay({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (s: Screen) => void;
}) {
  const { lang, t } = useLang();
  const [phase, setPhase] = useState<"listening" | "processing" | "speaking">(
    "listening",
  );
  const [transcript, setTranscript] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearT = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    // Speak initial listening cue
    if (lang === "ur") {
      speakText("فرمائیے، میں سن رہا ہوں");
    }

    // Simulate: after 2.5s user finishes speaking
    timerRef.current = setTimeout(() => {
      const userSpoken =
        lang === "ur"
          ? "پاکپتن منڈی میں گندم کا مل ریٹ"
          : "Wheat in Pakpattan Mandi, Mill Rate";
      setTranscript(userSpoken);
      setPhase("processing");

      timerRef.current = setTimeout(() => {
        setPhase("speaking");
        if (lang === "ur") {
          speakText("پاکپتن منڈی میں گندم کا مل ریٹ ۲۸۵۰ روپے ہے۔");
        } else {
          speakText("Wheat Mill Rate in Pakpattan Mandi is 2850 rupees.");
        }

        timerRef.current = setTimeout(() => {
          onClose();
          onNavigate({
            id: "product-rates",
            vertical: "Grains",
            product: "Wheat",
            byproduct: "Wheat",
            initialRateType: "Mill Rate",
            initialMandi: "Pakpattan Mandi",
            initialVariety: "Sona Moti",
            initialNewOld: "New",
            initialColor: "Golden",
            initialSpec: "Seed Quality",
            initialCondition: "Dry",
          });
        }, 2200);
      }, 1400);
    }, 2500);
    return clearT;
  }, [lang]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      dir={lang === "ur" ? "rtl" : "ltr"}
      style={{
        background: "rgba(5,25,15,0.82)",
        zIndex: 500,
        backdropFilter: "blur(4px)",
        fontFamily:
          lang === "ur"
            ? URDU_FONT
            : "'Inter', sans-serif",
      }}
    >
      <button
        onClick={() => {
          clearT();
          window.speechSynthesis?.cancel();
          onClose();
        }}
        className="absolute flex items-center justify-center rounded-full text-white font-bold"
        style={{
          top: 52,
          [lang === "ur" ? "left" : "right"]: 16,
          width: 32,
          height: 32,
          background: "rgba(255,255,255,0.18)",
          fontSize: 16,
        }}
      >
        ✕
      </button>

      {phase === "listening" && (
        <div className="flex flex-col items-center gap-5 px-8">
          {/* Pulsing mic ring */}
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg,#C94A43,#D95A51)",
              boxShadow:
                "0 0 0 14px rgba(220,38,38,0.18),0 0 0 28px rgba(220,38,38,0.08)",
              animation: "pulse 1.2s ease-in-out infinite",
            }}
          >
            <MicSVG size={32} color="#fff" />
          </div>
          <VoiceWaveform color="#2FAE68" count={12} />
          <p className="font-bold text-white text-xl">
            {lang === "ur" ? "سن رہے ہیں…" : "Listening…"}
          </p>
          <p
            className="text-sm text-center"
            style={{ color: "rgba(255,255,255,0.7)", maxWidth: 260 }}
          >
            {lang === "ur"
              ? 'مثال کے طور پر کہیں: "پاکپتن منڈی میں گندم، مل ریٹ"'
              : 'Say something like: "Wheat in Pakpattan Mandi, Mill Rate"'}
          </p>
        </div>
      )}

      {phase === "processing" && (
        <div className="flex flex-col items-center gap-5 px-8">
          <div className="w-12 h-12 rounded-full border-4 border-green-300 border-t-transparent animate-spin" />
          <p className="font-bold text-white text-xl">
            {lang === "ur" ? "سمجھ رہے ہیں…" : "Understanding…"}
          </p>
          {transcript && (
            <div
              className="rounded-xl px-4 py-3 text-center text-sm"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#D5E2DD",
                maxWidth: 280,
              }}
            >
              "{transcript}"
            </div>
          )}
        </div>
      )}

      {phase === "speaking" && (
        <div className="flex flex-col items-center gap-5 px-8">
          <VoiceWaveform color="#2FAE68" count={10} />
          <div
            className="rounded-2xl px-6 py-5 text-center"
            style={{
              background: "rgba(255,255,255,0.97)",
              border: "2px solid #087F63",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              maxWidth: 320,
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div
                className="rounded-full flex items-center justify-center"
                style={{ width: 28, height: 28, background: "#087F63" }}
              >
                <MicSVG size={14} color="#fff" />
              </div>
              <span className="text-xs font-bold" style={{ color: "#087F63" }}>
                {lang === "ur" ? "آواز کا اسسٹنٹ" : "Voice Assistant"}
              </span>
            </div>
            <p className="font-semibold text-base" style={{ color: "#16352F" }}>
              {lang === "ur"
                ? "آپ کا مطلوبہ ریٹ تلاش کر لیا گیا ہے۔"
                : "Let me bring you the data."}
            </p>
            <p className="text-sm mt-1 font-bold" style={{ color: "#087F63" }}>
              {lang === "ur"
                ? "گندم · پاکپتن منڈی · مل ریٹ"
                : "Wheat · Pakpattan Mandi · Mill Rate"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
