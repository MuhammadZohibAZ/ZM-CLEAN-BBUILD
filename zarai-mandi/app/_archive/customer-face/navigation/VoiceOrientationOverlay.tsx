import React, { useState } from "react";

import { MicSVG } from "../components/icons";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { speakText } from "../shared/voice";

// Orientation overlay — dims home screen, shows tooltip cards anchored near each button.
// z-[45] keeps it BELOW the nav bar (z-50) so the user can always use nav or hold the mic.
// backdrop is pointer-events:none so tapping underlying buttons still works;
// individual cards are pointer-events:auto.

export const ORIENT_CARDS = [
  {
    key: "search",
    label: "Search",
    labelUr: "تلاش",
    desc: "Type in your byproduct to see its detail",
    descUr: "کسی بھی جنس یا ضمنی مصنوع کا نام بول کر یا لکھ کر ریٹ دیکھیں",
    pos: { top: 218, left: 16, right: 16 } as React.CSSProperties,
  },
  {
    key: "product",
    label: "Product",
    labelUr: "مصنوعات",
    desc: "Discover your bought product prices",
    descUr: "اپنی فصل منتخب کریں اور تمام ضمنی مصنوعات کے ریٹ معلوم کریں",
    pos: { top: 316, left: 18, width: 186 } as React.CSSProperties,
  },
  {
    key: "livemarket",
    label: "Live Market",
    labelUr: "لائیو مارکیٹ",
    desc: "Discover live market interaction",
    descUr: "پاکستان بھر کی فعال منڈیوں کے تازہ ترین براہ راست ریٹس",
    pos: { top: 240, right: 18, width: 138 } as React.CSSProperties,
  },
  {
    key: "mandi",
    label: "Mandi",
    labelUr: "منڈیاں",
    desc: "See what is available in the mandis",
    descUr: "پاکستان کی تمام منڈیاں دیکھیں اور آج کے تازہ ریٹس جانیں",
    pos: { top: 330, right: 18, width: 138 } as React.CSSProperties,
  },
  {
    key: "yourpicks",
    label: "Your Picks",
    labelUr: "پسندیدہ",
    desc: "Your favourites are shown here",
    descUr: "آپ کے منتخب کردہ پسندیدہ آئٹمز کے ریٹس یہاں ملیں گے",
    pos: { top: 418, left: 16, right: 16 } as React.CSSProperties,
  },
];

export function VoiceOrientationOverlay({ onClose }: { onClose: () => void }) {
  const { lang, t } = useLang();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const handleCardTap = (
    key: string,
    labelEn: string,
    labelUr: string,
    descEn: string,
    descUr: string,
  ) => {
    const next = activeCard === key ? null : key;
    setActiveCard(next);
    if (next) {
      if (lang === "ur") {
        speakText(`${labelUr}۔ ${descUr}`);
      } else {
        speakText(`${labelEn}. ${descEn}`);
      }
    } else {
      window.speechSynthesis?.cancel();
    }
  };

  return (
    // pointer-events:none on backdrop so home-screen buttons remain tappable
    <div
      className="absolute inset-0"
      dir={lang === "ur" ? "rtl" : "ltr"}
      style={{
        background: "rgba(5,25,15,0.55)",
        zIndex: 45,
        pointerEvents: "none",
        fontFamily:
          lang === "ur"
            ? URDU_FONT
            : "'Inter', sans-serif",
      }}
    >
      {/* Close pill — pointer-events:auto */}
      <button
        onClick={onClose}
        className="absolute flex items-center justify-center rounded-full text-white font-bold"
        style={{
          top: 48,
          [lang === "ur" ? "right" : "left"]: 16,
          height: 32,
          paddingLeft: 14,
          paddingRight: 14,
          background: "rgba(255,255,255,0.22)",
          fontSize: 12,
          letterSpacing: "0.02em",
          pointerEvents: "auto",
          zIndex: 46,
          border: "1px solid rgba(255,255,255,0.3)",
          backdropFilter: "blur(6px)",
        }}
      >
        {lang === "ur" ? "✕ رہنمائی بند کریں" : "✕ Close guide"}
      </button>

      {/* Tap-to-hear hint pill */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
        style={{
          top: 48,
          pointerEvents: "none",
          width: "max-content",
          maxWidth: "90%",
        }}
      >
        <span
          className="text-[11px] font-semibold px-3.5 py-1.5 rounded-full text-center"
          style={{
            background: "rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(255,255,255,0.25)",
            backdropFilter: "blur(6px)",
          }}
        >
          {lang === "ur"
            ? "سننے کے لیے کارڈ دبائیں · بولنے کے لیے مائیک دبا کر رکھیں"
            : "Tap a card to hear it · Hold mic to speak"}
        </span>
      </div>

      {/* Tooltip cards — individually pointer-events:auto, positioned near their button */}
      {ORIENT_CARDS.map((card) => {
        const isActive = activeCard === card.key;
        const titleText = lang === "ur" ? card.labelUr : card.label;
        const descText = lang === "ur" ? card.descUr : card.desc;

        return (
          <button
            key={card.key}
            onClick={() =>
              handleCardTap(
                card.key,
                card.label,
                card.labelUr,
                card.desc,
                card.descUr,
              )
            }
            className={`absolute flex items-center gap-2 rounded-xl ${lang === "ur" ? "text-right" : "text-left"}`}
            style={{
              ...card.pos,
              pointerEvents: "auto",
              background: isActive ? "#087F63" : "rgba(255,255,255,0.96)",
              borderLeft:
                lang === "ur"
                  ? undefined
                  : `3.5px solid ${isActive ? "#2FAE68" : "#087F63"}`,
              borderRight:
                lang === "ur"
                  ? `3.5px solid ${isActive ? "#2FAE68" : "#087F63"}`
                  : undefined,
              boxShadow: isActive
                ? "0 4px 18px rgba(15,138,95,0.55)"
                : "0 2px 12px rgba(0,0,0,0.22)",
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 10,
              paddingRight: 10,
              transition: "all 0.15s ease",
              zIndex: 46,
            }}
          >
            {/* Speaker icon */}
            <div
              className="flex-shrink-0 rounded-full flex items-center justify-center"
              style={{
                width: 26,
                height: 26,
                background: isActive ? "rgba(255,255,255,0.22)" : "#E4F2EC",
                flexShrink: 0,
              }}
            >
              <MicSVG size={13} color={isActive ? "#fff" : "#087F63"} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-bold text-[12px] leading-tight"
                style={{
                  color: isActive ? "#fff" : "#16352F",
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "'Poppins', sans-serif",
                }}
              >
                {titleText}
              </p>
              <p
                className="text-[11px] leading-tight mt-0.5"
                style={{
                  color: isActive ? "rgba(255,255,255,0.85)" : "#52635F",
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "'Inter', sans-serif",
                }}
              >
                {descText}
              </p>
            </div>
            {isActive && (
              <span style={{ fontSize: 13, flexShrink: 0 }}>🔊</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
