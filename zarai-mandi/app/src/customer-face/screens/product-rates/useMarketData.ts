import { useEffect, useMemo, useState } from "react";

import { type TimelineResult } from "../../../data/realCommodityData";
import {
  fetchAllRecords,
  fetchByProducts,
  fetchTrendAll,
  type ByProductCatalogRow,
  type TrendPoint,
} from "../../../lib/api";
import { DATASET_DATES } from "../../shared/data/datasetDates";
import { ALL_RATE_TYPES } from "../../shared/data/rates";
import type { LocationScope } from "../../shared/types";
import type { MarketRow } from "./types";

/** The day grid every chart on this screen is drawn on: every day the data covers. */
export const TIMELINE = DATASET_DATES;

/** Reindexes a sparse day-points series onto the timeline. A day with no
 * report carries the last price forward ("unreported", not "zero");
 * arrivals stay honestly 0 on unreported days. */
export function buildTimelineResultFromApi(points: TrendPoint[], dates: string[]): TimelineResult {
  const byDate = new Map(points.map((p) => [p.date.slice(0, 10), p]));
  const mins: number[] = [];
  const maxs: number[] = [];
  const arrivals: number[] = [];
  let lastMin = 0;
  let lastMax = 0;
  for (const d of dates) {
    const p = byDate.get(d);
    if (p && p.avgMin > 0 && p.avgMax > 0) {
      lastMin = p.avgMin;
      lastMax = p.avgMax;
    }
    mins.push(lastMin);
    maxs.push(lastMax);
    arrivals.push((p as { totalArrival?: number } | undefined)?.totalArrival ?? 0);
  }
  const prices = dates.map((_, i) => (mins[i] > 0 && maxs[i] > 0 ? Math.round((mins[i] + maxs[i]) / 2) : 0));
  const latestPrice = prices[prices.length - 1] ?? 0;
  const prevPrice = prices.length >= 2 ? prices[prices.length - 2] : latestPrice;
  let trend: "up" | "down" | "stable" = "stable";
  let trendPct = 0;
  if (prevPrice > 0 && latestPrice > 0) {
    const diff = latestPrice - prevPrice;
    trendPct = Math.round((Math.abs(diff) / prevPrice) * 1000) / 10;
    if (diff > 0.01) trend = "up";
    else if (diff < -0.01) trend = "down";
  }
  return {
    dates,
    prices,
    mins,
    maxs,
    arrivals,
    latestMin: mins[mins.length - 1] ?? 0,
    latestMax: maxs[maxs.length - 1] ?? 0,
    latestPrice,
    trend,
    trendPct,
    matchedCount: points.length,
  };
}

/** Loads every record for this by-product (all dates, all of Pakistan) and
 * the per-day series for each rate type within the chosen location. */
export function useMarketData(division: string, byproduct: string, scope: LocationScope) {
  const [catalogEntry, setCatalogEntry] = useState<ByProductCatalogRow | null>(null);
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [trendByRate, setTrendByRate] = useState<Record<string, TrendPoint[]>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const catalog = await fetchByProducts(division);
        if (cancelled) return;
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const entry = catalog.find((c) => norm(c.by_product) === norm(byproduct)) || null;
        setCatalogEntry(entry);
        if (entry && entry.has_data) {
          const res = await fetchAllRecords(entry.id);
          if (!cancelled) setRows(res.rows.map(toRow));
        } else if (!cancelled) {
          setRows([]);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [division, byproduct]);

  useEffect(() => {
    let cancelled = false;
    if (!catalogEntry || !catalogEntry.has_data) {
      setTrendByRate({});
      return;
    }
    fetchTrendAll(catalogEntry.id, { locationKind: scope.kind, locationLabel: scope.label })
      .then((res) => {
        if (!cancelled) setTrendByRate(res.byRateType);
      })
      .catch(() => {
        if (!cancelled) setTrendByRate({});
      });
    return () => {
      cancelled = true;
    };
  }, [catalogEntry?.id, scope.kind, scope.label]);

  const timelines = useMemo(() => {
    const map: Record<string, TimelineResult> = {};
    for (const rt of ALL_RATE_TYPES) map[rt] = buildTimelineResultFromApi(trendByRate[rt] || [], TIMELINE);
    return map;
  }, [trendByRate]);

  /** Dates that actually have reports, newest last. */
  const dates = useMemo(() => [...new Set(rows.map((r) => r.date))].filter(Boolean).sort(), [rows]);

  return { rows, dates, timelines, loading, error, hasData: !!catalogEntry?.has_data };
}

function toRow(r: {
  id: string;
  record_date: string;
  price_type: string | null;
  station: string | null;
  district: string | null;
  province: string | null;
  minimum: string;
  maximum: string;
  arrivals: string | null;
  arrivals_unit: string | null;
  variety: string | null;
  color: string | null;
  origin: string | null;
  specification: string | null;
  new_old: string | null;
  quality: string | null;
  moisture_raw: string | null;
  reported_at?: string | null;
}): MarketRow {
  const unit = Number(r.arrivals_unit);
  return {
    id: r.id,
    date: (r.record_date || "").slice(0, 10),
    rateType: r.price_type || "",
    // The API can send nulls; every text field here is always a string.
    mandiName: `${(r.station || "Unknown").trim()} Mandi`,
    district: (r.district || "").trim(),
    province: (r.province || "").trim(),
    min: Number(r.minimum) || 0,
    max: Number(r.maximum) || 0,
    arrival: Number(r.arrivals) > 0 ? Number(r.arrivals) : 0,
    arrivalUnit: unit === 1 ? "1 kg" : unit === 1000 ? "1 MT" : unit > 0 ? `${unit} kg` : "40 kg",
    variety: r.variety || undefined,
    color: r.color || undefined,
    origin: r.origin || undefined,
    spec: r.specification || undefined,
    newOld: r.new_old || undefined,
    quality: r.quality || undefined,
    moisture: r.moisture_raw || undefined,
    reportedAt: reportTime(r.reported_at, r.record_date),
  };
}

/** "HH:MM" a report came in, when the source carries a time (today it only has dates). */
function reportTime(reportedAt: string | null | undefined, recordDate: string | null | undefined): string | undefined {
  const m = /[T ](\d{2}):(\d{2})/.exec(reportedAt || "");
  if (m) return `${m[1]}:${m[2]}`;
  const d = /[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(recordDate || "");
  // A bare midnight on a date-only export is not a real report time.
  if (d && !(d[1] === "00" && d[2] === "00" && (d[3] ?? "00") === "00")) return `${d[1]}:${d[2]}`;
  return undefined;
}
