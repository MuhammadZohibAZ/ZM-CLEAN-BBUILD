import { useEffect, useMemo, useRef, useState } from "react";

import type { Fmt } from "./format";
import { C } from "./theme";
import { BottomSheet } from "./ui";

const WEEK_EN = ["S", "M", "T", "W", "T", "F", "S"];
const WEEK_UR = ["ات", "پی", "من", "بد", "جم", "جم", "ہف"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_UR = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];

/**
 * Custom period picker as a bottom sheet: a calendar of only the days that
 * have reports. Tap a start day, then an end day; the range fills in.
 */
export function RangeSheet({
  f,
  dates,
  value,
  onApply,
  onClose,
}: {
  f: Fmt;
  dates: string[]; // available report days, oldest first (YYYY-MM-DD)
  value: { start: string; end: string };
  onApply: (v: { start: string; end: string }) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState<string>(value.start);
  const [end, setEnd] = useState<string | null>(value.end);
  const available = useMemo(() => new Set(dates), [dates]);

  // Months that contain report days, each laid out as a week grid.
  const months = useMemo(() => {
    const out: { key: string; y: number; m: number; cells: (string | null)[] }[] = [];
    const seen = new Set<string>();
    for (const d of dates) {
      const [y, m] = d.split("-").map(Number);
      const key = `${y}-${m}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const first = new Date(y, m - 1, 1).getDay();
      const days = new Date(y, m, 0).getDate();
      const cells: (string | null)[] = Array(first).fill(null);
      for (let day = 1; day <= days; day++) cells.push(`${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
      while (cells.length % 7) cells.push(null);
      out.push({ key, y, m, cells });
    }
    return out;
  }, [dates]);

  const pick = (d: string) => {
    if (!end || d < start) {
      // start a new range (or move the start earlier)
      if (end && d < start) {
        setStart(d);
        return;
      }
      if (!end && d > start) {
        setEnd(d);
        return;
      }
      setStart(d);
      setEnd(null);
      return;
    }
    // a full range exists: begin a new one
    setStart(d);
    setEnd(null);
  };

  const count = end ? dates.filter((d) => d >= start && d <= end).length : 0;
  const ready = !!end && count >= 2;
  // Add the year once a range crosses into another year (the data spans a year).
  const crossYear = !!end && start.slice(0, 4) !== end.slice(0, 4);
  const label = (d: string) => (crossYear ? `${f.day(d)} '${f.digits(d.slice(2, 4))}` : f.day(d));

  // Quick periods ending on the latest report day.
  const last = dates[dates.length - 1];
  const presets = [
    { months: 3, en: "Last 3 months", ur: "پچھلے 3 ماہ" },
    { months: 6, en: "Last 6 months", ur: "پچھلے 6 ماہ" },
    { months: 9, en: "Last 9 months", ur: "پچھلے 9 ماہ" },
    { months: 12, en: "Whole year", ur: "پورا سال" },
  ].map((p) => {
    const from = new Date(`${last}T00:00:00Z`);
    from.setUTCMonth(from.getUTCMonth() - p.months);
    from.setUTCDate(from.getUTCDate() + 1);
    const iso = from.toISOString().slice(0, 10);
    return { ...p, start: dates.find((d) => d >= iso) || dates[0] };
  });

  // Open on the month of the current start day, not the oldest month.
  const monthRefs = useRef(new Map<string, HTMLDivElement>());
  useEffect(() => {
    const [y, m] = value.start.split("-").map(Number);
    monthRefs.current.get(`${y}-${m}`)?.scrollIntoView({ block: "start" });
  }, [value.start]);

  return (
    <BottomSheet
      onClose={onClose}
      title={f.tx("Custom period", "مخصوص مدت")}
      subtitle={end ? `${label(start)} – ${label(end)}` : f.tx(`From ${f.day(start)} · now tap an end day`, `${f.day(start)} سے · اب آخری دن چنیں`)}
      dir={f.dir}
      font={f.font}
      display={f.display}
      footer={
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            if (!end) return;
            onApply({ start, end });
            onClose();
          }}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 16,
            border: "none",
            background: ready ? C.brand : C.track,
            color: ready ? "#FFFFFF" : C.faint,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: f.font,
          }}
        >
          {ready
            ? f.tx(`Show ${label(start)} – ${label(end!)} · ${count} days`, `${label(start)} – ${label(end!)} دکھائیں · ${f.digits(count)} دن`)
            : f.tx("Pick an end day", "آخری دن چنیں")}
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {dates.length > 62 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {presets.map((p) => {
              const on = start === p.start && end === last;
              return (
                <button
                  key={p.months}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setStart(p.start);
                    setEnd(last);
                  }}
                  style={{ height: 34, padding: "0 14px", borderRadius: 17, border: `1px solid ${on ? C.brand : C.line}`, background: on ? C.brandTint : C.surface, color: on ? C.brandDeep : C.ink2, fontSize: 13, fontWeight: 600, fontFamily: f.font }}
                >
                  {f.tx(p.en, p.ur)}
                </button>
              );
            })}
          </div>
        )}
        {months.map((mo) => (
          <div
            key={mo.key}
            ref={(el) => {
              if (el) monthRefs.current.set(mo.key, el);
              else monthRefs.current.delete(mo.key);
            }}
            style={{ scrollMarginTop: 8, borderRadius: 18, background: C.surface, padding: "12px 12px 8px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, padding: "0 4px 8px" }}>
              {f.ur ? `${MONTHS_UR[mo.m - 1]} ${f.digits(mo.y)}` : `${MONTHS_EN[mo.m - 1]} ${mo.y}`}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", rowGap: 4 }}>
              {(f.ur ? WEEK_UR : WEEK_EN).map((w, k) => (
                <span key={k} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 600, color: C.faint, paddingBottom: 4 }}>
                  {w}
                </span>
              ))}
              {mo.cells.map((d, k) => {
                if (!d) return <span key={k} />;
                const has = available.has(d);
                const isStart = d === start;
                const isEnd = d === end;
                const inRange = !!end && d > start && d < end;
                const edge = isStart || isEnd;
                const day = Number(d.slice(8));
                return (
                  <div
                    key={k}
                    style={{
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: inRange || (edge && end && start !== end) ? C.brandTint : "transparent",
                      borderRadius: isStart && end ? (f.ur ? "0 20px 20px 0" : "20px 0 0 20px") : isEnd ? (f.ur ? "20px 0 0 20px" : "0 20px 20px 0") : 0,
                    }}
                  >
                    <button
                      type="button"
                      disabled={!has}
                      aria-pressed={edge}
                      aria-label={f.day(d, true)}
                      onClick={() => pick(d)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        border: "none",
                        background: edge ? C.brand : "transparent",
                        color: edge ? "#FFFFFF" : has ? C.ink : "#C5CCC9",
                        fontSize: 14,
                        fontWeight: edge ? 700 : 500,
                        fontFamily: f.font,
                        fontVariantNumeric: "tabular-nums",
                        cursor: has ? "pointer" : "default",
                      }}
                    >
                      {f.digits(day)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: C.muted, textAlign: "center", lineHeight: f.lh }}>
          {f.tx("Only days with mandi reports can be picked.", "صرف وہ دن چنے جا سکتے ہیں جن کی رپورٹ موجود ہے۔")}
        </p>
      </div>
    </BottomSheet>
  );
}
