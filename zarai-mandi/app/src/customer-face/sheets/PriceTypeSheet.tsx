import { useState } from "react";

import { ALL_RATE_TYPES, RATE_COLORS } from "../shared/data/rates";

//  SHEETS

export function PriceTypeSheet({
  selected,
  onApply,
  onClose,
}: {
  selected: string[];
  onApply: (v: string[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<string[]>(selected);
  const toggle = (rt: string) =>
    setLocal((p) => (p.includes(rt) ? p.filter((x) => x !== rt) : [...p, rt]));
  return (
    <div className="zm-sheet-overlay" style={{ zIndex: 200 }} onClick={onClose}>
      <div
        className="zm-sheet-high"
        style={{ maxHeight: "82vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 border-b border-[#DCE8E3] flex-shrink-0">
          <div className="zm-drag-handle" />
          <p className="font-bold text-lg">Price Types</p>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 p-4 flex flex-col gap-2">
          <button
            onClick={() => {
              if (local.length === ALL_RATE_TYPES.length) setLocal([]);
              else setLocal([...ALL_RATE_TYPES]);
            }}
            className="tap-target rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{
              background:
                local.length === ALL_RATE_TYPES.length ? "#168A76" : "#F1F7F4",
              color:
                local.length === ALL_RATE_TYPES.length ? "#fff" : "#183B34",
              border: `1.5px solid ${local.length === ALL_RATE_TYPES.length ? "#168A76" : "#D5E2DD"
                }`,
            }}
          >
            <div
              className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
              style={{
                background:
                  local.length === ALL_RATE_TYPES.length
                    ? "rgba(255,255,255,0.3)"
                    : "#E8EFEC",
                border:
                  local.length === ALL_RATE_TYPES.length
                    ? "none"
                    : "1.5px solid #168A76",
              }}
            >
              {local.length === ALL_RATE_TYPES.length && (
                <span
                  style={{
                    fontSize: 9,
                    color: "#fff",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                ></span>
              )}
            </div>
            <span className="font-bold text-sm flex-1">All Price Types</span>
            {local.length === ALL_RATE_TYPES.length && (
              <span className="text-xs opacity-80">
                ({ALL_RATE_TYPES.length})
              </span>
            )}
          </button>
          {ALL_RATE_TYPES.map((rt) => (
            <button
              key={rt}
              onClick={() => toggle(rt)}
              className="tap-target rounded-2xl px-4 flex items-center gap-3"
              style={{
                background: local.includes(rt) ? "#EAF5F1" : "#F1F7F4",
                border: `1.5px solid ${local.includes(rt) ? "#168A76" : "#D5E2DD"
                  }`,
                minHeight: 52,
              }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: RATE_COLORS[rt] }}
              />
              <span className="flex-1 font-semibold text-sm">{rt}</span>
              {local.includes(rt) && (
                <span
                  className="text-xs font-bold"
                  style={{ color: "#168A76" }}
                ></span>
              )}
            </button>
          ))}
        </div>
        <div className="px-4 pb-6 pt-3 border-t border-[#DCE8E3] flex-shrink-0">
          <button
            onClick={() => {
              onApply(local);
              onClose();
            }}
            className="tap-target w-full rounded-2xl py-4 font-bold text-white text-base"
            style={{ background: "#168A76" }}
          >
            {local.length === ALL_RATE_TYPES.length
              ? "Show All Price Types"
              : local.length > 0
                ? `Apply ${local.length} Type${local.length > 1 ? "s" : ""}`
                : "Show All Price Types"}
          </button>
        </div>
      </div>
    </div>
  );
}
