import { useState } from "react";

import { attrLabel, attrValue } from "./Filters";
import type { FilterUiProps } from "./FilterDock";
import { PickerSheet } from "./PickerSheet";
import { C } from "./theme";
import { BottomSheet, Icon } from "./ui";

type Open = "day" | "rate" | "quality" | null;

/**
 * One labelled filter bar under the tabs:
 *   [ Location | Day | Rate | (Quality) ]
 * Each part shows a small caption and the current value, so the whole
 * selection reads at a glance; tapping a part opens its list. A changed part
 * turns green and gets its own ✕ to clear it, so the bar never grows.
 */
export function FilterRail({
  f,
  t,
  locationLabel,
  onOpenLocation,
  dates,
  date,
  latest,
  onDate,
  lockHistory,
  rate,
  rates,
  onRate,
  groups,
  filters,
  onFilters,
  locationActive = false,
  onClearLocation,
  showDate = true,
}: FilterUiProps & { showDate?: boolean }) {
  const [open, setOpen] = useState<Open>(null);
  const qualityCount = Object.values(filters).filter(Boolean).length;
  const allRates = rates[0]?.id;
  const rateLabel = rate === allRates ? f.tx("All rates", "تمام ریٹ") : rates.find((r) => r.id === rate)?.label || rate;
  const isLatest = date === latest;

  const parts: { key: string; caption: string; value: string; active: boolean; grow: number; onClick: () => void; onClear?: () => void }[] = [
    { key: "loc", caption: f.tx("Location", "مقام"), value: locationLabel, active: locationActive, grow: 1.25, onClick: onOpenLocation, onClear: onClearLocation },
  ];
  if (showDate && date) {
    parts.push({
      key: "day",
      caption: isLatest ? f.tx("Day · latest", "دن · تازہ") : f.tx("Day", "دن"),
      value: f.day(date),
      active: !isLatest,
      grow: 0.95,
      onClick: () => setOpen("day"),
      onClear: () => onDate(latest),
    });
  }
  parts.push({
    key: "rate",
    caption: f.tx("Rate", "ریٹ"),
    value: rateLabel,
    active: rate !== allRates,
    grow: 1.1,
    onClick: () => setOpen("rate"),
    onClear: () => allRates && onRate(allRates),
  });
  if (groups.length > 0 || qualityCount > 0) {
    parts.push({
      key: "quality",
      caption: f.tx("Attribute", "خصوصیات"),
      value: qualityCount ? f.tx(`${qualityCount} selected`, `${f.digits(qualityCount)} منتخب`) : f.tx("Any", "کوئی بھی"),
      active: qualityCount > 0,
      grow: 0.9,
      onClick: () => setOpen("quality"),
      onClear: () => onFilters({}),
    });
  }

  return (
    <div dir={f.dir} style={{ display: "flex", alignItems: "stretch", background: C.surface, padding: "10px 16px 12px", borderBottom: `1px solid ${C.lineSoft}`, fontFamily: f.font }}>
      <div role="group" aria-label={f.tx("Filters", "فلٹر")} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "stretch", borderRadius: 16, background: C.surfaceAlt, border: `1px solid ${C.line}`, overflow: "hidden" }}>
        {parts.map((p, i) => {
          const clearable = p.active && !!p.onClear;
          return (
            <div
              key={p.key}
              style={{
                position: "relative",
                flex: `${p.grow} 1 0`,
                minWidth: 0,
                borderInlineStart: i ? `1px solid ${C.line}` : "none",
                background: p.active ? C.brandTint : "transparent",
                transition: "background 200ms",
              }}
            >
              <button
                type="button"
                onClick={p.onClick}
                aria-label={`${p.caption}: ${p.value}`}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  gap: 1,
                  height: 54,
                  padding: "0 10px",
                  border: "none",
                  background: "transparent",
                  fontFamily: f.font,
                  textAlign: "start",
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 500, color: p.active ? C.brandDeep : C.muted, lineHeight: f.lh, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{p.caption}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, maxWidth: "100%" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: p.active ? C.brandDeep : C.ink, lineHeight: f.lh, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{p.value}</span>
                  {!clearable && <Icon name="chevDown" size={11} width={2.8} color={C.faint} />}
                </span>
              </button>
              {clearable && (
                <button
                  type="button"
                  onClick={p.onClear}
                  aria-label={f.tx(`Clear ${p.caption}`, `${p.caption} صاف کریں`)}
                  className="zm-fadein"
                  style={{ position: "absolute", top: 1, insetInlineEnd: 1, width: 30, height: 30, padding: 0, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 9, background: "rgba(8,127,99,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="close" size={10} width={3} color={C.brandDeep} />
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {open === "day" && (
        <PickerSheet
          f={f}
          title={f.tx("Report day", "رپورٹ کا دن")}
          subtitle={lockHistory ? f.tx("Past days need a subscription", "پچھلے دن سبسکرپشن کے ساتھ") : undefined}
          value={[date]}
          onChange={(v) => onDate(v[0])}
          onClose={() => setOpen(null)}
          options={[...dates].reverse().map((d) => ({
            id: d,
            label: f.dayFullWeekdayYear(d),
            meta: d === latest ? f.tx("Latest", "تازہ ترین") : undefined,
            disabled: lockHistory && d !== latest,
          }))}
        />
      )}

      {open === "rate" && (
        <PickerSheet
          f={f}
          title={f.tx("Rate type", "ریٹ کی قسم")}
          value={[rate]}
          onChange={(v) => onRate(v[0])}
          onClose={() => setOpen(null)}
          options={rates.map((r) => ({
            id: r.id,
            label: r.label,
            meta: r.count ? f.tx(`${r.count} location${r.count === 1 ? "" : "s"}`, `${f.digits(r.count)} مقامات`) : f.tx("no reports", "رپورٹ نہیں"),
            disabled: !r.count && r.id !== rate,
          }))}
        />
      )}

      {open === "quality" && (
        <BottomSheet
          onClose={() => setOpen(null)}
          title={f.tx("Attributes", "خصوصیات")}
          dir={f.dir}
          font={f.font}
          display={f.display}
          action={
            qualityCount > 0 ? (
              <button type="button" onClick={() => onFilters({})} style={{ height: 44, padding: "0 10px", border: "none", background: "transparent", color: C.brandDeep, fontSize: 14, fontWeight: 600, fontFamily: f.font }}>
                {f.tx("Clear", "صاف کریں")}
              </button>
            ) : undefined
          }
          footer={
            <button type="button" onClick={() => setOpen(null)} style={{ flex: 1, height: 52, borderRadius: 16, border: "none", background: C.brand, color: "#FFFFFF", fontSize: 15, fontWeight: 600, fontFamily: f.font }}>
              {f.tx("Done", "ٹھیک ہے")}
            </button>
          }
        >
          {groups.map((g) => (
            <div key={g.key} style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{attrLabel(f, g.key)}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {g.options.map((o) => {
                  const on = filters[g.key] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onFilters({ ...filters, [g.key]: on ? undefined : o.value })}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        height: 38,
                        padding: "0 14px",
                        border: "none",
                        borderRadius: 19,
                        background: on ? C.brand : C.chip,
                        color: on ? "#FFFFFF" : C.ink,
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: f.font,
                      }}
                    >
                      {attrValue(f, t, g.key, o.value)}
                      <span style={{ fontSize: 12, fontWeight: 600, opacity: on ? 0.8 : 0.5 }}>{f.digits(o.count)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </BottomSheet>
      )}
    </div>
  );
}
