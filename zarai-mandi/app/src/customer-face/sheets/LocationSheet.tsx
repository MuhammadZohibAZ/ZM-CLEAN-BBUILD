import { useState } from "react";

import { LOCATIONS, PROVINCE_CARD_BG } from "../shared/data/mandis";
import { appLang } from "../shared/i18n/LangProvider";
import { AUTO_URDU_DICT } from "../shared/i18n/urduDictionary";
import { speakText } from "../shared/voice";

export function LocationSheet({
  onSelect,
  onClose,
  districtOnly = false,
}: {
  onSelect: (p: string, d?: string, s?: string) => void;
  onClose: () => void;
  districtOnly?: boolean;
}) {
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  return (
    <div className="zm-sheet-overlay" style={{ zIndex: 200 }} onClick={onClose}>
      <div
        className="zm-sheet"
        style={{ background: "#F4FAF7", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-[#DCE8E3]">
          {(province || district) && (
            <button
              className="tap-target text-xl w-8"
              onClick={() => {
                if (district) setDistrict(null);
                else setProvince(null);
              }}
            >
              ←
            </button>
          )}
          <p className="font-bold text-base">
            {!province
              ? "Province"
              : !district
                ? province
                : `${province} › ${district}`}
          </p>
        </div>
        <div
          className="overflow-y-auto p-4 flex flex-col gap-2"
          style={{ maxHeight: "calc(80vh - 64px)" }}
        >
          {!province &&
            Object.keys(LOCATIONS).map((p) => {
              return (
                <button
                  key={p}
                  onClick={() => {
                    speakText(appLang === "ur" ? `صوبہ ${AUTO_URDU_DICT[p] || p}` : `${p} Province`);
                    setProvince(p);
                  }}
                  className="tap-target relative overflow-hidden rounded-2xl px-4 flex items-center justify-between"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.55)), url(${PROVINCE_CARD_BG[p] || PROVINCE_CARD_BG.Punjab})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "1px solid rgba(255,255,255,0.4)",
                    minHeight: 52,
                    color: "#FFFFFF",
                  }}
                >
                  <span className="relative z-10 font-extrabold text-base text-white drop-shadow-sm">{p}</span>
                  <span className="relative z-10 font-bold text-white">›</span>
                </button>
              );
            })}
          {province &&
            !district &&
            Object.keys(LOCATIONS[province]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  speakText(appLang === "ur" ? `ضلع ${AUTO_URDU_DICT[d] || d}` : `${d} District`);
                  if (districtOnly) {
                    onSelect(province, d);
                    onClose();
                  } else {
                    setDistrict(d);
                  }
                }}
                className="tap-target rounded-2xl px-4 flex items-center justify-between"
                style={{
                  background: "#F1F7F4",
                  border: "1px solid #D5E2DD",
                  minHeight: 48,
                }}
              >
                <span className="font-semibold text-sm">{d}</span>
                <span style={{ color: "#52635F" }}>›</span>
              </button>
            ))}
          {province &&
            district &&
            LOCATIONS[province][district].map((s) => (
              <button
                key={s}
                onClick={() => {
                  speakText(appLang === "ur" ? `${AUTO_URDU_DICT[s] || s} منڈی` : `${s} Mandi`);
                  onSelect(province, district, s);
                  onClose();
                }}
                className="tap-target rounded-2xl px-4 flex flex-col justify-center"
                style={{
                  background: "#F1F7F4",
                  border: "1px solid #D5E2DD",
                  minHeight: 48,
                }}
              >
                <p className="font-semibold text-sm">{s}</p>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
