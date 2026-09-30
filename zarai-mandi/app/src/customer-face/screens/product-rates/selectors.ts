// Pure calculations for the Product Rates screen. No React in here, so
// every number on screen can be traced to one small function.

import type { LocationScope } from "../../shared/types";
import { normLoc } from "./format";
import type { AttrFilters, AttrKey, ChangeInterval, MarketRow, SortKey } from "./types";

export const ALL_RATES = "All";

export function inScope(r: MarketRow, scope: LocationScope): boolean {
  const label = normLoc(scope.label);
  if (scope.kind === "pakistan" || !label || label === "all pakistan" || label === "پورا پاکستان") return true;
  if (scope.kind === "province") return (r.province || "").toLowerCase() === label;
  if (scope.kind === "district") return normLoc(r.district) === label || normLoc(r.mandiName) === label;
  return normLoc(r.mandiName) === label || normLoc(r.district) === label;
}

export function passesFilters(r: MarketRow, f: AttrFilters, rateType: string): boolean {
  if (rateType !== ALL_RATES && r.rateType !== rateType) return false;
  for (const [k, v] of Object.entries(f) as [AttrKey, string | undefined][]) {
    if (!v) continue;
    const val = (r[k] || "").toString().toLowerCase().replace(/[%٪]/g, "").trim();
    if (val !== v.toLowerCase().replace(/[%٪]/g, "").trim()) return false;
  }
  return true;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export type Stats = { min: number; max: number; mid: number; arrival: number; mandis: number; count: number };

/** Same maths the old hero used: average of reported minimums and maximums. */
export function statsFor(rows: MarketRow[]): Stats {
  const mins = rows.map((r) => r.min).filter((v) => v > 0);
  const maxs = rows.map((r) => r.max).filter((v) => v > 0);
  const min = avg(mins);
  const max = avg(maxs);
  return {
    min,
    max,
    mid: min > 0 && max > 0 ? (min + max) / 2 : min || max,
    arrival: rows.reduce((a, r) => a + r.arrival, 0),
    mandis: new Set(rows.map((r) => r.mandiName)).size,
    count: rows.length,
  };
}

/** The reporting date `n` report-days before `date` (or the earliest). */
export function dateBefore(dates: string[], date: string, n: number): string | null {
  const i = dates.indexOf(date);
  if (i <= 0) return null;
  return dates[Math.max(0, i - n)];
}

export type MandiEntry = {
  key: string;
  row: MarketRow;
  mid: number;
  change: number | null; // % over the chosen interval, null when no earlier report
  spark: number[]; // mid price on the last SPARK_DAYS report days (0 = no report)
};

export const SPARK_DAYS = 14;

/** One entry per record on the chosen date (never repeated across dates),
 * with its price change against the same mandi + rate type N report-days earlier. */
export function mandiEntries(
  allRows: MarketRow[],
  dates: string[],
  date: string,
  interval: ChangeInterval,
  keep: (r: MarketRow) => boolean,
): MandiEntry[] {
  const mid = (r: MarketRow) => (r.min > 0 && r.max > 0 ? (r.min + r.max) / 2 : r.min || r.max);
  const past = dateBefore(dates, date, interval);
  const pastMid = new Map<string, number[]>();
  if (past) {
    for (const r of allRows) {
      if (r.date !== past) continue;
      const k = `${r.mandiName}|${r.rateType}`;
      pastMid.set(k, [...(pastMid.get(k) || []), mid(r)]);
    }
  }
  // mandi|rate|date -> mids, for the row sparklines
  const upto = dates.indexOf(date);
  const sparkDates = upto >= 0 ? dates.slice(Math.max(0, upto - SPARK_DAYS + 1), upto + 1) : [];
  const sparkSet = new Set(sparkDates);
  const byDay = new Map<string, number[]>();
  for (const r of allRows) {
    if (!sparkSet.has(r.date)) continue;
    const k = `${r.mandiName}|${r.rateType}|${r.date}`;
    byDay.set(k, [...(byDay.get(k) || []), mid(r)]);
  }
  const sparkFor = (r: MarketRow) =>
    sparkDates.map((d) => {
      const v = byDay.get(`${r.mandiName}|${r.rateType}|${d}`);
      return v && v.length ? avg(v) : 0;
    });

  const seen = new Set<string>();
  const out: MandiEntry[] = [];
  for (const r of allRows) {
    if (r.date !== date || !keep(r)) continue;
    const key = [r.mandiName, r.rateType, r.variety, r.newOld, r.quality, r.color, r.moisture, r.min, r.max].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const m = mid(r);
    const prev = pastMid.get(`${r.mandiName}|${r.rateType}`);
    const p = prev && prev.length ? avg(prev) : 0;
    out.push({ key, row: r, mid: m, change: p > 0 && m > 0 ? ((m - p) / p) * 100 : null, spark: sparkFor(r) });
  }
  return out;
}

export function sortEntries(list: MandiEntry[], sort: SortKey, pinMandi?: string): MandiEntry[] {
  const by: Record<SortKey, (a: MandiEntry, b: MandiEntry) => number> = {
    priceHigh: (a, b) => b.row.max - a.row.max || b.row.min - a.row.min,
    priceLow: (a, b) => (a.row.min || Infinity) - (b.row.min || Infinity) || (a.row.max || Infinity) - (b.row.max || Infinity),
    arrivalHigh: (a, b) => b.row.arrival - a.row.arrival,
    arrivalLow: (a, b) => a.row.arrival - b.row.arrival,
    arrival: (a, b) => b.row.arrival - a.row.arrival,
    change: (a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0),
  };
  const sorter = by[sort] || by.priceHigh;
  const sorted = [...list].sort(sorter);
  if (!pinMandi) return sorted;
  const pin = normLoc(pinMandi);
  return [...sorted.filter((e) => normLoc(e.row.mandiName) === pin), ...sorted.filter((e) => normLoc(e.row.mandiName) !== pin)];
}

export const ATTR_KEYS: AttrKey[] = ["newOld", "variety", "moisture", "color", "spec", "origin"];

/** Filter choices built from the reports themselves, with how many mandis
 * report each value. Attributes nobody reports are left out entirely. */
export function filterOptions(rows: MarketRow[]): { key: AttrKey; options: { value: string; count: number }[] }[] {
  return ATTR_KEYS.map((key) => {
    const byVal = new Map<string, Set<string>>();
    for (const r of rows) {
      const v = r[key];
      if (!v) continue;
      byVal.set(v, (byVal.get(v) || new Set()).add(r.mandiName));
    }
    const options = [...byVal.entries()]
      .map(([value, set]) => ({ value, count: set.size }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    return { key, options };
  }).filter((g) => g.options.length > 0);
}

/** Which attribute a commodity is mostly traded on, so it is shown first. */
export function primaryAttr(t: string | null | undefined): AttrKey {
  if (t === "moisture") return "moisture";
  if (t === "color") return "color";
  if (t === "variety") return "variety";
  return "newOld";
}
