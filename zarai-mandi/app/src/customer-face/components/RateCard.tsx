import React from "react";

import { ProductIcon } from "./ProductIcon";
import { VERTICALS } from "../shared/data/catalog";
import { toUrduDigits, URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { AUTO_URDU_DICT } from "../shared/i18n/urduDictionary";
import { type RichRow } from "../shared/types";
import { speakText } from "../shared/voice";

export function getRateTypeIcon(rateType: string) {
  const norm = (rateType || "").toLowerCase();
  if (norm.includes("mill") || norm.includes("مل")) {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="12" width="4" height="9" rx="1" />
        <rect x="10" y="6" width="4" height="15" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
      </svg>
    );
  }
  if (norm.includes("broker") || norm.includes("بیوپار") || norm.includes("بروکر")) {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  if (norm.includes("stock") || norm.includes("اسٹاک") || norm.includes("ذخیرہ")) {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    );
  }
  if (norm.includes("wholesale") || norm.includes("ہول سیل") || norm.includes("تھوک")) {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export function RateCard({
  r,
  onClick,
  onPriceChipTap,
  onMandiChipTap,
  dateText,
  isToday = true,
  isFavorite = false,
  onToggleFavorite,
  provinceBg,
}: {
  r: RichRow;
  onClick: () => void;
  onPriceChipTap?: (rateType: string) => void;
  onMandiChipTap?: (mandiName: string) => void;
  dateText?: string;
  isToday?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  provinceBg?: string;
}) {
  const { lang, tc: tcL, tm: tmL, tr: trL } = useLang();
  const vKey =
    r.vertical ||
    Object.entries(VERTICALS).find(([, vd]) => vd.products[r.product])?.[0] ||
    "Grains";

  // Audio speech prompt on card
  const handleSpeakRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const bp = tcL(r.byproduct || r.product);
    const m = tmL(r.mandiName);
    const speech =
      lang === "ur"
        ? `${bp}، ${m}۔ قیمت کم سے کم ${r.min.toLocaleString()}، زیادہ سے زیادہ ${r.max.toLocaleString()} روپے۔`
        : `${r.byproduct || r.product}, ${r.mandiName}. Min rate ${r.min.toLocaleString()}, Max rate ${r.max.toLocaleString()} rupees.`;
    speakText(speech);
  };

  // Strip 'Mandi' / 'منڈی' from city name for clean single line
  const rawMandi = tmL(r.mandiCity || r.mandiName || "");
  const strippedCity = rawMandi
    .replace(/\s*mandi\s*/gi, "")
    .replace(/\s*grain market\s*/gi, "")
    .replace(/\s*منڈی\s*/g, "")
    .trim() || rawMandi;
  const cleanCity = lang === "ur" ? (AUTO_URDU_DICT[strippedCity] || strippedCity) : strippedCity;
  const cleanBP = tcL(r.byproduct || r.product);
  const singleLineTitle = `${cleanBP} - ${cleanCity}`;

  const rateTypeFormatted = trL(r.rateType).replace(" ریٹ", "").replace(" Rate", "") + (lang === "ur" ? " ریٹ" : " Rate");

  const displayPct = Math.abs(r.trendPct || 1.8).toFixed(1);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="card-mobile-interactive tap-target zm-beam-border zm-beam-border-card w-full rounded-2xl cursor-pointer flex flex-col justify-between transition-transform duration-150 active:scale-[0.98] relative overflow-hidden"
      style={{
        background: provinceBg ? "rgba(255, 255, 255, 0.88)" : "rgba(255, 255, 255, 0.22)",
        backdropFilter: provinceBg ? "blur(8px)" : "blur(4px)",
        WebkitBackdropFilter: provinceBg ? "blur(8px)" : "blur(4px)",
        border: provinceBg
          ? "1.5px solid rgba(255, 255, 255, 0.9)"
          : "1.8px solid rgba(8, 127, 99, 0.40)",
        boxShadow: provinceBg
          ? "0 4px 18px rgba(0,0,0,0.06)"
          : "0 8px 24px rgba(6, 77, 64, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.85)",
        padding: "12px 10px 10px",
        minHeight: 254,
      }}
    >
      {/* Province Background Motif (All Pakistan Mode - Specific Card Design) */}
      {provinceBg && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
          style={{
            zIndex: 0,
            backgroundImage: `url(${provinceBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.65,
          }}
        />
      )}

      {/* Top Row: Favorite Heart Button on Right */}
      <div className="flex items-center justify-end w-full relative z-1">

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className="tap-target zm-beam-border zm-beam-border-pink w-7 h-7 flex items-center justify-center rounded-full transition active:scale-90 text-[#183B34]"
          title={
            isFavorite
              ? lang === "ur"
                ? "پسندیدہ سے ہٹائیں"
                : "Remove from favorites"
              : lang === "ur"
                ? "پسندیدہ میں شامل کریں"
                : "Add to favorites"
          }
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill={isFavorite ? "#E11D48" : "none"}
            stroke={isFavorite ? "#E11D48" : "#183B34"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Center: 3D Product Icon & Titles */}
      <div className="flex flex-col items-center justify-center my-1 relative z-1">
        <div className="flex items-center justify-center py-0.5">
          <ProductIcon
            name={r.byproduct || vKey}
            vertical={vKey}
            size={74}
          />
        </div>

        {/* Title: Mandi name with By-product name in bold */}
        <p
          className="font-extrabold text-center mt-1 px-0.5 truncate w-full text-sm text-[#183B34]"
          style={{
            fontFamily:
              lang === "ur"
                ? URDU_FONT
                : "'Poppins', sans-serif",
          }}
          title={singleLineTitle}
        >
          {singleLineTitle}
        </p>
      </div>

      {/* Prices: Clean Side-by-Side with Price on Top (in 1 line) and Min/Max Label Below */}
      <div
        className="flex items-center justify-between px-2 py-1 rounded-xl my-1 w-full relative z-1"
        style={{
          background: provinceBg ? "rgba(255, 255, 255, 0.90)" : "rgba(255, 255, 255, 0.40)",
          border: provinceBg ? "1px solid rgba(229, 235, 232, 0.8)" : "1px solid rgba(255, 255, 255, 0.60)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        {/* Min */}
        <div className="flex flex-col items-start flex-1 min-w-0 pr-0.5">
          <span
            className="font-extrabold text-[#183B34] tracking-tight leading-none break-words w-full"
            style={{
              fontSize: lang === "ur" ? 11 : 13,
              fontFamily:
                lang === "ur"
                  ? URDU_FONT
                  : "'Poppins', sans-serif",
            }}
          >
            {lang === "ur"
              ? `${toUrduDigits(r.min.toLocaleString("en-PK"))} روپے`
              : `Rs. ${r.min.toLocaleString("en-PK")}`}
          </span>
          <span
            className="font-semibold tracking-tight text-[#80918B] mt-0.5 whitespace-nowrap truncate w-full"
            style={{
              fontSize: lang === "ur" ? 8 : 9.5,
              fontFamily:
                lang === "ur"
                  ? URDU_FONT
                  : "inherit",
            }}
          >
            {lang === "ur" ? "کم قیمت (۴۰ کلو)" : "Min (40 KG)"}
          </span>
        </div>

        <div className="w-[1px] h-5 bg-[#D5E2DD] mx-1 flex-shrink-0" />

        {/* Max */}
        <div className="flex flex-col items-start flex-1 min-w-0 pl-0.5">
          <span
            className="font-extrabold text-[#183B34] tracking-tight leading-none break-words w-full"
            style={{
              fontSize: lang === "ur" ? 11 : 13,
              fontFamily:
                lang === "ur"
                  ? URDU_FONT
                  : "'Poppins', sans-serif",
            }}
          >
            {lang === "ur"
              ? `${toUrduDigits(r.max.toLocaleString("en-PK"))} روپے`
              : `Rs. ${r.max.toLocaleString("en-PK")}`}
          </span>
          <span
            className="font-semibold tracking-tight text-[#80918B] mt-0.5 whitespace-nowrap truncate w-full"
            style={{
              fontSize: lang === "ur" ? 8 : 9.5,
              fontFamily:
                lang === "ur"
                  ? URDU_FONT
                  : "inherit",
            }}
          >
            {lang === "ur" ? "زیادہ قیمت (۴۰ کلو)" : "Max (40 KG)"}
          </span>
        </div>
      </div>

      {/* Bottom Action Row: Vector Icon Pill on Left + Speaker Button on Right */}
      <div className="flex items-center gap-1.5 w-full pt-1 relative z-1">
        {/* Rate Type Action Pill */}
        <div
          className="flex-1 flex items-center justify-between rounded-xl py-1.5 px-2.5 min-w-0 shadow-sm"
          style={{
            background: provinceBg ? "#EAF8F2" : "rgba(255, 255, 255, 0.45)",
            border: provinceBg ? "1px solid #C7E8D8" : "1px solid rgba(255, 255, 255, 0.65)",
            color: "#0F8A5F",
          }}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="flex-shrink-0 text-[#0F8A5F]">
              {getRateTypeIcon(r.rateType)}
            </span>
            <span className="text-xs font-bold truncate text-[#0F8A5F]">
              {rateTypeFormatted}
            </span>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 opacity-70 ml-1"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* Speaker Audio Button */}
        <button
          type="button"
          onClick={handleSpeakRate}
          className="tap-target zm-beam-border flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90 shadow-sm hover:scale-105"
          style={{
            background: provinceBg ? "#EAF8F2" : "rgba(255, 255, 255, 0.45)",
            border: provinceBg ? "1px solid #C7E8D8" : "1px solid rgba(255, 255, 255, 0.65)",
            color: "#0F8A5F",
          }}
          title={lang === "ur" ? "ریٹ سنیں (آواز)" : "Listen to rate"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        </button>
      </div>
    </div>
  );
}
