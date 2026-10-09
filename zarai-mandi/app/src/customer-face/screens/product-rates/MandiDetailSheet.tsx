import { useMemo, useRef, useState } from "react";

import { MANDI_DATA } from "../../shared/data/mandiLocation";
import { attrLabel, attrValue } from "./Filters";
import { arrow, normLoc, shortRate, stripMandi, type Fmt } from "./format";
import { statsFor } from "./selectors";
import { C } from "./theme";
import { IntradayChart, type IntradayPoint } from "./IntradayChart";
import { RangeSheet } from "./RangeSheet";
import { TrendChart } from "./TrendChart";
import type { AttrKey, MarketRow } from "./types";
import { BottomSheet, Chip, ChangePill, HScroll, Icon, IconButton, Segmented } from "./ui";
import { TIMELINE } from "./useMarketData";

// History table cells.
// The same periods as the Trends tab. 1D is the viewed day on a 24-hour axis.
type SheetRange = "1D" | "1W" | "2W" | "1M" | "6M" | "1Y" | "CUSTOM";
const SHEET_RANGE_DAYS: Record<Exclude<SheetRange, "1D" | "CUSTOM">, number> = { "1W": 7, "2W": 14, "1M": 30, "6M": 182, "1Y": 365 };
const SHEET_RANGES: { id: Exclude<SheetRange, "CUSTOM">; en: string; ur: string }[] = [
  { id: "1D", en: "1D", ur: "1د" },
  { id: "1W", en: "1W", ur: "1ہ" },
  { id: "2W", en: "2W", ur: "2ہ" },
  { id: "1M", en: "1M", ur: "1م" },
  { id: "6M", en: "6M", ur: "6م" },
  { id: "1Y", en: "1Y", ur: "1س" },
];

const TH = { padding: "8px 6px", fontSize: 11.5, fontWeight: 600, color: C.muted, textAlign: "start", position: "sticky", top: 0, background: C.surface, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" } as const;
const TD = { padding: "9px 6px", fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" } as const;

/** Everything about one mandi for one by-product: each rate type it reported,
 * how it compares with the country, a month of price and arrivals (as charts,
 * or swipe across for a day-by-day table), and what was traded. */
export function MandiDetailSheet({
  f,
  t,
  tm,
  tr,
  byproductName,
  mandiName,
  initialRate,
  allRows,
  dates,
  date,
  onClose,
  onListen,
  onSetLocation,
}: {
  f: Fmt;
  t: (s: string) => string;
  tm: (s: string) => string;
  tr: (s: string) => string;
  /** The by-product these rates are for (already in the current language). The
   * screen's header stays visible above the sheet and shows it too. */
  byproductName: string;
  byproductIcon?: string;
  vertical?: string;
  mandiName: string;
  initialRate: string;
  allRows: MarketRow[];
  dates: string[];
  date: string;
  onClose: () => void;
  onListen: (text: string) => void;
  onSetLocation: () => void;
}) {
  const key = normLoc(mandiName);
  const mine = useMemo(() => allRows.filter((r) => normLoc(r.mandiName) === key), [allRows, key]);
  const today = mine.filter((r) => r.date === date);
  const rates = [...new Set(today.map((r) => r.rateType))];
  const [rate, setRate] = useState(rates.includes(initialRate) ? initialRate : rates[0] || initialRate);
  const [view, setView] = useState<"price" | "arrival">("price");
  const [range, setRange] = useState<SheetRange>("1M");
  const [custom, setCustom] = useState<{ start: string; end: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  // Trend charts and the day-by-day table share one horizontally swiped area.
  const pager = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0);
  const goToPage = (i: number) => {
    const el = pager.current;
    if (!el) return;
    el.scrollTo({ left: (f.ur ? -1 : 1) * i * el.clientWidth, behavior: "smooth" });
    setPage(i);
  };

  // Lookup mandi wiki / agricultural background profile
  const mandiMeta = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = norm(mandiName);
    const cityTarget = norm(stripMandi(mandiName));
    return (
      MANDI_DATA.find((m) => {
        const mn = norm(m.name);
        const mc = norm(m.city);
        return mn === target || mc === cityTarget || target.includes(mc) || mn.includes(cityTarget);
      }) || null
    );
  }, [mandiName]);

  const cur = today.filter((r) => r.rateType === rate);
  const s = statsFor(cur);
  const timelineIdx = TIMELINE.indexOf(date);
  const prevDate = timelineIdx > 0 ? TIMELINE[timelineIdx - 1] : dates[dates.indexOf(date) - 1];
  const prevRows = prevDate ? mine.filter((r) => r.date === prevDate && r.rateType === rate) : [];
  const prev = prevRows.length ? statsFor(prevRows) : null;
  const change = prev && prev.mid > 0 && s.mid > 0 ? ((s.mid - prev.mid) / prev.mid) * 100 : null;
  const diffYesterday = prev && prev.mid > 0 && s.mid > 0 ? s.mid - prev.mid : null;

  // Rank among all mandis for the same rate type that day.
  const byMandi = new Map<string, MarketRow[]>();
  for (const r of allRows) if (r.date === date && r.rateType === rate) byMandi.set(r.mandiName, [...(byMandi.get(r.mandiName) || []), r]);
  const mids = [...byMandi.entries()].map(([m, rs]) => ({ m, mid: statsFor(rs).mid })).sort((a, b) => b.mid - a.mid);
  const rank = mids.findIndex((x) => normLoc(x.m) === key) + 1;

  // Month series for this mandi + rate type (unreported days are gaps).
  const series = useMemo(() => {
    const lo: number[] = [];
    const hi: number[] = [];
    const mid: number[] = [];
    const arr: number[] = [];
    for (const d of TIMELINE) {
      const st = statsFor(mine.filter((r) => r.date === d && r.rateType === rate));
      lo.push(st.min);
      hi.push(st.max);
      mid.push(st.mid);
      arr.push(st.arrival);
    }
    return { lo, hi, mid, arr };
  }, [mine, rate]);

  const specKeys: AttrKey[] = ["newOld", "moisture", "color", "variety", "origin", "spec"];
  const join = (vals: (string | undefined)[]) => [...new Set(vals.filter(Boolean) as string[])];
  const name = tm(stripMandi(mandiName));
  const place = cur[0] || today[0] || mine[0];
  const color = C.brand;

  const districtName = place?.district
    ? f.ur
      ? `ضلع ${tm(place.district).replace(/ضلع/g, "").trim()}`
      : `${tm(place.district).replace(/\s*district$/i, "")} District`
    : mandiMeta?.district
      ? f.ur
        ? `ضلع ${tm(mandiMeta.district)}`
        : `${mandiMeta.district} District`
      : "";
  const provinceName = place?.province ? tm(place.province) : mandiMeta?.province ? tm(mandiMeta.province) : "";
  const dateStr = `${f.day(date)} ${f.digits(date.slice(0, 4))}`;
  const subtitle = [districtName, provinceName, dateStr].filter(Boolean).join(f.ur ? "، " : ", ");

  // The chart window: the chosen range, ending on the day being viewed (or the custom days).
  const viewEnd = timelineIdx >= 0 ? timelineIdx + 1 : TIMELINE.length;
  const customStart = custom ? TIMELINE.indexOf(custom.start) : -1;
  const customEnd = custom ? TIMELINE.indexOf(custom.end) : -1;
  const isCustom = range === "CUSTOM" && customStart >= 0 && customEnd >= customStart;
  const winEnd = isCustom ? customEnd + 1 : viewEnd;
  const winStart = isCustom ? customStart : Math.max(0, winEnd - (range === "1D" || range === "CUSTOM" ? 30 : SHEET_RANGE_DAYS[range]));
  const winDates = TIMELINE.slice(winStart, winEnd);
  const win = (a: number[]) => a.slice(winStart, winEnd);
  const winIdx = winDates.length - 1;

  // Days this mandi reported the rate (the custom picker offers only these).
  const reportDays = useMemo(() => {
    const days = TIMELINE.filter((_, k) => series.lo[k] > 0 || series.arr[k] > 0);
    return days.length ? days : TIMELINE;
  }, [series]);

  // 1D: the viewed day's reports at this mandi on a 24-hour axis.
  const intraday = useMemo<IntradayPoint[]>(() => {
    if (range !== "1D") return [];
    const rows = mine.filter((r) => r.date === date && r.rateType === rate);
    const timed = rows.filter((r) => r.reportedAt);
    if (timed.length) {
      const byMinute = new Map<number, MarketRow[]>();
      for (const r of timed) {
        const [h, m] = r.reportedAt!.split(":").map(Number);
        byMinute.set(h * 60 + m, [...(byMinute.get(h * 60 + m) || []), r]);
      }
      return [...byMinute].map(([minute, list]) => {
        const st = statsFor(list);
        return view === "price" ? { minute, value: st.mid, lo: st.min, hi: st.max } : { minute, value: list.reduce((a, x) => a + x.arrival, 0) };
      });
    }
    const st = statsFor(rows);
    return view === "price" ? [{ minute: null, value: st.mid, lo: st.min, hi: st.max }] : [{ minute: null, value: st.arrival }];
  }, [range, mine, date, rate, view]);

  // Day-by-day table for this mandi and rate type, newest first (reported days only).
  const history = TIMELINE.map((d, k) => ({ d, k }))
    .filter(({ k }) => series.lo[k] > 0)
    .reverse()
    .map(({ d, k }, i, list) => {
      const older = list[i + 1];
      const change = older && series.mid[older.k] > 0 ? ((series.mid[k] - series.mid[older.k]) / series.mid[older.k]) * 100 : null;
      return { d, min: series.lo[k], max: series.hi[k], arrival: series.arr[k], change };
    });

  const spoken = f.tx(
    `${byproductName}, ${stripMandi(mandiName)} Mandi, ${shortRate(rate)} rate, ${Math.round(s.min)} to ${Math.round(s.max)} rupees per 40 kilo`,
    `${byproductName}، ${name} منڈی، ${shortRate(tr(rate))}، ${Math.round(s.min)} سے ${Math.round(s.max)} روپے فی چالیس کلو`,
  );

  const tradedFields = [
    ...specKeys.map((k) => ({ label: attrLabel(f, k), vals: join(cur.map((r) => r[k])).map((v) => attrValue(f, t, k, v)) })),
    { label: f.tx("Attribute", "خصوصیات"), vals: join(cur.map((r) => r.quality)) },
    { label: f.tx("Arrival", "آمد"), vals: s.arrival > 0 ? [`${f.num(s.arrival)} ${f.tx("bags", "بوریاں")}`] : [] },
    { label: f.tx("Arrival unit", "آمد کی اکائی"), vals: join(cur.map((r) => f.unit(r.arrivalUnit || ""))) },
  ].filter((x) => x.vals.length > 0);

  const box = (label: string, value: string, valColor: string = C.ink, bg: string = C.surfaceAlt) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: 10, borderRadius: 14, background: bg, minWidth: 0 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: valColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </div>
  );

  const defaultProfile = f.tx(
    `${stripMandi(mandiName)} is an active agricultural grain market hub in ${place?.province || mandiMeta?.province || "Pakistan"}, connecting regional growers with wholesale buyers for daily transparent auctions.`,
    `${name} پاکستان کی زرعی منڈیوں میں سے ایک اہم تجارتی مرکز ہے جہاں روزانہ اجناس کی خرید و فروخت اور شفاف بولیاں ہوتی ہیں۔`,
  );

  return (
    <BottomSheet
      onClose={onClose}
      title={f.tx(`${name} Mandi`, `${name} منڈی`)}
      subtitle={subtitle}
      revealHeader
      dir={f.dir}
      font={f.font}
      display={f.display}
      action={
        <IconButton
          label={f.tx("Mandi Information & Wikipedia", "منڈی کی معلومات اور پس منظر")}
          onClick={() => setShowInfo((v) => !v)}
          active={showInfo}
          activeBg={C.brandTint}
          activeBorder={C.brandBorder}
        >
          <Icon name="info" size={19} color={showInfo ? C.brand : C.ink2} width={showInfo ? 2.5 : 2.2} />
        </IconButton>
      }
      footer={
        <>
          <button
            type="button"
            aria-label={f.tx("Hear this rate", "یہ ریٹ سنیں")}
            onClick={() => onListen(spoken)}
            style={{ width: 52, height: 52, borderRadius: 16, border: `1px solid ${C.line}`, background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <Icon name="speaker" size={22} color={C.brand} />
          </button>
          <button
            type="button"
            onClick={onSetLocation}
            style={{ flex: 1, height: 52, borderRadius: 16, border: "none", background: C.brand, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: f.font }}
          >
            {f.tx("Show this mandi at the top", "اس منڈی کو اوپر دکھائیں")}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Mandi Wikipedia / Location Details card */}
        {showInfo && (
          <div
            style={{
              borderRadius: 22,
              background: "#F0FDF4",
              border: `1.5px solid #BBF7D0`,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 4px 16px rgba(22, 101, 52, 0.08)",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: "#DCFCE7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.brand,
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  ℹ
                </span>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#14532D", fontFamily: f.display }}>
                    {f.tx(`About ${stripMandi(mandiName)} Mandi`, `${name} منڈی کا تعارف و پس منظر`)}
                  </span>

                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                style={{
                  border: "none",
                  background: "#DCFCE7",
                  color: "#166534",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                {f.tx("Hide", "چھپائیں")}
              </button>
            </div>

            <p
              style={{
                fontSize: 13.5,
                lineHeight: f.ur ? 1.9 : 1.55,
                color: "#1F2937",
                margin: 0,
                padding: "10px 12px",
                background: "rgba(255, 255, 255, 0.85)",
                borderRadius: 14,
                borderLeft: f.ur ? undefined : `3px solid ${C.brand}`,
                borderRight: f.ur ? `3px solid ${C.brand}` : undefined,
              }}
            >
              {mandiMeta?.agriProfile || defaultProfile}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255, 255, 255, 0.75)", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{f.tx("Major Crops", "اہم فصلیں")}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1F2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {mandiMeta?.commodities?.map((c) => t(c)).join("، ") || f.tx("Wheat, Grains", "گندم، اجناس")}
                </span>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255, 255, 255, 0.75)", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{f.tx("Region", "ڈسٹرکٹ / صوبہ")}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1F2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {place?.district || mandiMeta?.district || "—"}, {place?.province || mandiMeta?.province || "Punjab"}
                </span>
              </div>
            </div>
          </div>
        )}
        <div style={{ borderRadius: 22, background: C.surface, border: `1px solid ${C.line}`, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>
                <span style={{ color: C.ink, fontWeight: 700 }}>{shortRate(tr(rate))}</span> · {f.tx("per 40 kg", "فی 40 کلو")}
              </span>
              <span style={{ fontFamily: f.display, fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: f.ur ? 1.8 : 1.1, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
                {s.min > 0 ? `${f.rs(s.min)} – ${f.num(s.max)}` : "—"}
              </span>
            </div>
            {change !== null && <ChangePill value={change} text={Math.abs(change) < 0.05 ? f.tx("No change", "کوئی تبدیلی نہیں") : `${arrow(change)} ${f.pct(change)}`} />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {box(
              prevDate ? f.tx(`vs ${f.day(prevDate)}`, `بمقابلہ ${f.day(prevDate)}`) : f.tx("vs Yesterday", "گزشتہ کل سے"),
              diffYesterday !== null ? `${diffYesterday >= 0 ? "+" : "−"}${f.rs(Math.abs(diffYesterday))}` : "—",
              diffYesterday !== null ? (diffYesterday > 0 ? C.up : diffYesterday < 0 ? C.down : C.ink) : C.ink,
            )}
            {box(f.tx("Today's Mandi Rank", "آج کی منڈی رینک"), rank > 0 && mids.length > 1 ? f.tx(`${rank} of ${mids.length}`, `${f.digits(mids.length)} میں ${f.digits(rank)}`) : f.tx("Only one", "واحد"))}
          </div>
          {/* Swipe between the trend charts and a day-by-day table. */}
          <div role="tablist" aria-label={f.tx("Trend or table", "رجحان یا ٹیبل")} style={{ display: "flex", gap: 16, borderBottom: `1px solid ${C.lineSoft}` }}>
            {[f.tx("Trend", "رجحان"), f.tx("History", "تاریخ وار")].map((label, i) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={page === i}
                onClick={() => goToPage(i)}
                style={{ padding: "4px 2px 7px", border: "none", background: "transparent", fontFamily: f.font, fontSize: 13.5, fontWeight: 700, color: page === i ? C.brandDeep : C.muted, borderBottom: `2.5px solid ${page === i ? C.brand : "transparent"}`, marginBottom: -1 }}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            ref={pager}
            className="zm-hide-scrollbar"
            onScroll={(e) => {
              const el = e.currentTarget;
              const next = Math.round(Math.abs(el.scrollLeft) / Math.max(el.clientWidth, 1));
              if (next !== page) setPage(next);
            }}
            style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", overscrollBehaviorX: "contain" }}
          >
            <section aria-label={f.tx("Trend", "رجحان")} style={{ flex: "0 0 100%", minWidth: 0, scrollSnapAlign: "start", display: "flex", flexDirection: "column", gap: 10 }}>
              <Segmented
                label={f.tx("Chart", "چارٹ")}
                value={view}
                onChange={setView}
                font={f.font}
                options={[
                  { id: "price", label: f.tx("Price trend", "قیمت کا رجحان"), color: C.brand },
                  { id: "arrival", label: f.tx("Arrival trend", "آمد کا رجحان"), color: C.arrival },
                ]}
              />
              <div role="group" aria-label={f.tx("Period", "مدت")} style={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                {pickerOpen && (
                  <RangeSheet
                    f={f}
                    dates={reportDays}
                    value={custom || { start: reportDays[Math.max(0, reportDays.length - 21)], end: reportDays[reportDays.length - 1] }}
                    onClose={() => setPickerOpen(false)}
                    onApply={(r) => {
                      setCustom(r);
                      setRange("CUSTOM");
                    }}
                  />
                )}
                {SHEET_RANGES.map((r) => {
                  const on = range === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setRange(r.id)}
                      style={{ height: 27, minWidth: 25, padding: "0 4px", border: "none", borderRadius: 13, fontSize: 11.5, fontWeight: 600, fontFamily: f.font, background: on ? C.ink : "transparent", color: on ? "#FFFFFF" : C.muted, flexShrink: 0 }}
                    >
                      {f.tx(r.en, r.ur)}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={range === "CUSTOM"}
                  aria-label={f.tx("Custom period", "مخصوص مدت")}
                  title={f.tx("Custom period", "مخصوص مدت")}
                  onClick={() => setPickerOpen(true)}
                  style={{ width: 26, height: 27, border: "none", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", background: range === "CUSTOM" ? C.ink : "transparent", flexShrink: 0 }}
                >
                  <Icon name="calendar" size={14} width={2.2} color={range === "CUSTOM" ? "#FFFFFF" : C.muted} />
                </button>
              </div>
              {isCustom && (
                <span style={{ marginTop: -4, fontSize: 12, fontWeight: 600, color: C.muted, textAlign: "end" }}>
                  {`${f.day(custom!.start)} – ${f.day(custom!.end)}`}
                </span>
              )}
              {range === "1D" ? (
                <IntradayChart
                  key={`${date}|${view}|${rate}`}
                  f={f}
                  height={170}
                  unit={view === "price" ? "rupees" : "bags"}
                  color={view === "price" ? C.brand : C.arrival}
                  points={intraday}
                  ariaLabel={f.tx(`${f.day(date, true)} on a 24-hour axis`, `${f.day(date, true)}، 24 گھنٹے کے محور پر`)}
                />
              ) : view === "price" ? (
                <TrendChart
                  key={`p|${range}|${custom?.start}|${custom?.end}`}
                  f={f}
                  height={170}
                  dates={winDates}
                  connectGaps
                  hideSlider
                  tooltip={(k) => (series.lo[winStart + k] > 0 ? { title: f.day(winDates[k], true), value: `${f.num(series.lo[winStart + k])}–${f.num(series.hi[winStart + k])}` } : null)}
                  series={[{ color, values: win(series.mid), lo: win(series.lo), hi: win(series.hi) }]}
                  idx={winIdx}
                  yUnit="rupees"
                  ariaLabel={f.tx("Price over the period", "مدت بھر کی قیمت")}
                />
              ) : (
                <TrendChart
                  key={`a|${range}|${custom?.start}|${custom?.end}`}
                  f={f}
                  height={170}
                  dates={winDates}
                  series={[]}
                  bars={win(series.arr)}
                  barsOnly
                  hideSlider
                  idx={winIdx}
                  yUnit="bags"
                  ariaLabel={f.tx("Arrivals over the period", "مدت بھر کی آمد")}
                />
              )}
            </section>
            <section aria-label={f.tx("History", "تاریخ وار")} style={{ flex: "0 0 100%", minWidth: 0, scrollSnapAlign: "start" }}>
              {history.length === 0 ? (
                <p style={{ margin: 0, padding: "24px 4px", textAlign: "center", fontSize: 13, color: C.muted }}>{f.tx("No earlier reports for this rate.", "اس ریٹ کی کوئی پچھلی رپورٹ نہیں۔")}</p>
              ) : (
                <div className="zm-hide-scrollbar" style={{ maxHeight: 214, overflowY: "auto", scrollbarWidth: "none" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontFamily: f.font }}>
                    <thead>
                      <tr>
                        <th style={TH}>{f.tx("Date", "تاریخ")}</th>
                        <th style={TH}>{f.tx("Min", "کم")}</th>
                        <th style={TH}>{f.tx("Max", "زیادہ")}</th>
                        <th style={TH}>{f.tx("Change", "تبدیلی")}</th>
                        <th style={TH}>{f.tx("Arrival", "آمد")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.d} style={{ borderBottom: `1px solid ${C.lineSoft}`, background: h.d === date ? C.brandTint : undefined }}>
                          <td style={{ ...TD, color: C.ink2 }}>{h.d.slice(0, 4) === date.slice(0, 4) ? f.day(h.d) : `${f.day(h.d)} '${f.digits(h.d.slice(2, 4))}`}</td>
                          <td style={TD}>{f.num(h.min)}</td>
                          <td style={TD}>{f.num(h.max)}</td>
                          <td style={{ ...TD, color: h.change === null ? C.faint : h.change > 0 ? C.up : h.change < 0 ? C.down : C.muted }}>
                            {h.change === null ? "—" : `${arrow(h.change)} ${f.pct(h.change)}`}
                          </td>
                          <td style={{ ...TD, color: h.arrival > 0 ? C.arrival : C.faint }}>{h.arrival > 0 ? f.num(h.arrival) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
          <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1].map((i) => (
              <span key={i} style={{ width: page === i ? 18 : 6, height: 6, borderRadius: 3, background: page === i ? C.brand : C.line, transition: "width 200ms" }} />
            ))}
          </div>
        </div>

        {tradedFields.length > 0 && (
          <div style={{ borderRadius: 22, background: C.surface, border: `1px solid ${C.line}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 6px", fontFamily: f.display, fontSize: 16, fontWeight: 700 }}>{f.tx("Attributes", "خصوصیات")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              {tradedFields.map((it) => (
                <div key={it.label} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 16px", borderTop: `1px solid ${C.lineSoft}` }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: C.muted }}>{it.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{it.vals.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
