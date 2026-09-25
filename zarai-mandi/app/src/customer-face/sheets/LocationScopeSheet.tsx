import { useState } from "react";

import { appLang } from "../shared/i18n/LangProvider";
import { AUTO_URDU_DICT } from "../shared/i18n/urduDictionary";
import { type LocationScope } from "../shared/types";
import { speakText } from "../shared/voice";
import { LocationSheet } from "./LocationSheet";

//  LOCATION SCOPE SHEET — contextual chip (District/Province/Pakistan/Mandi)

export function LocationScopeSheet({
  scope,
  onSelect,
  onClose,
}: {
  scope: LocationScope;
  onSelect: (s: LocationScope) => void;
  onClose: () => void;
}) {
  const [mandiPicker, setMandiPicker] = useState(false);
  const rows: {
    kind: LocationScope["kind"];
    label: string;
    sub: string;
    icon: string;
  }[] = [
      { kind: "pakistan", label: "Pakistan", sub: "All Pakistan (National)", icon: "🇵🇰" },
      { kind: "province", label: "Punjab", sub: "Punjab Province", icon: "🏛️" },
      { kind: "province", label: "Sindh", sub: "Sindh Province", icon: "🕌" },
      { kind: "province", label: "KPK", sub: "Khyber Pakhtunkhwa", icon: "🏔️" },
      { kind: "province", label: "Balochistan", sub: "Balochistan Province", icon: "🏜️" },
      { kind: "district", label: "Pakpattan", sub: "Pakpattan District", icon: "📍" },
    ];

  if (mandiPicker) {
    return (
      <LocationSheet
        onSelect={(p, d, s) => {
          const sel = s || d || p;
          speakText(appLang === "ur" ? `${AUTO_URDU_DICT[sel] || sel} کی قیمتیں` : `Prices for ${sel}`);
          onSelect({ kind: "mandi", label: sel });
          onClose();
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="zm-sheet-overlay" style={{ zIndex: 200 }} onClick={onClose}>
      <div
        className="zm-sheet"
        style={{ background: "#F4FAF7", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 border-b border-[#DCE8E3]">
          <p className="font-bold text-base">Show rates for</p>
          <p className="text-xs" style={{ color: "#52635F" }}>
            Your default area is applied automatically
          </p>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {rows.map((r) => {
            const on =
              scope.kind === r.kind &&
              (r.kind === "pakistan" || scope.label.toLowerCase() === r.label.toLowerCase());
            return (
              <button
                key={`${r.kind}-${r.label}`}
                onClick={() => {
                  const spoken = appLang === "ur"
                    ? (r.kind === "pakistan" ? "پورے پاکستان کی قیمتیں" : r.kind === "province" ? `صوبہ ${AUTO_URDU_DICT[r.label] || r.label}` : `ضلع ${AUTO_URDU_DICT[r.label] || r.label}`)
                    : (r.kind === "pakistan" ? "All Pakistan prices" : `${r.label} ${r.kind}`);
                  speakText(spoken);
                  onSelect({ kind: r.kind, label: r.label });
                  onClose();
                }}
                className="tap-target rounded-2xl px-4 flex items-center gap-3"
                style={{
                  background: on ? "#E4F2EC" : "#F1F7F4",
                  border: on ? "2px solid #087F63" : "1px solid #D5E2DD",
                  minHeight: 56,
                }}
              >
                <span style={{ fontSize: 22 }}>{r.icon}</span>
                <div className="flex-1 text-left">
                  <p
                    className="font-bold text-sm"
                    style={{ color: on ? "#075E4F" : "#183B34" }}
                  >
                    {r.label}
                  </p>
                  <p className="text-xs" style={{ color: "#52635F" }}>
                    {r.sub}
                  </p>
                </div>
                {on && (
                  <span style={{ color: "#087F63", fontWeight: 800 }}></span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => {
              speakText(appLang === "ur" ? "منڈی منتخب کریں" : "Select Mandi");
              setMandiPicker(true);
            }}
            className="tap-target rounded-2xl px-4 flex items-center gap-3"
            style={{
              background: "#F1F7F4",
              border: "1px solid #D5E2DD",
              minHeight: 56,
            }}
          >
            <span style={{ fontSize: 22 }}></span>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">Select Mandi</p>
              <p className="text-xs" style={{ color: "#52635F" }}>
                Pick a specific market
              </p>
            </div>
            <span style={{ color: "#52635F" }}>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
