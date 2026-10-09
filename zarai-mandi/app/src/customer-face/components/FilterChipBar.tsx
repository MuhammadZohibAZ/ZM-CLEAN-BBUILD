import { useState } from "react";

import { toUrduDigits, URDU_FONT, useLang } from "../shared/i18n/LangProvider";

// Multi-select chip filter used above the by-product cards (the by-product
// screen's special-attribute filter, and the tester variants).

export const FILTER_ALL = "__all__";

export type FilterOption = {
  value: string;
  label: string;
  /** Small label before the value, e.g. "Crop" for New / Old. */
  caption?: string;
  count: number;
};

/**
 * Multi-select filter values: an empty selection means All. Values that no
 * longer exist (e.g. after a location change) are ignored.
 */
export function useMultiFilter(options: FilterOption[]) {
  const [selected, setSelected] = useState<string[]>([]);
  const active = selected.filter((v) => options.some((o) => o.value === v));
  const toggle = (value: string) => {
    if (value === FILTER_ALL) return setSelected([]);
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };
  const matches = (value: string) => active.length === 0 || active.includes(value);
  return { active, toggle, matches };
}

/** Horizontal multi-select chip filter in the screen's green glass style, with a card count. */
export function FilterChipBar({
  title,
  options,
  selected,
  onToggle,
  totalCount,
  visibleCount,
}: {
  title: string;
  options: FilterOption[];
  /** Selected values; empty = All. */
  selected: string[];
  onToggle: (value: string) => void;
  totalCount: number;
  visibleCount: number;
}) {
  const { lang } = useLang();
  const font = lang === "ur" ? URDU_FONT : "inherit";
  const digits = (n: number) => (lang === "ur" ? toUrduDigits(n) : String(n));
  const chips: FilterOption[] = [
    { value: FILTER_ALL, label: lang === "ur" ? "سب" : "All", count: totalCount },
    ...options,
  ];

  return (
    <div
      className="flex-shrink-0 px-3 pt-2 pb-2"
      style={{
        background: "rgba(244, 250, 247, 0.85)",
        borderBottom: "1px solid rgba(16, 185, 129, 0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-1.5" style={{ fontFamily: font }}>
        <span className="text-[11px] font-black uppercase tracking-wide text-[#087F63]">{title}</span>
        <span className="text-[11px] font-bold text-[#52635F]">
          {lang === "ur" ? `${digits(visibleCount)} کارڈز` : `${visibleCount} ${visibleCount === 1 ? "card" : "cards"}`}
        </span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5" style={{ scrollbarWidth: "none" }}>
        {chips.map((o) => {
          const on = o.value === FILTER_ALL ? selected.length === 0 : selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o.value)}
              className="tap-target zm-beam-border flex-shrink-0 flex items-center gap-1.5 rounded-full font-bold transition active:scale-95 px-3 py-1"
              style={{
                background: on
                  ? "linear-gradient(135deg, rgba(167, 243, 208, 0.85), rgba(110, 231, 183, 0.75))"
                  : "rgba(255, 255, 255, 0.65)",
                color: "#064E3B",
                border: on ? "1.2px solid #10B981" : "1.2px solid rgba(16, 185, 129, 0.35)",
                fontSize: 12,
                minHeight: 32,
                fontFamily: font,
                whiteSpace: "nowrap",
              }}
            >
              {o.caption && <span className="font-semibold text-[#52635F]">{o.caption}</span>}
              <span>{o.label}</span>
              <span
                className="rounded-full px-1.5 text-[10px] font-black leading-[16px]"
                style={{
                  background: on ? "rgba(255,255,255,0.7)" : "rgba(16, 185, 129, 0.12)",
                  color: "#087F63",
                }}
              >
                {digits(o.count)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
