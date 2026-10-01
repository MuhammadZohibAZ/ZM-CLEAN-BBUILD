import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { TimelineResult } from "../../../data/realCommodityData";
import { ALL_RATE_TYPES } from "../../shared/data/rates";
import { arrow, shortRate, signed, stripMandi, type Fmt } from "./format";
import { PickerSheet } from "./PickerSheet";
import { RangeSheet } from "./RangeSheet";
import { CandleChart, type CandleData } from "./CandleChart";
import { DK, type ActiveAttrBadge } from "./PriceHero";
import { ALL_RATES, passesFilters, statsFor } from "./selectors";
import { Sparkline } from "./Sparkline";
import { C, COMPARE_TONES, PROVINCES } from "./theme";
import { TrendChart, type Series } from "./TrendChart";
import { IntradayChart, type IntradayPoint } from "./IntradayChart";
import type { AttrFilters, MarketRow } from "./types";
import { Card, Icon, Segmented, useCountUp } from "./ui";
import { TIMELINE } from "./useMarketData";

// 1D shows the same two weeks as 2W (so any bar can be picked) but its
// High / Low / Average are for the selected day only.
type Range = "1D" | "1W" | "2W" | "1M" | "6M" | "1Y" | "CUSTOM";
const RANGE_DAYS: Record<Exclude<Range, "CUSTOM">, number> = { "1D": 14, "1W": 7, "2W": 14, "1M": 30, "6M": 182, "1Y": 365 };
const isPriceMode = (m: "price" | "arrival") => m === "price";
const MAX_COMPARE = 4;
const MOVERS = 5;

/**
 * How rates and arrivals moved over the reported period.
 * Only ranges backed by real reports are offered (the old 15m / 1h / 4h
 * all drew the same month, and 3M / 6M / 1Y were invented curves).
 */
export function TrendsTab({
  f,
  tr,
  tm,
  lang,
  timelines,
  allRows,
  initialRate,
  filters = {},
  scopeProvinceFilter,
  onOpenMandi,
  locationLabel,
  onOpenLocation,
  activeAttrs,
}: {
  f: Fmt;
  tr: (s: string) => string;
  tm: (s: string) => string;
  lang: "en" | "ur";
  timelines: Record<string, TimelineResult>;
  allRows: MarketRow[];
  initialRate: string;
  filters?: AttrFilters;
  scopeProvinceFilter: (r: MarketRow) => boolean;
  onOpenMandi?: (mandi: string, rate: string) => void;
  locationLabel: string;
  onOpenLocation: () => void;
  activeAttrs?: ActiveAttrBadge[];
}) {
  const withData = useMemo(() => ALL_RATE_TYPES.filter((rt) => timelines[rt]?.prices.some((p) => p > 0)), [timelines]);
  const [mode, setMode] = useState<"price" | "arrival">("price");
  const [focus, setFocus] = useState(initialRate);
  const [compare, setCompare] = useState(false);
  const [set, setSet] = useState<string[]>([initialRate === ALL_RATES ? ALL_RATE_TYPES[0] : initialRate]);
  const [range, setRange] = useState<Range>("2W");
  const [custom, setCustom] = useState({ start: TIMELINE[Math.max(0, TIMELINE.length - 21)], end: TIMELINE[TIMELINE.length - 1] });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerOpenRate, setPickerOpenRate] = useState(false);
  const [idx, setIdx] = useState<number | null>(null);
  const [moverSide, setMoverSide] = useState<"up" | "down">("up");
  const chartRef = useRef<HTMLDivElement | null>(null);
  // Bring the chart back into view (only if it has scrolled off) so a tap in
  // the list below visibly updates it.
  const showChart = () => {
    const el = chartRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 90) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => setFocus(initialRate), [initialRate]);

  // Window over the timeline. 1W / 2W can be dragged back in time (Binance
  // style): `offset` = how many days the window is shifted into the past.
  // One window over the timeline: `span` visible days, shifted `offset` days
  // into the past. Period tabs set it; drag pans it, pinch/wheel zooms it.
  const [offset, setOffset] = useState(0);
  const [spanState, setSpanState] = useState(14);
  const [chartType, setChartType] = useState<"line" | "candles">("line");
  const TL = TIMELINE.length;
  const MIN_SPAN = Math.min(5, TL);
  useEffect(() => {
    if (range === "CUSTOM") {
      const s = Math.max(0, TIMELINE.indexOf(custom.start));
      const e = TIMELINE.indexOf(custom.end) >= 0 ? TIMELINE.indexOf(custom.end) + 1 : TL;
      setSpanState(Math.max(2, e - s));
      setOffset(TL - e);
    } else {
      setSpanState(Math.min(TL, RANGE_DAYS[range]));
      setOffset(0);
    }
  }, [range, custom, TL]);
  const span = Math.max(MIN_SPAN, Math.min(TL, spanState));
  const maxOffset = Math.max(0, TL - span);
  const off = Math.max(0, Math.min(maxOffset, offset));
  const start = TL - off - span;
  const end = TL - off;
  const dates = TIMELINE.slice(start, end);
  const len = dates.length;
  const i = idx === null || idx >= len ? len - 1 : idx;
  // Keep the picked day when only switching between 2W and 1D (same window).
  const prevRange = useRef(range);
  useEffect(() => {
    const sameWindow = (a: Range, b: Range) => (a === "1D" || a === "2W") && (b === "1D" || b === "2W");
    if (!sameWindow(prevRange.current, range)) setIdx(null);
    prevRange.current = range;
  }, [range]);
  useEffect(() => setIdx(null), [custom, mode]);
  const panDays = (d: number) => setOffset((o) => Math.max(0, Math.min(maxOffset, o + d)));
  const setSpanKeepRight = (s: number) => setSpanState(Math.max(MIN_SPAN, Math.min(TL, s)));
  const canPan = maxOffset > 0;

  const slice = (a: number[]) => a.slice(start, end);
  // Days that actually have reports (the custom-range picker only offers these).
  const reportDays = useMemo(() => {
    const has = new Set(allRows.map((r) => r.date));
    const days = TIMELINE.filter((d) => has.has(d));
    return days.length ? days : TIMELINE;
  }, [allRows]);
  // "All rates" = the same pooled average the Overview headline uses
  // (every report that day), so both tabs show the same number.
  const allIndex = useMemo(() => {
    const byDay = new Map<string, MarketRow[]>();
    for (const r of allRows) {
      if (!scopeProvinceFilter(r)) continue;
      if (!passesFilters(r, filters, ALL_RATES)) continue;
      const list = byDay.get(r.date);
      if (list) list.push(r);
      else byDay.set(r.date, [r]);
    }
    const st = TIMELINE.map((d) => statsFor(byDay.get(d) || []));
    return { prices: st.map((x) => x.mid), mins: st.map((x) => x.min), maxs: st.map((x) => x.max) };
  }, [allRows, scopeProvinceFilter, filters]);

  const tl = (rt: string) => {
    if (rt === ALL_RATES) return allIndex;
    const hasQuality = Object.values(filters || {}).some(Boolean);
    if (!hasQuality && timelines[rt]) return timelines[rt];
    const byDay = new Map<string, MarketRow[]>();
    for (const r of allRows) {
      if (!scopeProvinceFilter(r)) continue;
      if (r.rateType !== rt) continue;
      if (!passesFilters(r, filters, rt)) continue;
      const list = byDay.get(r.date);
      if (list) list.push(r);
      else byDay.set(r.date, [r]);
    }
    const st = TIMELINE.map((d) => statsFor(byDay.get(d) || []));
    return {
      prices: st.map((x) => x.mid),
      mins: st.map((x) => x.min),
      maxs: st.map((x) => x.max),
      arrivals: TIMELINE.map((d) => (byDay.get(d) || []).reduce((s, x) => s + x.arrival, 0)),
    };
  };

  const shown = compare ? set : [focus];
  const tone = (rt: string) => (compare ? COMPARE_TONES[Math.max(0, set.indexOf(rt)) % COMPARE_TONES.length] : C.brand);
  const series: Series[] = shown.map((rt) => ({
    color: tone(rt),
    values: slice(tl(rt).prices),
    ...(compare ? {} : { lo: slice(tl(rt).mins), hi: slice(tl(rt).maxs) }),
  }));
  const arrivals = useMemo(
    () => TIMELINE.map((_, d) => ALL_RATE_TYPES.reduce((s, rt) => s + (timelines[rt]?.arrivals[d] || 0), 0)),
    [timelines],
  );
  const arr = slice(arrivals);

  // ── Candle series over the FULL timeline (so opens and MAs at the window's
  // left edge use earlier days), then sliced to the visible window.
  const candleFull = useMemo(() => {
    const t = focus === ALL_RATES ? allIndex : timelines[focus] || { prices: [], mins: [], maxs: [] };
    const close = TIMELINE.map((_, d) => t.prices[d] || 0);
    const open = close.map((_, d) => {
      for (let k = d - 1; k >= 0; k--) if (close[k] > 0) return close[k];
      return 0;
    });
    const ma = (N: number) =>
      close.map((_, d) => {
        const win = close.slice(Math.max(0, d - N + 1), d + 1).filter((v) => v > 0);
        return close[d] > 0 && win.length >= Math.ceil(N / 2) ? win.reduce((a, b) => a + b, 0) / win.length : 0;
      });
    let latest = 0;
    for (let k = close.length - 1; k >= 0; k--) if (close[k] > 0) { latest = close[k]; break; }
    return {
      close,
      open,
      high: TIMELINE.map((_, d) => t.maxs[d] || 0),
      low: TIMELINE.map((_, d) => t.mins[d] || 0),
      ma7: ma(7),
      ma14: ma(14),
      latest,
    };
  }, [focus, allIndex, timelines]);
  const candleData: CandleData = {
    dates,
    open: slice(candleFull.open),
    high: slice(candleFull.high),
    low: slice(candleFull.low),
    close: slice(candleFull.close),
    vol: arr,
    ma7: slice(candleFull.ma7),
    ma14: slice(candleFull.ma14),
  };
  const latestClose = candleFull.latest;
  const showCandles = isPriceMode(mode) && chartType === "candles" && !compare;

  // ── Header numbers ──
  const main = tl(shown[0]);
  const mins = slice(main.mins);
  const maxs = slice(main.maxs);
  const prices = slice(main.prices);
  const firstIdx = prices.findIndex((p) => p > 0);
  const first = firstIdx >= 0 ? prices[firstIdx] : 0;
  
  const activePrice = useMemo(() => {
    if (prices[i] > 0) return prices[i];
    let prevK = -1;
    for (let p = i - 1; p >= 0; p--) if (prices[p] > 0) { prevK = p; break; }
    let nextK = -1;
    for (let p = i + 1; p < prices.length; p++) if (prices[p] > 0) { nextK = p; break; }
    if (prevK >= 0 && nextK >= 0) {
      return Math.round(prices[prevK] + (prices[nextK] - prices[prevK]) * ((i - prevK) / (nextK - prevK)));
    }
    if (prevK >= 0) return prices[prevK];
    if (nextK >= 0) return prices[nextK];
    return 0;
  }, [prices, i]);

  const pct = first > 0 && activePrice > 0 ? ((activePrice - first) / first) * 100 : 0;
  const absChange = first > 0 && activePrice > 0 ? activePrice - first : 0;
  const valid = prices.map((p, k) => ({ p, k })).filter((o) => o.p > 0);
  const hiO = valid.reduce((a, b) => (b.p > a.p ? b : a), valid[0] || { p: 0, k: 0 });
  const loO = valid.reduce((a, b) => (b.p < a.p ? b : a), valid[0] || { p: 0, k: 0 });
  const avgP = valid.length ? valid.reduce((a, b) => a + b.p, 0) / valid.length : 0;
  const totalArr = arr.reduce((a, b) => a + b, 0);
  const peakArr = Math.max(...arr, 0);
  const arrDays = arr.filter((a) => a > 0).length;
  const arrPct = i > 0 && arr[i - 1] > 0 ? ((arr[i] - arr[i - 1]) / arr[i - 1]) * 100 : 0;
  const isPrice = mode === "price";
  const hasPrice = valid.length > 0;
  const headValue = useCountUp(isPrice ? activePrice : arr[i] || 0);

  // 1D: the selected day's reports on a 24-hour axis. Reports carrying a time
  // are placed at it; otherwise the day's figure is one bar at the day close.
  const intraday = useMemo<IntradayPoint[]>(() => {
    if (range !== "1D") return [];
    const day = dates[i];
    const rows = allRows.filter(
      (r) =>
        r.date === day &&
        scopeProvinceFilter(r) &&
        (isPrice ? focus === ALL_RATES || r.rateType === focus : true) &&
        passesFilters(r, filters, isPrice ? focus : ALL_RATES),
    );
    const timed = rows.filter((r) => r.reportedAt);
    if (timed.length) {
      const byMinute = new Map<number, MarketRow[]>();
      for (const r of timed) {
        const [h, m] = r.reportedAt!.split(":").map(Number);
        const k = h * 60 + m;
        const list = byMinute.get(k);
        if (list) list.push(r);
        else byMinute.set(k, [r]);
      }
      return [...byMinute].map(([minute, list]) => {
        const st = statsFor(list);
        return isPrice
          ? { minute, value: st.mid, lo: st.min, hi: st.max }
          : { minute, value: list.reduce((s, x) => s + x.arrival, 0) };
      });
    }
    return isPrice
      ? [{ minute: null, value: prices[i] || 0, lo: mins[i], hi: maxs[i] }]
      : [{ minute: null, value: arr[i] || 0 }];
  }, [range, dates, i, allRows, scopeProvinceFilter, isPrice, focus, filters, prices, mins, maxs, arr]);

  // ── Records in range + location (for movers and province split) ──
  const inRange = useMemo(() => new Set(dates), [dates]);
  const rangeRows = useMemo(
    () => allRows.filter((r) => inRange.has(r.date) && scopeProvinceFilter(r) && passesFilters(r, filters, ALL_RATES)),
    [allRows, inRange, scopeProvinceFilter, filters],
  );

  const provArr = PROVINCES.map((p) => ({ p, v: rangeRows.filter((r) => r.province === p).reduce((a, r) => a + r.arrival, 0) })).filter((o) => o.v > 0);
  const provTotal = provArr.reduce((a, o) => a + o.v, 0);

  // Station-wise arrivals inside each province (same rows and period), shown
  // when a province row is expanded.
  const [openProv, setOpenProv] = useState<string | null>(null);
  const stationsByProv = useMemo(() => {
    const out = new Map<string, { name: string; v: number }[]>();
    const sums = new Map<string, Map<string, number>>();
    for (const r of rangeRows) {
      if (!(r.arrival > 0)) continue;
      const name = stripMandi(r.mandiName) || r.district || "—";
      const m = sums.get(r.province) ?? new Map<string, number>();
      m.set(name, (m.get(name) ?? 0) + r.arrival);
      sums.set(r.province, m);
    }
    for (const [prov, m] of sums) out.set(prov, [...m].map(([name, v]) => ({ name, v })).sort((a, b) => b.v - a.v));
    return out;
  }, [rangeRows]);

  // Top movers: first vs last report in the range, per mandi + rate type.
  const movers = useMemo(() => {
    const rateFilter = compare || focus === ALL_RATES ? null : focus;
    const groups = new Map<string, { mandi: string; rate: string; district: string; province: string; byDay: Map<string, number[]> }>();
    for (const r of rangeRows) {
      if (rateFilter && r.rateType !== rateFilter) continue;
      const mid = r.min > 0 && r.max > 0 ? (r.min + r.max) / 2 : r.min || r.max;
      if (!mid) continue;
      const k = `${r.mandiName}|${r.rateType}`;
      const g = groups.get(k) || { mandi: r.mandiName, rate: r.rateType, district: r.district, province: r.province, byDay: new Map() };
      g.byDay.set(r.date, [...(g.byDay.get(r.date) || []), mid]);
      groups.set(k, g);
    }
    const out: { mandi: string; rate: string; district: string; province: string; pct: number; last: number; spark: number[] }[] = [];
    for (const g of groups.values()) {
      const spark = dates.map((d) => {
        const v = g.byDay.get(d);
        return v && v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
      });
      const pts = spark.filter((v) => v > 0);
      if (pts.length < 2) continue;
      const p = ((pts[pts.length - 1] - pts[0]) / pts[0]) * 100;
      if (Math.abs(p) < 0.05) continue;
      out.push({ mandi: g.mandi, rate: g.rate, district: g.district && stripMandi(g.mandi).toLowerCase() !== g.district.toLowerCase() ? g.district : g.province, province: g.province, pct: p, last: pts[pts.length - 1], spark });
    }
    return out;
  }, [rangeRows, dates, compare, focus]);
  const gainers = movers.filter((m) => m.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, MOVERS);
  const losers = movers.filter((m) => m.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, MOVERS);
  const moverList = moverSide === "up" ? gainers : losers;

  const rangeLabel: Record<Range, string> = {
    "1D": f.tx("1D", "۱د"),
    "1W": f.tx("1W", "۱ہ"),
    "2W": f.tx("2W", "۲ہ"),
    "1M": f.tx("1M", "۱م"),
    "6M": f.tx("6M", "۶م"),
    "1Y": f.tx("1Y", "۱س"),
    CUSTOM: f.tx("Custom", "مخصوص"),
  };
  const rateActive = compare || focus !== ALL_RATES;

  const darkStat = (label: string, value: string, sub?: string, color: string = DK.text) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
      <span style={{ fontSize: 11.5, fontWeight: 500, color: DK.faint }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
      {sub && <span style={{ fontSize: 11.5, fontWeight: 500, color: DK.faint }}>{sub}</span>}
    </div>
  );

  const sectionTitle = (title: string, sub?: string, right?: ReactNode) => (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, padding: "22px 16px 10px" }}>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: f.ur ? 1.8 : 1.3 }}>{title}</h3>
        {sub && <span style={{ fontSize: 12.5, fontWeight: 500, color: C.muted, lineHeight: f.lh }}>{sub}</span>}
      </div>
      {right}
    </div>
  );

  return (
    <div style={{ paddingBottom: 32 }}>
      {pickerOpen && (
        <RangeSheet
          f={f}
          dates={reportDays}
          value={custom}
          onClose={() => setPickerOpen(false)}
          onApply={(r) => {
            setCustom(r);
            setRange("CUSTOM");
          }}
        />
      )}

      {/* Chart card */}
      <div ref={chartRef} style={{ padding: "12px 16px 0", scrollMarginTop: 8 }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, color: DK.text, background: DK.bg, border: DK.border, boxShadow: DK.shadow }}>
          <div
            aria-hidden="true"
            style={{ position: "absolute", top: -120, insetInlineEnd: -90, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(47,181,138,0.12), rgba(47,181,138,0) 70%)", pointerEvents: "none" }}
          />

          {/* Card top bar: what (price / arrivals) on the left, when (period) on the right */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 12px 0" }}>
            <div role="group" aria-label={f.tx("Chart", "چارٹ")} style={{ display: "flex", padding: 3, borderRadius: 12, background: DK.chip }}>
              {(["price", "arrival"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  style={{
                    height: 28,
                    padding: "0 12px",
                    border: "none",
                    borderRadius: 9,
                    fontSize: 12.5,
                    fontWeight: 600,
                    fontFamily: f.font,
                    background: mode === m ? C.surface : "transparent",
                    color: mode === m ? C.ink : C.muted,
                    boxShadow: mode === m ? "0 1px 3px rgba(15,26,23,0.12)" : "none",
                  }}
                >
                  {m === "price" ? f.tx("Price", "قیمت") : f.tx("Arrivals", "آمد")}
                </button>
              ))}
            </div>
            <div role="group" aria-label={f.tx("Period", "مدت")} style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {(["1D", "1W", "2W", "1M", "6M", "1Y"] as Range[]).map((r) => {
                const on = range === r;
                return (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setRange(r)}
                    style={{
                      height: 28,
                      minWidth: 30,
                      padding: "0 6px",
                      border: "none",
                      borderRadius: 14,
                      fontSize: 12.5,
                      fontWeight: 600,
                      fontFamily: f.font,
                      background: on ? C.ink : "transparent",
                      color: on ? "#FFFFFF" : C.muted,
                    }}
                  >
                    {rangeLabel[r]}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={range === "CUSTOM"}
                aria-label={f.tx("Custom period", "مخصوص مدت")}
                title={f.tx("Custom period", "مخصوص مدت")}
                onClick={() => setPickerOpen(true)}
                style={{
                  width: 30,
                  height: 28,
                  border: "none",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: range === "CUSTOM" ? C.ink : "transparent",
                }}
              >
                <Icon name="calendar" size={15} width={2.2} color={range === "CUSTOM" ? "#FFFFFF" : C.muted} />
              </button>
            </div>
          </div>

          {isPrice && !hasPrice ? (
            <p style={{ position: "relative", margin: "28px 16px", textAlign: "center", fontSize: 14, fontWeight: 500, color: DK.sub, lineHeight: f.lh }}>
              {f.tx("No price reports for this rate type and place yet.", "اس ریٹ اور مقام کی ابھی کوئی رپورٹ نہیں۔")}
            </p>
          ) : (
            <>
              <div style={{ position: "relative", padding: "10px 16px 0", display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: DK.sub, lineHeight: f.lh, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isPrice
                      ? compare
                        ? f.tx(`${shortRate(tr(set[0]))} · average per 40 kg`, `${shortRate(tr(set[0]))} · اوسط فی ۴۰ کلو`)
                        : `${focus === ALL_RATES ? f.tx("All rates", "تمام ریٹ") : shortRate(tr(focus))} · ${f.tx("average per 40 kg", "اوسط فی ۴۰ کلو")}`
                      : f.tx("Arrivals · all rate types", "آمد · تمام ریٹ")}
                  </span>
                  {isPrice && !compare && (
                    <div role="group" aria-label={f.tx("Chart type", "چارٹ کی قسم")} style={{ display: "flex", gap: 2, padding: 2, borderRadius: 10, background: DK.chip, flexShrink: 0 }}>
                      {(["line", "candles"] as const).map((t) => {
                        const on = chartType === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={on}
                            aria-label={t === "line" ? f.tx("Line chart", "لائن چارٹ") : f.tx("Candle chart", "کینڈل چارٹ")}
                            title={t === "line" ? f.tx("Line", "لائن") : f.tx("Candles", "کینڈل")}
                            onClick={() => setChartType(t)}
                            style={{
                              width: 32,
                              height: 26,
                              border: "none",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: on ? C.surface : "transparent",
                              boxShadow: on ? "0 1px 3px rgba(15,26,23,0.12)" : "none",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on ? C.ink : C.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              {t === "line" ? (
                                <path d="M3 17l5-6 4 3 8-9" />
                              ) : (
                                <path d="M7 3v4 M7 17v4 M5 7h4v10H5z M17 3v6 M17 17v4 M15 9h4v8h-4z" />
                              )}
                            </svg>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: f.ur ? 26 : 30, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: f.ur ? 1.7 : 1.1, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
                    {isPrice ? (prices[i] > 0 ? f.rs(headValue) : "—") : `${f.num(headValue)}`}
                    {!isPrice && <span style={{ fontSize: 15, fontWeight: 600, color: DK.sub }}> {f.tx("bags", "بوریاں")}</span>}
                  </span>
                  {(isPrice ? prices[i] > 0 : true) && (
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate",
                        color: signed(isPrice ? pct : arrPct) > 0 ? DK.up : signed(isPrice ? pct : arrPct) < 0 ? DK.down : DK.sub,
                      }}
                    >
                      {arrow(isPrice ? pct : arrPct)} {isPrice ? `${absChange >= 0 ? "+" : "−"}${f.num(Math.abs(absChange))} ` : ""}({f.pct(isPrice ? pct : arrPct)})
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: DK.faint, lineHeight: f.lh }}>
                  {f.dayFullWeekdayYear(dates[i])}
                </span>
                {activeAttrs && activeAttrs.length > 0 && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                    {activeAttrs.map((attr) => (
                      <span
                        key={`${attr.key}-${attr.value}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 7.5px",
                          borderRadius: 7,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "rgba(245, 158, 11, 0.12)",
                          color: "#D97706",
                          border: "1px solid rgba(245, 158, 11, 0.28)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span>{attr.display}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isPrice && compare && (
                <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "6px 14px", padding: "10px 16px 0" }}>
                  {set.map((rt) => {
                    const v = slice(tl(rt).prices)[i];
                    return (
                      <span key={rt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 12, height: 3, borderRadius: 2, background: tone(rt) }} />
                        {shortRate(tr(rt))}
                        <span style={{ color: DK.sub, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>{v > 0 ? f.num(v) : "—"}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              <div style={{ position: "relative", padding: "6px 4px 0" }}>
                {/* Pan state: where you are in the history */}
                {canPan && (off > 0 || off >= maxOffset) && (
                  <div style={{ position: "absolute", top: 8, insetInlineStart: 12, insetInlineEnd: 56, zIndex: 4, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: C.muted, padding: "3px 8px", borderRadius: 8, background: "rgba(255,255,255,0.85)", visibility: off >= maxOffset ? "visible" : "hidden" }}>
                      {f.tx("Start of reports", "رپورٹس کا آغاز")}
                    </span>
                    {off > 0 && (
                      <button
                        type="button"
                        onClick={() => setOffset(0)}
                        style={{ pointerEvents: "auto", height: 26, padding: "0 10px", borderRadius: 13, border: "none", background: C.ink, color: "#fff", fontSize: 12.5, fontWeight: 600, fontFamily: f.font, display: "flex", alignItems: "center", gap: 4 }}
                      >
                        {f.tx("Latest", "تازہ ترین")} {f.ur ? "‹" : "›"}
                      </button>
                    )}
                  </div>
                )}
                {range === "1D" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      {[-1, 1].map((step) => {
                        const back = step < 0;
                        const can = back ? i > 0 || off < maxOffset : i < len - 1 || off > 0;
                        const go = () => {
                          if (back) {
                            if (i > 0) setIdx(i - 1);
                            else panDays(1);
                          } else if (i < len - 1) setIdx(i + 1);
                          else panDays(-1);
                        };
                        const btn = (
                          <button
                            key={step}
                            type="button"
                            disabled={!can}
                            onClick={go}
                            aria-label={back ? f.tx("Previous day", "پچھلا دن") : f.tx("Next day", "اگلا دن")}
                            style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${C.line}`, background: C.surface, color: can ? C.ink : C.faint, fontSize: 16, fontWeight: 700, opacity: can ? 1 : 0.5 }}
                          >
                            {(back ? !f.ur : f.ur) ? "‹" : "›"}
                          </button>
                        );
                        return back ? (
                          <span key="b" style={{ display: "contents" }}>
                            {btn}
                            <span style={{ minWidth: 120, textAlign: "center", fontSize: 13, fontWeight: 700, color: C.ink }}>{f.day(dates[i], true)}</span>
                          </span>
                        ) : (
                          btn
                        );
                      })}
                    </div>
                    <IntradayChart
                      key={`${dates[i]}|${mode}|${focus}`}
                      f={f}
                      unit={isPrice ? "rupees" : "bags"}
                      color={C.brand}
                      points={intraday}
                      ariaLabel={f.tx("The selected day on a 24-hour axis", "منتخب دن ۲۴ گھنٹے کے محور پر")}
                    />
                  </div>
                ) : isPrice && chartType === "candles" && !compare ? (
                  <CandleChart
                    f={f}
                    data={candleData}
                    latestClose={latestClose}
                    idx={idx !== null && idx < len ? idx : null}
                    onIdx={setIdx}
                    span={span}
                    onSpan={setSpanKeepRight}
                    onPanDays={canPan ? panDays : undefined}
                    animKey={`${range}|${focus}|${custom.start}|${custom.end}`}
                    height={290}
                  />
                ) : isPrice ? (
                  <TrendChart
                    f={f}
                    hideSlider
                    height={210}
                    dates={dates}
                    series={series}
                    bars={compare ? undefined : arr}
                    connectGaps={true}
                    candles={chartType === "candles" && !compare}
                    onPanDays={canPan ? panDays : undefined}
                    animKey={`${range}|${focus}|${compare}|${set.join(",")}|${chartType}|${custom.start}|${custom.end}`}
                    idx={i}
                    onIdx={setIdx}
                    yUnit="rupees"
                    tooltip={(k) => {
                      if (prices[k] > 0) {
                        return {
                          title: f.day(dates[k], true),
                          value: chartType === "candles" && !compare && mins[k] > 0 ? `${f.num(mins[k])}–${f.num(maxs[k])}` : f.rs(prices[k]),
                        };
                      }
                      let prevK = -1;
                      for (let p = k - 1; p >= 0; p--) if (prices[p] > 0) { prevK = p; break; }
                      let nextK = -1;
                      for (let p = k + 1; p < prices.length; p++) if (prices[p] > 0) { nextK = p; break; }
                      if (prevK >= 0 || nextK >= 0) {
                        const refVal = prevK >= 0 && nextK >= 0
                          ? Math.round(prices[prevK] + (prices[nextK] - prices[prevK]) * ((k - prevK) / (nextK - prevK)))
                          : prices[prevK >= 0 ? prevK : nextK];
                        return {
                          title: `${f.day(dates[k], true)} (${f.tx("Est.", "تخمینہ")})`,
                          value: f.rs(refVal),
                        };
                      }
                      return null;
                    }}
                    ariaLabel={f.tx("Price trend. Slide for earlier days, hold to read values.", "قیمت کا رجحان")}
                  />
                ) : (
                  <TrendChart
                    f={f}
                    hideSlider
                    connectGaps={true}
                    onPanDays={canPan ? panDays : undefined}
                    animKey={`arr|${range}|${custom.start}|${custom.end}`}
                    height={210}
                    dates={dates}
                    series={[]}
                    bars={arr}
                    barsOnly
                    idx={i}
                    onIdx={setIdx}
                    yUnit="bags"
                    tooltip={(k) => ({ title: f.day(dates[k], true), value: arr[k] > 0 ? `${f.num(arr[k])} ${f.tx("bags", "بوریاں")}` : f.tx("no report", "رپورٹ نہیں") })}
                    ariaLabel={f.tx("Arrivals trend. Drag to see any day.", "آمد کا رجحان")}
                  />
                )}
              </div>

              <div style={{ position: "relative", display: "flex", gap: 10, padding: "12px 16px 14px", borderTop: `1px solid ${DK.line}` }}>
                {isPrice && range === "1D" ? (
                  <>
                    {/* 1D: the selected day only (highest max, lowest min, average across mandis). */}
                    {(() => {
                      const dayHi = showCandles ? candleData.high[i] : maxs[i];
                      const dayLo = showCandles ? candleData.low[i] : mins[i];
                      const dayAvg = prices[i];
                      const label = f.day(dates[i]);
                      const none = f.tx("no report", "رپورٹ نہیں");
                      return (
                        <>
                          {darkStat(f.tx("High", "زیادہ"), dayHi > 0 ? f.num(dayHi) : "—", dayHi > 0 ? label : none)}
                          {darkStat(f.tx("Low", "کم"), dayLo > 0 ? f.num(dayLo) : "—", dayLo > 0 ? label : none)}
                          {darkStat(f.tx("Average", "اوسط"), dayAvg > 0 ? f.num(dayAvg) : "—", dayAvg > 0 ? label : none)}
                        </>
                      );
                    })()}
                  </>
                ) : !isPrice && range === "1D" ? (
                  <>
                    {darkStat(f.tx("That day", "اس دن"), f.num(arr[i] || 0), f.day(dates[i]))}
                    {darkStat(f.tx("Day before", "پچھلا دن"), i > 0 ? f.num(arr[i - 1] || 0) : "—", i > 0 ? f.day(dates[i - 1]) : undefined)}
                    {darkStat(
                      f.tx("Change", "تبدیلی"),
                      i > 0 && arr[i - 1] > 0 ? `${arrow(arrPct)} ${f.pct(arrPct)}` : "—",
                      f.tx("bags", "بوریاں"),
                    )}
                  </>
                ) : isPrice ? (
                  <>
                    {(() => {
                      // Candle mode: High / Low are the wicks (match the chart's markers).
                      if (!showCandles) return null;
                      let h = -1;
                      let l = -1;
                      candleData.high.forEach((v, k) => v > 0 && (h < 0 || v > candleData.high[h]) && (h = k));
                      candleData.low.forEach((v, k) => v > 0 && (l < 0 || v < candleData.low[l]) && (l = k));
                      return (
                        <>
                          {darkStat(f.tx("High", "زیادہ"), h >= 0 ? f.num(candleData.high[h]) : "—", h >= 0 ? f.day(dates[h]) : undefined)}
                          {darkStat(f.tx("Low", "کم"), l >= 0 ? f.num(candleData.low[l]) : "—", l >= 0 ? f.day(dates[l]) : undefined)}
                        </>
                      );
                    })()}
                    {!showCandles && darkStat(f.tx("High", "زیادہ"), f.num(hiO.p), f.day(dates[hiO.k]))}
                    {!showCandles && darkStat(f.tx("Low", "کم"), f.num(loO.p), f.day(dates[loO.k]))}
                    {darkStat(f.tx("Average", "اوسط"), f.num(avgP), f.tx(`${valid.length} days`, `${f.digits(valid.length)} دن`))}
                  </>
                ) : (
                  <>
                    {darkStat(f.tx("Total", "کل"), f.num(totalArr), f.tx("bags", "بوریاں"))}
                    {darkStat(f.tx("Peak", "زیادہ"), f.num(peakArr), peakArr > 0 ? f.day(dates[arr.indexOf(peakArr)]) : undefined)}
                    {darkStat(f.tx("Daily avg", "روزانہ"), f.num(totalArr / Math.max(arrDays, 1)), f.tx("bags", "بوریاں"))}
                    {darkStat(f.tx("Days", "دن"), f.digits(arrDays), f.tx(`of ${len}`, `${f.digits(len)} میں`))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <p style={{ margin: "8px 4px 0", fontSize: 11.5, fontWeight: 500, color: C.faint, textAlign: "center" }}>
          {range === "1D"
            ? f.tx("Use ‹ › to change the day · bar = when the rate came in", "دن بدلنے کے لیے ‹ › استعمال کریں · بار = ریٹ آنے کا وقت")
            : canPan
            ? f.tx(
                showCandles ? "Drag for earlier days · pinch to zoom · tap for details" : "Drag for earlier days · hold to read values",
                `پچھلے دنوں کے لیے چارٹ کھسکائیں · قیمت دیکھنے کے لیے دبائے رکھیں`,
              )
            : f.tx(
                `Reports ${f.day(TIMELINE[0])} – ${f.day(TIMELINE[TIMELINE.length - 1])} · touch the chart to explore`,
                `رپورٹس ${f.day(TIMELINE[0])} تا ${f.day(TIMELINE[TIMELINE.length - 1])} · کسی دن کے لیے چارٹ پر انگلی پھیریں`,
              )}
        </p>
      </div>

      {/* Rate types side by side */}
      {isPrice && withData.length > 1 && (
        <>
          {sectionTitle(f.tx("Rate types", "ریٹ کی اقسام"), f.tx(`${f.day(dates[i], true)} · tap to chart and filter movers`, `${f.day(dates[i], true)} · چارٹ اور تبدیلی کے لیے دبائیں`))}
          <div style={{ padding: "0 16px" }}>
            <Card style={{ overflow: "hidden" }}>
              {withData.map((rt, k) => {
                const t = timelines[rt];
                const d = start + i;
                const p = t.prices[d];
                const prev = d > 0 ? t.prices[d - 1] : 0;
                const ch = p > 0 && prev > 0 ? ((p - prev) / prev) * 100 : 0;
                const on = !compare && focus === rt;
                return (
                  <button
                    key={rt}
                    type="button"
                    className="zm-row"
                    aria-pressed={on}
                    onClick={() => {
                      setCompare(false);
                      setFocus(rt);
                      showChart();
                    }}
                    style={{
                      width: "100%",
                      minHeight: 58,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "0 16px",
                      border: "none",
                      borderTop: k ? `1px solid ${C.lineSoft}` : "none",
                      background: on ? C.brandTint : C.surface,
                      fontFamily: f.font,
                      color: C.ink,
                    }}
                  >
                    <span style={{ flex: 1, textAlign: "start", fontSize: 15, fontWeight: on ? 700 : 600 }}>{shortRate(tr(rt))}</span>
                    <Sparkline values={slice(t.prices)} tone={p > 0 ? (signed(ch) > 0 ? C.up : signed(ch) < 0 ? C.down : C.faint) : undefined} flip={f.ur} />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, minWidth: 96 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>{t.mins[d] > 0 ? `${f.num(t.mins[d])}–${f.num(t.maxs[d])}` : "—"}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate", color: signed(ch) > 0 ? C.up : signed(ch) < 0 ? C.down : C.faint }}>
                        {p > 0 ? (signed(ch) === 0 ? f.tx("No change", "کوئی تبدیلی نہیں") : `${arrow(ch)} ${f.pct(ch)}`) : ""}
                      </span>
                    </div>
                  </button>
                );
              })}
            </Card>
          </div>
        </>
      )}

      {/* Top movers / Biggest change */}
      {isPrice && movers.length > 0 && (
        <>
          {sectionTitle(
            f.tx("Biggest Change", "سب سے بڑی تبدیلی"),
            f.tx(`${compare || focus === ALL_RATES ? "All rates" : shortRate(tr(focus))} · ${f.day(dates[0])} – ${f.day(dates[len - 1])}`, `${compare || focus === ALL_RATES ? "تمام ریٹ" : shortRate(tr(focus))} · ${f.day(dates[0])} تا ${f.day(dates[len - 1])}`),
            <div style={{ width: 150, flexShrink: 0 }}>
              <Segmented
                label={f.tx("Direction", "سمت")}
                value={moverSide}
                onChange={setMoverSide}
                font={f.font}
                height={28}
                options={[
                  { id: "up", label: f.tx("Gainers", "اضافہ") },
                  { id: "down", label: f.tx("Losers", "کمی") },
                ]}
              />
            </div>,
          )}
          <div style={{ padding: "0 16px" }}>
            <Card style={{ overflow: "hidden" }}>
              {moverList.length === 0 ? (
                <p style={{ margin: 0, padding: 20, textAlign: "center", fontSize: 13, fontWeight: 500, color: C.muted }}>
                  {moverSide === "up" ? f.tx("No mandi rose in this period.", "اس مدت میں کسی منڈی میں اضافہ نہیں۔") : f.tx("No mandi fell in this period.", "اس مدت میں کسی منڈی میں کمی نہیں۔")}
                </p>
              ) : (
                moverList.map((m, k) => (
                  <button
                    key={`${m.mandi}|${m.rate}`}
                    type="button"
                    onClick={() => onOpenMandi?.(m.mandi, m.rate)}
                    className="zm-row zm-rise"
                    style={{
                      animationDelay: `${k * 35}ms`,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 16px",
                      minHeight: 62,
                      border: "none",
                      borderTop: k ? `1px solid ${C.lineSoft}` : "none",
                      background: C.surface,
                      textAlign: "start",
                      fontFamily: f.font,
                      color: C.ink,
                    }}
                  >
                    <span style={{ width: 22, fontSize: 13, fontWeight: 700, color: C.faint, flexShrink: 0 }}>{f.digits(k + 1)}</span>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: f.lh }}>{tm(stripMandi(m.mandi))}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: f.lh }}>
                        {shortRate(tr(m.rate))} · {tm(m.district)}
                      </span>
                    </div>
                    <Sparkline values={m.spark} flip={f.ur} />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, minWidth: 74, flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>{f.num(m.last)}</span>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 6,
                          fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate",
                          background: m.pct > 0 ? C.upTint : C.downTint,
                          color: m.pct > 0 ? C.up : C.down,
                        }}
                      >
                        {m.pct > 0 ? "+" : "−"}
                        {f.pct(m.pct)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </Card>
          </div>
        </>
      )}

      {/* Arrivals by province */}
      {!isPrice && provArr.length > 0 && (
        <>
          {sectionTitle(f.tx("Where arrivals came from", "آمد کہاں سے ہوئی"), f.tx(`${f.num(provTotal)} bags in this period`, `اس مدت میں ${f.num(provTotal)} بوریاں`))}
          <div style={{ padding: "0 16px" }}>
            <Card style={{ padding: "6px 16px 14px" }}>
              {[...provArr].sort((a, b) => b.v - a.v).map((o) => {
                const share = (o.v / provTotal) * 100;
                const open = openProv === o.p;
                const stations = stationsByProv.get(o.p) ?? [];
                return (
                  <div key={o.p} style={{ paddingTop: 12 }}>
                    {/* Province: tap to show / hide its stations */}
                    <button
                      type="button"
                      onClick={() => setOpenProv(open ? null : o.p)}
                      aria-expanded={open}
                      style={{ display: "flex", flexDirection: "column", gap: 7, width: "100%", background: "none", border: "none", padding: 0, textAlign: "start", color: "inherit", fontFamily: f.font, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, width: "100%" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600 }}>
                          {tm(o.p)}
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              background: open ? C.brand : C.chip,
                              transform: open ? "rotate(180deg)" : "none",
                              transition: "transform 0.25s ease, background 0.2s ease",
                            }}
                          >
                            <Icon name="chevDown" size={13} width={2.6} color={open ? "#fff" : C.muted} />
                          </span>
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.muted, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
                          <span style={{ fontWeight: 700, color: C.ink }}>{f.digits(Math.round(share))}%</span> · {f.num(o.v)}
                        </span>
                      </div>
                      <div style={{ height: 8, width: "100%", borderRadius: 4, background: C.chip, overflow: "hidden" }}>
                        <div style={{ height: 8, borderRadius: 4, background: "linear-gradient(90deg, #087F63, #2FB58A)", width: `${share}%` }} />
                      </div>
                    </button>

                    {/* Its stations, share of this province's arrivals */}
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          key="stations"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            style={{
                              margin: "10px 0 2px",
                              padding: "4px 12px 10px",
                              borderRadius: 14,
                              background: "#F5F8F6",
                              borderInlineStart: `3px solid ${C.brand}`,
                            }}
                          >
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.muted, padding: "6px 0 2px" }}>
                              {f.tx(`${f.digits(stations.length)} stations · share of ${tm(o.p)}`, `${f.digits(stations.length)} منڈیاں · ${tm(o.p)} میں حصہ`)}
                            </div>
                            {stations.map((st) => {
                              const sShare = o.v > 0 ? (st.v / o.v) * 100 : 0;
                              return (
                                <div key={st.name} style={{ display: "flex", flexDirection: "column", gap: 5, paddingTop: 9 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                                    <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tm(st.name)}</span>
                                    <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 500, color: C.muted, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
                                      <span style={{ fontWeight: 700, color: C.ink }}>{f.digits(sShare >= 1 ? Math.round(sShare) : Number(sShare.toFixed(1)))}%</span> · {f.num(st.v)}
                                    </span>
                                  </div>
                                  <div style={{ height: 5, borderRadius: 3, background: "#E3ECE7", overflow: "hidden" }}>
                                    <div style={{ height: 5, borderRadius: 3, background: "#5FB894", width: `${sShare}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </Card>
          </div>
        </>
      )}

      {pickerOpenRate && (
        <PickerSheet
          f={f}
          title={compare ? f.tx(`Compare up to ${MAX_COMPARE} rate types`, `زیادہ سے زیادہ ${f.digits(MAX_COMPARE)} ریٹ کا موازنہ`) : f.tx("Rate type", "ریٹ کی قسم")}
          multi={compare}
          max={MAX_COMPARE}
          value={compare ? set : [focus]}
          onChange={(v) => (compare ? setSet(v) : setFocus(v[0]))}
          onClose={() => setPickerOpenRate(false)}
          options={[
            ...(compare ? [] : [{ id: ALL_RATES, label: f.tx("All rates (average)", "تمام ریٹ (اوسط)") }]),
            ...withData.map((rt) => ({ id: rt, label: shortRate(tr(rt)) })),
          ]}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  if (compare) setCompare(false);
                  else {
                    setCompare(true);
                    setSet(focus === ALL_RATES ? withData.slice(0, 2) : [focus, withData.find((x) => x !== focus) || focus]);
                  }
                }}
                style={{ flex: 1, height: 48, borderRadius: 14, border: `1.5px solid ${C.brand}`, background: C.surface, color: C.brandDeep, fontSize: 15, fontWeight: 600, fontFamily: f.font, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Icon name="compare" size={16} width={2.4} color={C.brand} />
                {compare ? f.tx("Show one rate", "ایک ریٹ دکھائیں") : f.tx("Compare rate types", "ریٹس کا موازنہ")}
              </button>
              {compare && (
                <button
                  type="button"
                  onClick={() => setPickerOpenRate(false)}
                  style={{ flex: 1, height: 48, borderRadius: 14, border: "none", background: C.brand, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: f.font }}
                >
                  {f.tx("Done", "ہو گیا")}
                </button>
              )}
            </>
          }
        />
      )}
    </div>
  );
}
