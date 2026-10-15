import { useMemo, useState } from "react";

import type { Fmt } from "./format";
import { C } from "./theme";
import { BottomSheet, Icon, Segmented } from "./ui";

const WEEK_EN = ["S", "M", "T", "W", "T", "F", "S"];
const WEEK_UR = ["ات", "پی", "من", "بد", "جم", "جم", "ہف"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_UR = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];

/**
 * Calendar picker as a bottom sheet, offering only the days that have reports.
 *  - Range: tap a start day, then an end day; the range fills in.
 *  - Day (when `onPickDay` is given): tap a day to pick it.
 * With both, a switch at the top moves between "Single day" and "Date range".
 */
export function RangeSheet({
  f,
  dates,
  value,
  onApply,
  onClose,
  day: pickedDay,
  onPickDay,
  allowRange = true,
  initialMode,
  dayDisabled,
  dayNote,
}: {
  f: Fmt;
  dates: string[]; // available report days, oldest first (YYYY-MM-DD)
  value: { start: string; end: string };
  onApply: (v: { start: string; end: string }) => void;
  onClose: () => void;
  /** Single-day mode: the picked day and its handler. */
  day?: string;
  onPickDay?: (d: string) => void;
  /** Offer the date-range mode too (default true). */
  allowRange?: boolean;
  initialMode?: "day" | "range";
  /** Days that can't be picked in single-day mode (e.g. history locked). */
  dayDisabled?: (d: string) => boolean;
  /** Small note under the title in single-day mode. */
  dayNote?: string;
}) {
  const canDay = !!onPickDay;
  const canRange = allowRange || !canDay;
  const [mode, setMode] = useState<"day" | "range">(() => (!canDay ? "range" : !canRange ? "day" : initialMode || "day"));
  const isDay = mode === "day";
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
    if (isDay) {
      onPickDay?.(d);
      onClose();
      return;
    }
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

  // One month at a time, opening on the picked day's (or range end's) month;
  // the arrows step to earlier / later months that have reports.
  const monthOf = (d: string | null | undefined) => {
    if (!d) return -1;
    const [y, m] = d.split("-").map(Number);
    return months.findIndex((mo) => mo.y === y && mo.m === m);
  };
  const [monthIdx, setMonthIdx] = useState(() => {
    const i = monthOf(isDay ? pickedDay : value.end || value.start);
    return i >= 0 ? i : months.length - 1;
  });
  const mo = months[Math.max(0, Math.min(months.length - 1, monthIdx))];
  const canPrev = monthIdx > 0;
  const canNext = monthIdx < months.length - 1;

  return (
    <BottomSheet
      onClose={onClose}
      title={isDay ? f.tx("Report day", "رپورٹ کا دن") : f.tx("Custom period", "مخصوص مدت")}
      subtitle={
        isDay
          ? dayNote || (pickedDay ? f.day(pickedDay, true) : undefined)
          : end
            ? `${label(start)} – ${label(end)}`
            : f.tx(`From ${f.day(start)} · now tap an end day`, `${f.day(start)} سے · اب آخری دن چنیں`)
      }
      dir={f.dir}
      font={f.font}
      display={f.display}
      footer={
        isDay ? undefined : (
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
        )
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {canDay && canRange && (
          <Segmented
            label={f.tx("Pick", "انتخاب")}
            value={mode}
            onChange={setMode}
            font={f.font}
            options={[
              { id: "day", label: f.tx("Single day", "ایک دن"), color: C.brand },
              { id: "range", label: f.tx("Date range", "تاریخوں کی حد"), color: C.brand },
            ]}
          />
        )}
        {!isDay && dates.length > 62 && (
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
                    setMonthIdx(monthOf(p.start));
                  }}
                  style={{ height: 34, padding: "0 14px", borderRadius: 17, border: `1px solid ${on ? C.brand : C.line}`, background: on ? C.brandTint : C.surface, color: on ? C.brandDeep : C.ink2, fontSize: 13, fontWeight: 600, fontFamily: f.font }}
                >
                  {f.tx(p.en, p.ur)}
                </button>
              );
            })}
          </div>
        )}
        {mo && (
          <div style={{ borderRadius: 18, background: C.surface, padding: "10px 10px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 2px 8px" }}>
              <button
                type="button"
                aria-label={f.tx("Previous month", "پچھلا مہینہ")}
                disabled={!canPrev}
                onClick={() => setMonthIdx((i) => i - 1)}
                style={{ width: 36, height: 36, borderRadius: 18, border: "none", background: canPrev ? C.chip : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: canPrev ? "pointer" : "default" }}
              >
                <Icon name="back" size={18} width={2.4} color={canPrev ? C.ink : C.faint} flip={f.ur} />
              </button>
              <span style={{ fontSize: 16, fontWeight: 700, textAlign: "center" }}>
                {f.ur ? `${MONTHS_UR[mo.m - 1]} ${f.digits(mo.y)}` : `${MONTHS_EN[mo.m - 1]} ${mo.y}`}
              </span>
              <button
                type="button"
                aria-label={f.tx("Next month", "اگلا مہینہ")}
                disabled={!canNext}
                onClick={() => setMonthIdx((i) => i + 1)}
                style={{ width: 36, height: 36, borderRadius: 18, border: "none", background: canNext ? C.chip : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: canNext ? "pointer" : "default" }}
              >
                <Icon name="chevRight" size={18} width={2.4} color={canNext ? C.ink : C.faint} flip={f.ur} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", rowGap: 4 }}>
              {(f.ur ? WEEK_UR : WEEK_EN).map((w, k) => (
                <span key={k} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 600, color: C.faint, paddingBottom: 4 }}>
                  {w}
                </span>
              ))}
              {mo.cells.map((d, k) => {
                if (!d) return <span key={k} />;
                const has = available.has(d) && !(isDay && dayDisabled?.(d));
                const isStart = isDay ? d === pickedDay : d === start;
                const isEnd = !isDay && d === end;
                const inRange = !isDay && !!end && d > start && d < end;
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
                      background: inRange || (!isDay && edge && end && start !== end) ? C.brandTint : "transparent",
                      borderRadius: isDay ? 0 : isStart && end ? (f.ur ? "0 20px 20px 0" : "20px 0 0 20px") : isEnd ? (f.ur ? "20px 0 0 20px" : "0 20px 20px 0") : 0,
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
        )}
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: C.muted, textAlign: "center", lineHeight: f.lh }}>
          {f.tx("Only days with mandi reports can be picked.", "صرف وہ دن چنے جا سکتے ہیں جن کی رپورٹ موجود ہے۔")}
        </p>
      </div>
    </BottomSheet>
  );
}
