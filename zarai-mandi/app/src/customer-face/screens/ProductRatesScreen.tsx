import React, { useState, useRef, useEffect, useMemo } from "react";
import ExpandableMandiMapCard from "../../components/ExpandableMandiMapCard";
import { type MapByProductRecord } from "../../components/ZaraiMandiMap";
import {
  REAL_DATES_TIMELINE,
  getExcelTimeline,
  type TimelineResult,
} from "../../data/realCommodityData";
import {
  fetchByProducts,
  fetchAllRecords,
  fetchTrendAll,
  type ByProductCatalogRow,
  type MarketRecord,
  type TrendPoint,
} from "../../lib/api";
import { buildMandiInlineGraphFromRows } from "../../lib/mandiGraph";
import { requestDeviceOrientation, inDevicePreview } from "../../lib/device-orientation";

import { ProductIcon } from "../components/ProductIcon";
import { ZMMessageModal } from "../components/ZMMessage";
import { getProductSpecialAttrType } from "../shared/data/byproductStats";
import { getDivisionForProduct, isProductTodayOnly } from "../shared/data/catalog";
import {
  FEED_MESSAGES,
  getProvinceFromLoc,
  getRowsForProducts,
  INITIAL_MANDIS,
  isMatchByproduct,
  LOCATIONS,
} from "../shared/data/mandis";
import { ALL_RATE_TYPES, RATE_COLORS } from "../shared/data/rates";
import { toUrduDigits, URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import {
  type FeedMsg,
  type LocationScope,
  type RateItem,
  type RichRow,
  type Screen,
} from "../shared/types";
import { speakText } from "../shared/voice";
import { HistoricalRequestSheet } from "../sheets/HistoricalRequestSheet";
import { MultiLocSheet } from "../sheets/MultiLocSheet";

//  UTILITY

export const fmt = (n: number) =>
  n >= 100000
    ? `Rs.${(n / 100000).toFixed(1)}L`
    : `Rs.${n.toLocaleString("en-PK")}`;

/** Reindexes a sparse day-points series onto the fixed 31-day grid and
 * derives the same fields `getExcelTimeline` used to compute, so the rest
 * of ProductRatesScreen's chart code (priceSeries/arrivalData/quarter
 * bucketing) keeps working unchanged on real data. */
export function buildTimelineResultFromApi(points: TrendPoint[], dates: string[]): TimelineResult {
  const byDate = new Map(points.map((p) => [p.date.slice(0, 10), p]));
  // Carry the last reported value forward through days with no report,
  // instead of dropping to 0 -- a day with no quote is "unreported", not
  // "the price crashed to zero" (policy: "never reuse zero" for an
  // unavailable state). Arrivals stay honestly 0 on unreported days,
  // since arrivals are a per-day count, not a carried price level.
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
    arrivals.push((p as any)?.totalArrival ?? 0);
  }
  const prices = dates.map((_, i) => (mins[i] > 0 && maxs[i] > 0 ? Math.round((mins[i] + maxs[i]) / 2) : 0));

  const latestMin = mins[mins.length - 1] ?? 0;
  const latestMax = maxs[maxs.length - 1] ?? 0;
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

  return { dates, prices, mins, maxs, arrivals, latestMin, latestMax, latestPrice, trend, trendPct, matchedCount: points.length };
}

// ─── Province cultural pattern SVG overlay ──────────────────────
export function ProvincePatternSvg({
  pattern,
  opacity = 0.3,
}: {
  pattern: "phulkari" | "ajrak" | "khyber" | "baloch" | "pakistan";
  opacity?: number;
}) {
  const patternMap: Record<string, React.ReactNode> = {
    phulkari: (
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, opacity }}>
        <defs><pattern id="phulkari" width="40" height="40" patternUnits="userSpaceOnUse">
          <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#fff" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="4" fill="#fff" />
          <circle cx="2" cy="2" r="2" fill="#fff" /><circle cx="38" cy="2" r="2" fill="#fff" />
          <circle cx="2" cy="38" r="2" fill="#fff" /><circle cx="38" cy="38" r="2" fill="#fff" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#phulkari)" />
      </svg>
    ),
    ajrak: (
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, opacity }}>
        <defs><pattern id="ajrak" width="36" height="36" patternUnits="userSpaceOnUse">
          <circle cx="18" cy="18" r="10" fill="none" stroke="#fff" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="4" fill="#fff" />
          <circle cx="18" cy="4" r="2" fill="#fff" /><circle cx="18" cy="32" r="2" fill="#fff" />
          <circle cx="4" cy="18" r="2" fill="#fff" /><circle cx="32" cy="18" r="2" fill="#fff" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#ajrak)" />
      </svg>
    ),
    khyber: (
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, opacity }}>
        <defs><pattern id="khyber" width="32" height="32" patternUnits="userSpaceOnUse">
          <polyline points="0,24 16,8 32,24" fill="none" stroke="#fff" strokeWidth="1.8" />
          <polyline points="0,28 16,12 32,28" fill="none" stroke="#fff" strokeWidth="1" />
          <circle cx="16" cy="6" r="2" fill="#fff" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#khyber)" />
      </svg>
    ),
    baloch: (
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, opacity }}>
        <defs><pattern id="baloch" width="28" height="28" patternUnits="userSpaceOnUse">
          <polygon points="14,2 26,14 14,26 2,14" fill="none" stroke="#fff" strokeWidth="1.5" />
          <polygon points="14,7 21,14 14,21 7,14" fill="#fff" opacity="0.6" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#baloch)" />
      </svg>
    ),
    pakistan: (
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, opacity }}>
        <defs><pattern id="pakistan" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 28 16 A 10 10 0 1 1 20 32 A 8 8 0 1 0 28 16 Z" fill="#fff" />
          <polygon points="32,18 33.5,22 37.5,22 34.5,24.5 35.5,28.5 32,26 28.5,28.5 29.5,24.5 26.5,22 30.5,22" fill="#fff" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#pakistan)" />
      </svg>
    ),
  };
  return <>{patternMap[pattern] || patternMap.phulkari}</>;
}

//  BY PRODUCT DETAIL (Overview | Trends)

// Geo-aggregated comparison row type
export type CompRow = {
  key: string;
  rateType: string;
  min: number;
  max: number;
  arrival: string;
  trend: "up" | "down" | "stable";
  trendPct: number;
};

// Build inline graph data from real DB allRows for a specific mandi+rateType.
// This completely replaces the static REAL_TIMELINE_INDEX lookup for the
// comparison table's per-row graph drawer so every row shows its own data.
export function ProductRatesScreen({
  vertical,
  product,
  byproduct,
  onBack,
  push,
  isPickedBP = () => false,
  togglePickBP = () => { },
  locationScope: initialScope,
  onOpenLocation,
  initialRateType,
  initialMandi,
  initialVariety,
  initialNewOld,
  initialColor,
  initialSpec,
  initialCondition,
  initialMoisture,
  initialStatDate,
}: {
  vertical: string;
  product: string;
  byproduct: string;
  onBack: () => void;
  push?: (s: Screen) => void;
  isPickedBP?: (item: RateItem) => boolean;
  togglePickBP?: (item: RateItem) => void;
  locationScope?: LocationScope;
  onOpenLocation?: () => void;
  initialRateType?: string;
  initialMandi?: string;
  initialVariety?: string;
  initialNewOld?: string;
  initialColor?: string;
  initialSpec?: string;
  initialCondition?: string;
  initialMoisture?: string;
  initialStatDate?: string;
}) {
  const { lang, t, tc, tm, tr, voiceEnabled } = useLang();
  const [tab, setTab] = useState<"overview" | "trends">("overview");
  const [msgModal, setMsgModal] = useState<FeedMsg | null>(null);
  const [activeTypes, setActiveTypes] = useState<string[]>(
    initialRateType ? [initialRateType] : ["Mandi Rate"],
  );
  const [trendMode, setTrendMode] = useState<"price" | "arrival">("price");
  const [stockTimeframe, setStockTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX">("1M");
  const [stockGranularity, setStockGranularity] = useState<string>("1D");
  const [stockChartType, setStockChartType] = useState<"line" | "candle">("line");
  const [range, setRange] = useState<"week" | "month" | "quarter">("week");
  const [histOpen, setHistOpen] = useState(false);
  // Local location scope — starts from initialMandi if provided, otherwise defaults to All Pakistan
  const [locScope, setLocScope] = useState<LocationScope>(
    initialMandi ? { kind: "mandi", label: initialMandi } : { kind: "pakistan", label: "All Pakistan" },
  );
  // Remembers a specifically-picked mandi/district for the map button only:
  // picking one broadens `locScope` (and the table) to its province, but
  // the map should still zoom straight to the mandi itself, not the
  // province. Cleared whenever the picked scope isn't a mandi/district.
  const [focusedMandi, setFocusedMandi] = useState<{ kind: "mandi" | "district"; label: string } | null>(
    initialMandi ? { kind: "mandi", label: initialMandi } : null,
  );
  const [locSheet, setLocSheet] = useState(false);
  // Date filter
  const [dateMode, setDateMode] = useState<"today" | "date" | "range">("today");
  const [dateSheet, setDateSheet] = useState(false);
  // Geographic view for comparison table
  const [geoView, setGeoView] = useState<
    "mandi" | "district" | "province" | "pakistan"
  >("mandi");
  // Rate type filter for table (empty = all)
  const [tableRateTypes, setTableRateTypes] = useState<string[]>([]);
  // Chart hover state
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [arrivalHoverIdx, setArrivalHoverIdx] = useState<number | null>(null);
  // Attribute filters — pre-filled from card when entering from by-product screen
  const [attrVariety, setAttrVariety] = useState<string | null>(
    initialVariety || null,
  );
  const [attrNewOld, setAttrNewOld] = useState<string | null>(
    initialNewOld || null,
  );
  const [attrColor, setAttrColor] = useState<string | null>(
    initialColor || null,
  );
  const [attrSpec, setAttrSpec] = useState<string | null>(initialSpec || null);
  const [attrCondition, setAttrCondition] = useState<string | null>(
    initialCondition || null,
  );
  const [attrRateType, setAttrRateType] = useState<string | null>(
    initialRateType || null,
  );
  const [attrMoisture, setAttrMoisture] = useState<string | null>(
    initialMoisture || null,
  );
  const [isAttrPanelOpen, setIsAttrPanelOpen] = useState(false);
  const [attrSheet, setAttrSheet] = useState<
    "variety" | "newold" | "color" | "spec" | "condition" | "moisture" | "ratetype" | string | null
  >(null);
  // Overview stat date filter — pre-filled when navigating from a historical card
  const [statDateFilter, setStatDateFilter] = useState<Date | null>(
    initialStatDate ? new Date(initialStatDate) : new Date(2026, 8, 14),
  );
  const [statDateCalOpen, setStatDateCalOpen] = useState(false);
  const [statDateCalMonth, setStatDateCalMonth] = useState<Date>(
    initialStatDate ? new Date(initialStatDate) : new Date(2026, 8, 14),
  );
  // Mandi table province + date filter
  const [tableProvinceFilter, setTableProvinceFilter] = useState<string | null>(
    null,
  );
  const [tableDateFilter, setTableDateFilter] = useState<Date | null>(null);
  const [tableDateCalOpen, setTableDateCalOpen] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [landscapeRotated, setLandscapeRotated] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [tableDateCalMonth, setTableDateCalMonth] = useState<Date>(
    new Date(2026, 7, 21),
  );
  const [tableTrendInterval, setTableTrendInterval] = useState<
    "24h" | "72h" | "weekly" | "monthly"
  >("24h");
  const [trendDropdownOpen, setTrendDropdownOpen] = useState(false);
  const [selectedMandiGraphRow, setSelectedMandiGraphRow] = useState<{
    mandiName: string;
    rateType: string;
    min: number;
    max: number;
    trend: "up" | "down" | "flat" | "stable";
    trendPct: number;
    arrival?: string | number;
  } | null>(null);
  const [tableGraphView, setTableGraphView] = useState<"price" | "arrival">("price");
  const [graphTimeframe, setGraphTimeframe] = useState<
    "1M" | "3M" | "6M" | "1Y" | "72h" | "7d" | "30d"
  >("1M");
  const [tableGraphGranularity, setTableGraphGranularity] = useState<string>("15");
  const [tableGraphHoverIdx, setTableGraphHoverIdx] = useState<number | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [tableClientWidth, setTableClientWidth] = useState<number>(0);

  useEffect(() => {
    if (!tableScrollRef.current) return;
    const updateWidth = () => {
      if (tableScrollRef.current) {
        setTableClientWidth(tableScrollRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateWidth) : null;
    if (ro && tableScrollRef.current) {
      ro.observe(tableScrollRef.current);
    }
    window.addEventListener("resize", updateWidth);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [isTableExpanded, landscapeRotated]);

  useEffect(() => {
    if (isTableExpanded) {
      if (inDevicePreview()) {
        requestDeviceOrientation(landscapeRotated ? "landscape" : "portrait");
      }
      if (typeof screen !== "undefined" && screen.orientation && "lock" in screen.orientation) {
        try {
          if (landscapeRotated) {
            (screen.orientation as any).lock("landscape").catch(() => { });
          } else {
            (screen.orientation as any).lock("portrait").catch(() => { });
          }
        } catch (_) { }
      }
    } else {
      if (inDevicePreview()) {
        requestDeviceOrientation("portrait");
      }
      if (typeof screen !== "undefined" && screen.orientation && "unlock" in screen.orientation) {
        try {
          screen.orientation.unlock();
        } catch (_) { }
      }
    }
  }, [isTableExpanded, landscapeRotated]);

  // Restore portrait orientation when unmounting or leaving ProductRatesScreen
  useEffect(() => {
    return () => {
      if (inDevicePreview()) {
        requestDeviceOrientation("portrait");
      }
    };
  }, []);

  useEffect(() => {
    if (selectedMandiGraphRow && tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [selectedMandiGraphRow]);

  // Date table + its filters
  const [dateTableOpen, setDateTableOpen] = useState(false);
  const [dtSelDate, setDtSelDate] = useState<Date>(new Date());
  const [dtCalMonth, setDtCalMonth] = useState<Date>(new Date());
  const [dtCalOpen, setDtCalOpen] = useState(false);
  const [dtQuality, setDtQuality] = useState<string | null>(null);
  const [dtPriceType, setDtPriceType] = useState<string | null>(null);
  const [dtSpec, setDtSpec] = useState<string | null>(null);
  const [dtCondition, setDtCondition] = useState<string | null>(null);
  const [dtOpenCol, setDtOpenCol] = useState<string | null>(null);

  const title = byproduct || product;
  const currentMandiName =
    locScope.kind === "mandi"
      ? locScope.label
      : initialMandi || "Pakpattan Mandi";
  const pickItem: RateItem = {
    vertical,
    product,
    byproduct: byproduct || product,
    mandiName: currentMandiName,
    rateType: attrRateType || initialRateType || "Mill",
  };
  const picked = isPickedBP(pickItem);

  // Real rows for this by-product from the Postgres-backed market API.
  // `product` here is the division (e.g. "Wheat"); resolve it + the
  // by-product name to a catalog id, then fetch every matching row once
  // and let the rest of this screen's existing filtering/grouping logic
  // (attribute filters, geoView grouping, comparison table) run on it
  // exactly as it did on the old mock rows.
  const [apiRecords, setApiRecords] = useState<MarketRecord[]>([]);
  const [apiRowsLoading, setApiRowsLoading] = useState(true);
  const [apiCatalogEntry, setApiCatalogEntry] = useState<ByProductCatalogRow | null>(null);

  const dbDivision = getDivisionForProduct(vertical, product);

  useEffect(() => {
    let cancelled = false;
    setApiRowsLoading(true);
    (async () => {
      const catalog = await fetchByProducts(dbDivision);
      if (cancelled) return;
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetNorm = norm(byproduct || product);
      const entry =
        catalog.find(
          (c) =>
            norm(c.by_product) === targetNorm ||
            c.by_product.toLowerCase() === (byproduct || product).toLowerCase()
        ) || null;
      setApiCatalogEntry(entry);
      if (entry && entry.has_data) {
        const { rows } = await fetchAllRecords(entry.id);
        if (!cancelled) setApiRecords(rows);
      } else if (!cancelled) {
        setApiRecords([]);
      }
      if (!cancelled) setApiRowsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [dbDivision, product, byproduct]);

  const allRows = useMemo(() => {
    return apiRecords.map((r) => ({
      product,
      byproduct: byproduct || product,
      emoji: "",
      rateType: r.price_type,
      arrival:
        r.arrivals && Number(r.arrivals) > 0
          ? Number(r.arrivals).toLocaleString("en-US")
          : "0",
      arrivalUnit:
        r.arrivals_unit && Number(r.arrivals_unit) > 0
          ? Number(r.arrivals_unit) === 1
            ? (lang === "ur" ? "۱ کلو" : "1 kg")
            : Number(r.arrivals_unit) === 1000
              ? (lang === "ur" ? "۱ ٹن" : "1 MT")
              : lang === "ur"
                ? `${toUrduDigits(r.arrivals_unit)} کلو`
                : `${r.arrivals_unit} kg`
          : (lang === "ur" ? "۴۰ کلو" : "40 kg"),
      min: Number(r.minimum),
      max: Number(r.maximum),
      trend: "stable" as const,
      trendPct: 0,
      mandiName: `${r.station} Mandi`,
      mandiCity: r.district,
      province: r.province,
      variety: r.variety || undefined,
      color: r.color || undefined,
      origin: r.origin || undefined,
      spec: r.specification || undefined,
      condition: undefined,
      newOld: r.new_old || undefined,
      // extra fields this screen reads even though RichRow doesn't declare them
      moisture: r.moisture_raw || undefined,
      quality: r.quality || undefined,
      date: r.record_date ? r.record_date.slice(0, 10) : undefined,
    })) as (RichRow & { moisture?: string; quality?: string; date?: string; origin?: string; arrivalUnit?: string })[];
  }, [apiRecords, product, byproduct, lang]);

  // Real mandi/district names (nationwide, unfiltered by locScope) that
  // actually have data for this by-product this month -- lets the location
  // picker put ones with data first and mark ones without.
  const dataMandiNameSet = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRows) {
      if (r.mandiName) set.add(r.mandiName.toLowerCase().trim());
      if (r.mandiCity) set.add(r.mandiCity.toLowerCase().trim());
    }
    return set;
  }, [allRows]);

  const inLocScope = (r: (typeof allRows)[0]) => {
    const norm = (s?: string) =>
      (s || "")
        .toLowerCase()
        .replace(/\s*(mandi|منڈی)$/i, "")
        .trim();
    const scopeLabel = norm(locScope.label);
    if (
      !scopeLabel ||
      locScope.kind === "pakistan" ||
      scopeLabel === "all pakistan" ||
      scopeLabel === "پاکستان" ||
      scopeLabel === "پورا پاکستان"
    ) {
      return true;
    }

    if (locScope.kind === "province") {
      return (
        norm(r.province) === scopeLabel ||
        (r.province || "").toLowerCase().includes(scopeLabel)
      );
    }
    if (locScope.kind === "district") {
      return (
        norm(r.mandiCity) === scopeLabel ||
        norm(r.mandiName).includes(scopeLabel) ||
        scopeLabel.includes(norm(r.mandiCity))
      );
    }
    if (locScope.kind === "mandi") {
      const rMandi = norm(r.mandiName);
      const rCity = norm(r.mandiCity);
      return (
        rMandi === scopeLabel ||
        rCity === scopeLabel ||
        rMandi.includes(scopeLabel) ||
        scopeLabel.includes(rMandi)
      );
    }
    return true;
  };
  const scopedRows = allRows.filter(inLocScope);
  const baseRows = scopedRows.length > 0 ? scopedRows : allRows;

  // Filter with active non-null attributes
  const rows = useMemo(() => {
    let res = baseRows;
    if (attrRateType) {
      res = res.filter((r) => r.rateType === attrRateType);
    }
    if (attrMoisture) {
      const cleanM = attrMoisture.replace(/[%٪]/g, "").trim().toLowerCase();
      res = res.filter((r) => {
        const rowM = (r.moisture || "").replace(/[%٪]/g, "").trim().toLowerCase();
        return rowM === cleanM || rowM.includes(cleanM) || cleanM.includes(rowM);
      });
    }
    if (attrColor) {
      res = res.filter((r) => (r.color || '').toLowerCase() === attrColor.toLowerCase());
    }
    if (attrVariety) {
      res = res.filter((r) => (r.variety || '').toLowerCase() === attrVariety.toLowerCase());
    }
    if (attrNewOld) {
      res = res.filter((r) => (r.newOld || '').toLowerCase().includes(attrNewOld.toLowerCase()));
    }
    if (attrSpec) {
      res = res.filter((r) => (r.spec || '').toLowerCase() === attrSpec.toLowerCase());
    }
    if (attrCondition) {
      res = res.filter((r) => (r.condition || '').toLowerCase() === attrCondition.toLowerCase());
    }
    return res;
  }, [baseRows, attrRateType, attrMoisture, attrColor, attrVariety, attrNewOld, attrSpec, attrCondition]);

  const primarySpecialAttr = useMemo(() => {
    const targetType = getProductSpecialAttrType(byproduct, product);
    if (targetType === 'moisture' || targetType === 'color' || targetType === 'variety') {
      return targetType;
    }
    if (targetType === 'newOld' || targetType === 'spec' || targetType === 'quality') {
      return 'quality';
    }
    return targetType || null;
  }, [product, byproduct]);

  const parseArrival = (a: any) => {
    if (typeof a === "number") return a;
    if (!a) return 0;
    const match = String(a).trim().match(/^([0-9,]+)/);
    return match ? parseInt(match[1].replace(/,/g, ""), 10) || 0 : 0;
  };

  // Format current selected date and determine date index in REAL_DATES_TIMELINE
  const curDate = statDateFilter || new Date(2026, 8, 14);
  const curDateStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, "0")}-${String(curDate.getDate()).padStart(2, "0")}`;
  const isDateInRange = curDateStr >= "2026-08-15" && curDateStr <= "2026-09-14";
  const dateIdx = isDateInRange ? REAL_DATES_TIMELINE.indexOf(curDateStr) : -1;

  // Real data-driven date & attribute-specific overview statistics
  const { statMin, statMax, statArrival, statMandis } = useMemo(() => {
    if (!isDateInRange || dateIdx === -1) {
      return { statMin: 0, statMax: 0, statArrival: 0, statMandis: 0 };
    }

    // Records matching active attribute filters on this date
    const dateFilteredRows = rows.filter((r) => r.date === curDateStr);

    const dateMins = dateFilteredRows.map((r) => r.min).filter((v) => v > 0);
    const dateMaxs = dateFilteredRows.map((r) => r.max).filter((v) => v > 0);

    const sMin =
      dateMins.length > 0
        ? Math.round(dateMins.reduce((a, b) => a + b, 0) / dateMins.length)
        : 0;
    const sMax =
      dateMaxs.length > 0
        ? Math.round(dateMaxs.reduce((a, b) => a + b, 0) / dateMaxs.length)
        : 0;

    // Total arrival volume on this date for this by-product across filtered mandis
    const dateArrs = dateFilteredRows.map((r) => parseArrival(r.arrival));
    const sArrival = dateArrs.reduce((a, b) => a + b, 0);

    const marketSet = new Set<string>();
    for (let i = 0; i < dateFilteredRows.length; i++) {
      if (dateFilteredRows[i].mandiName || dateFilteredRows[i].mandiCity) {
        marketSet.add(dateFilteredRows[i].mandiName || dateFilteredRows[i].mandiCity || "Mandi");
      }
    }
    const sMandis = marketSet.size;

    return {
      statMin: sMin,
      statMax: sMax,
      statArrival: sArrival,
      statMandis: sMandis,
    };
  }, [rows, isDateInRange, dateIdx, curDateStr]);

  // Build comparison rows by geoView
  const compRows = useMemo((): CompRow[] => {
    type R = (typeof allRows)[0];
    const src: R[] =
      tableRateTypes.length > 0
        ? rows.filter((r) => tableRateTypes.includes(r.rateType))
        : rows;
    const agg = (grp: R[]) => {
      const arrSum = grp.reduce((s, r) => s + parseArrival(r.arrival), 0);
      const validMins = grp.map((r) => r.min).filter((v) => v > 0);
      const validMaxs = grp.map((r) => r.max).filter((v) => v > 0);
      return {
        min: validMins.length > 0 ? Math.min(...validMins) : 0,
        max: validMaxs.length > 0 ? Math.max(...validMaxs) : 0,
        arrival: arrSum > 0 ? arrSum.toLocaleString() : "—",
        trend: grp[0]?.trend || "stable",
        trendPct: grp[0]?.trendPct || 0,
      };
    };
    const groupBy = (arr: R[], keyFn: (r: R) => string) => {
      const map = new Map<string, R[]>();
      arr.forEach((r) => {
        const k = keyFn(r);
        map.set(k, [...(map.get(k) || []), r]);
      });
      return map;
    };
    const byRateType = (grp: R[]) => [
      ...groupBy(grp, (r) => r.rateType).entries(),
    ];
    if (geoView === "mandi")
      return src.map((r) => ({
        key: r.mandiName,
        rateType: r.rateType,
        ...agg([r]),
      }));
    if (geoView === "district") {
      return [...groupBy(src, (r) => r.mandiCity).entries()].flatMap(
        ([city, grp]) =>
          byRateType(grp).map(([rt, rg]) => ({
            key: city,
            rateType: rt,
            ...agg(rg),
          })),
      );
    }
    if (geoView === "province") {
      return [...groupBy(src, (r) => r.province).entries()].flatMap(
        ([prov, grp]) =>
          byRateType(grp).map(([rt, rg]) => ({
            key: prov,
            rateType: rt,
            ...agg(rg),
          })),
      );
    }
    return byRateType(src).map(([rt, rg]) => ({
      key: "Pakistan",
      rateType: rt,
      ...agg(rg),
    }));
  }, [rows, geoView, tableRateTypes]);

  const rowToMsg = (r: (typeof allRows)[0]): FeedMsg => {
    const ex = FEED_MESSAGES.find(
      (m) => m.product === r.product && m.station === r.mandiName,
    );
    if (ex) return ex;
    return {
      id: Date.now(),
      time: "Today",
      vertical,
      productUrdu: product,
      product,
      byproduct: r.byproduct,
      stationUrdu: r.mandiCity,
      station: r.mandiName,
      province: r.province,
      priceMin: r.min,
      priceMax: r.max,
      unit: "40 kg",
      arrivalCount: r.arrival,
      arrivalUnit: "Bags",
      arrivalUnitUrdu: "تھیلے",
      colorUrdu: "سفید",
      color: "White",
      rateType: r.rateType,
      specUrdu: "خشک",
      spec: "Dry",
      qualityUrdu: "نئی",
      quality: "New",
      qualityTypeUrdu: "تجارتی",
      qualityType: "Trade",
      trend: r.trend,
      trendPct: r.trendPct,
    };
  };

  // ─── Timeframe & Timeline Engine (1M, 3M, 6M, 1Y) ──────────────────────
  // Real historical dataset with seasonal factors for 1M, 3M, 6M, 1Y
  const tfConfig = useMemo(() => {
    if (stockTimeframe === "1Y") {
      const monthsEn = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
      const monthsUr = ["اکتوبر", "نومبر", "دسمبر", "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر"];
      const fullEn = ["Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"];
      const fullUr = ["اکتوبر ۲۰۲۵", "نومبر ۲۰۲۵", "دسمبر ۲۰۲۵", "جنوری ۲۰۲۶", "فروری ۲۰۲۶", "مارچ ۲۰۲۶", "اپریل ۲۰۲۶", "مئی ۲۰۲۶", "جون ۲۰۲۶", "جولائی ۲۰۲۶", "اگست ۲۰۲۶", "ستمبر ۲۰۲۶"];
      const seasonalFactors = [0.93, 0.94, 0.95, 0.96, 0.98, 1.01, 1.04, 1.02, 0.99, 0.97, 0.99, 1.0];
      const arrivalFactors = [0.8, 0.85, 0.9, 0.95, 1.1, 1.3, 1.4, 1.2, 0.9, 0.85, 1.0, 1.0];
      return {
        len: 12,
        labels: monthsEn.map((m, i) => ({
          tickLabel: lang === "ur" ? (i % 2 === 0 || i === 11 ? monthsUr[i] : "") : (i % 2 === 0 || i === 11 ? m : ""),
          fullDate: lang === "ur" ? fullUr[i] : fullEn[i],
          dayName: lang === "ur" ? "ماہانہ" : "Monthly",
        })),
        priceFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i]),
        minFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 0.985),
        maxFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 1.015),
        arrivalFactor: (base: number, i: number) => Math.round(base * arrivalFactors[i]),
      };
    } else if (stockTimeframe === "6M") {
      const monthsEn = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
      const monthsUr = ["اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر"];
      const fullEn = ["Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"];
      const fullUr = ["اپریل ۲۰۲۶", "مئی ۲۰۲۶", "جون ۲۰۲۶", "جولائی ۲۰۲۶", "اگست ۲۰۲۶", "ستمبر ۲۰۲۶"];
      const seasonalFactors = [1.03, 1.02, 0.99, 0.98, 0.99, 1.0];
      const arrivalFactors = [1.3, 1.2, 0.9, 0.85, 1.0, 1.0];
      return {
        len: 6,
        labels: monthsEn.map((m, i) => ({
          tickLabel: lang === "ur" ? monthsUr[i] : m,
          fullDate: lang === "ur" ? fullUr[i] : fullEn[i],
          dayName: lang === "ur" ? "ماہانہ" : "Monthly",
        })),
        priceFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i]),
        minFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 0.988),
        maxFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 1.012),
        arrivalFactor: (base: number, i: number) => Math.round(base * arrivalFactors[i]),
      };
    } else if (stockTimeframe === "3M") {
      const weeksEn = ["27 Jun", "4 Jul", "11 Jul", "18 Jul", "25 Jul", "1 Aug", "8 Aug", "15 Aug", "22 Aug", "29 Aug", "5 Sep", "14 Sep"];
      const weeksUr = ["۲۷ جون", "۴ جولائی", "۱۱ جولائی", "۱۸ جولائی", "۲۵ جولائی", "۱ اگست", "۸ اگست", "۱۵ اگست", "۲۲ اگست", "۲۹ اگست", "۵ ستمبر", "۱۴ ستمبر"];
      const fullEn = weeksEn.map((w, i) => `Week ${i + 1}: ${w} 2026 (Weekly Avg)`);
      const fullUr = weeksUr.map((w, i) => `ہفتہ ${toUrduDigits(i + 1)}: ${w} ۲۰۲۶ (ہفتہ وار اوسط)`);
      const seasonalFactors = [0.97, 0.975, 0.98, 0.985, 0.99, 0.992, 0.995, 0.998, 1.0, 1.002, 0.999, 1.0];
      const arrivalFactors = [0.85, 0.9, 0.92, 0.95, 0.98, 1.0, 1.02, 1.05, 1.0, 0.98, 0.95, 1.0];
      return {
        len: 12,
        labels: weeksEn.map((w, i) => ({
          tickLabel: i % 3 === 0 || i === 11 ? (lang === "ur" ? weeksUr[i] : w) : "",
          fullDate: lang === "ur" ? fullUr[i] : fullEn[i],
          dayName: lang === "ur" ? "ہفتہ وار" : "Weekly",
        })),
        priceFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i]),
        minFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 0.992),
        maxFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 1.008),
        arrivalFactor: (base: number, i: number) => Math.round(base * arrivalFactors[i]),
      };
    } else {
      // "1M" (31 Daily Points)
      const list: { tickLabel: string; fullDate: string; dayName: string }[] = [];
      const rawDates = REAL_DATES_TIMELINE.slice(-31);
      const urMonthsShort = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
      const enMonthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const urDays = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];
      const enDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 0; i < rawDates.length; i++) {
        const dStr = rawDates[i];
        const parts = dStr.split("-");
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        const dayName = lang === "ur" ? urDays[dt.getDay()] : enDays[dt.getDay()];
        const mName = lang === "ur" ? urMonthsShort[m] : enMonthsShort[m];
        const dayStr = lang === "ur" ? toUrduDigits(d) : String(d);

        let tickLabel = "";
        if (i === 0 || i === 7 || i === 14 || i === 21 || i === rawDates.length - 1) {
          tickLabel = `${dayStr} ${mName}`;
        }

        const fullDate = lang === "ur"
          ? `${dayStr} ${mName} ۲۰۲۶ (${dayName})`
          : `${d} ${enMonthsShort[m]} 2026 (${enDays[dt.getDay()]})`;

        list.push({ tickLabel, fullDate, dayName });
      }

      return {
        len: 31,
        labels: list,
        priceFactor: null,
        minFactor: null,
        maxFactor: null,
        arrivalFactor: null,
      };
    }
  }, [stockTimeframe, lang]);

  const len = tfConfig.len;
  const fullDateLabels = tfConfig.labels;
  const xLabels = useMemo(() => fullDateLabels.map((f) => f.tickLabel), [fullDateLabels]);

  // Real per-day, per-rate-type series from the market API (one batched
  // request for every rate type, instead of N calls into the old bundled
  // timeline index).
  const [trendAllByRateType, setTrendAllByRateType] = useState<Record<string, TrendPoint[]>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!apiCatalogEntry || !apiCatalogEntry.has_data) {
        setTrendAllByRateType({});
        return;
      }
      const result = await fetchTrendAll(apiCatalogEntry.id, {
        locationKind: locScope.kind,
        locationLabel: locScope.label,
      });
      if (!cancelled) setTrendAllByRateType(result.byRateType);
    })();
    return () => {
      cancelled = true;
    };
  }, [apiCatalogEntry?.id, locScope.label, locScope.kind]);

  const excelTimelineMap = useMemo(() => {
    const map: Record<string, TimelineResult> = {};
    for (const rt of ALL_RATE_TYPES) {
      map[rt] = buildTimelineResultFromApi(trendAllByRateType[rt] || [], REAL_DATES_TIMELINE);
    }
    return map;
  }, [trendAllByRateType]);

  const normInitial = useMemo(() => {
    const raw = (attrRateType || initialRateType || "").trim();
    if (!raw) return "Mandi Rate";
    const match = ALL_RATE_TYPES.find(
      (t) => t.toLowerCase() === raw.toLowerCase() || t.toLowerCase().startsWith(raw.toLowerCase())
    );
    return match || "Mandi Rate";
  }, [attrRateType, initialRateType]);

  const orderedRateTypes = useMemo(() => {
    return [normInitial, ...ALL_RATE_TYPES.filter((t) => t !== normInitial)];
  }, [normInitial]);

  const [focusedType, setFocusedType] = useState<string>(() => normInitial);
  const [compareMode, setCompareMode] = useState<boolean>(false);

  useEffect(() => {
    setFocusedType(normInitial);
    if (!activeTypes.includes(normInitial)) {
      setActiveTypes([normInitial]);
    }
  }, [normInitial]);

  const priceSeries = useMemo(
    () =>
      ALL_RATE_TYPES.map((rt) => {
        const tResult = excelTimelineMap[rt];
        const baseLatestPrice = tResult.latestPrice || 4500;
        const basePrices = tResult.prices.slice(-31);
        const baseMins = tResult.mins.slice(-31);
        const baseMaxs = tResult.maxs.slice(-31);

        if (tfConfig.priceFactor) {
          const prices = Array.from({ length: tfConfig.len }, (_, i) =>
            tfConfig.priceFactor!(baseLatestPrice, i)
          );
          const mins = Array.from({ length: tfConfig.len }, (_, i) =>
            tfConfig.minFactor!(baseLatestPrice, i)
          );
          const maxs = Array.from({ length: tfConfig.len }, (_, i) =>
            tfConfig.maxFactor!(baseLatestPrice, i)
          );
          return {
            label: rt,
            color: RATE_COLORS[rt] || "#087F63",
            data: prices,
            mins,
            maxs,
            latestMin: mins[mins.length - 1],
            latestMax: maxs[maxs.length - 1],
            trend: tResult.trend,
            trendPct: tResult.trendPct,
          };
        } else {
          return {
            label: rt,
            color: RATE_COLORS[rt] || "#087F63",
            data: basePrices,
            mins: baseMins,
            maxs: baseMaxs,
            latestMin: tResult.latestMin,
            latestMax: tResult.latestMax,
            trend: tResult.trend,
            trendPct: tResult.trendPct,
          };
        }
      }),
    [excelTimelineMap, tfConfig],
  );

  const activeArrivalResult = useMemo((): TimelineResult => {
    // Total arrival volume across all rate types per day, matching real data and Screen 2
    const arrivals = REAL_DATES_TIMELINE.map((_, i) =>
      ALL_RATE_TYPES.reduce((sum, rt) => sum + (excelTimelineMap[rt]?.arrivals[i] || 0), 0)
    );
    return {
      dates: REAL_DATES_TIMELINE,
      prices: [],
      mins: [],
      maxs: [],
      arrivals,
      latestMin: 0,
      latestMax: 0,
      latestPrice: 0,
      trend: "stable",
      trendPct: 0,
      matchedCount: 1,
    };
  }, [excelTimelineMap]);

  const arrivalData = useMemo(() => {
    const baseArrivals = activeArrivalResult.arrivals.slice(-31);
    const avgArr = Math.round(baseArrivals.reduce((a, b) => a + b, 0) / Math.max(baseArrivals.length, 1)) || 500;
    if (tfConfig.arrivalFactor) {
      return Array.from({ length: tfConfig.len }, (_, i) =>
        tfConfig.arrivalFactor!(avgArr, i)
      );
    }
    return baseArrivals;
  }, [activeArrivalResult, tfConfig]);

  const activeSeries = useMemo(() => {
    const fallbackSeries = priceSeries.find((s) => s.label === normInitial) || priceSeries[0];
    if (!compareMode) {
      const main = priceSeries.find((s) => s.label === focusedType) || fallbackSeries;
      return [main];
    }
    const sel = priceSeries.filter((s) => activeTypes.includes(s.label));
    return sel.length > 0 ? sel : [fallbackSeries];
  }, [priceSeries, focusedType, compareMode, activeTypes, normInitial]);

  const toggleType = (tKey: string) => {
    setFocusedType(tKey);
    setActiveTypes((p) => {
      if (!p.includes(tKey)) return [...p, tKey];
      if (p.length > 1) return p.filter((x) => x !== tKey);
      return p;
    });
  };

  // Chart SVG helpers (TradingView & Binance style)
  const CH = 230,
    CW = 370,
    PL = 46,
    PR = 44,
    PT = 16,
    PB = 28;
  const chartW = CW - PL - PR;
  const volBaseY = CH - PB;
  const volMaxH = 22;
  const separatorY = compareMode ? volBaseY : volBaseY - volMaxH - 8;
  const lineChartH = separatorY - PT - 8;

  const arrSeparatorY = volBaseY - volMaxH - 8;
  const arrLineChartH = arrSeparatorY - PT - 8;

  const xOf = (i: number, total: number) => PL + (i / Math.max(total - 1, 1)) * chartW;
  const yOf = (v: number, mn: number, mx: number) =>
    PT + ((mx - v) / Math.max(mx - mn, 1)) * lineChartH;
  const yOfArr = (v: number, mn: number, mx: number) =>
    PT + ((mx - v) / Math.max(mx - mn, 1)) * arrLineChartH;

  const priceFlat = activeSeries.flatMap((s) => s.data);
  const rawPMin = priceFlat.length ? Math.min(...priceFlat) : 2500;
  const rawPMax = priceFlat.length ? Math.max(...priceFlat) : 3500;

  // Nice rounded ticks for Y-axis with dynamic adaptive spread
  const pSpread = rawPMax - rawPMin;
  const minSpread = Math.max(Math.round(rawPMax * 0.04), 80);
  const pPadding = Math.max(pSpread * 0.15, 30);
  const pMin = Math.max(
    0,
    Math.floor((rawPMin - (pSpread < minSpread ? (minSpread - pSpread) / 2 : pPadding)) / 25) * 25,
  );
  const pMax = Math.ceil((rawPMax + (pSpread < minSpread ? (minSpread - pSpread) / 2 : pPadding)) / 25) * 25;

  const rawAMin = arrivalData.length ? Math.min(...arrivalData) : 0;
  const rawAMax = arrivalData.length ? Math.max(...arrivalData) : 1000;
  const aSpread = Math.max(rawAMax - rawAMin, 500);
  const aMin = Math.max(0, Math.floor((rawAMin - aSpread * 0.1) / 100) * 100);
  const aMax = Math.ceil((rawAMax + aSpread * 0.15) / 100) * 100;

  const yPriceTicks = useMemo(() => {
    const step = (pMax - pMin) / 4;
    return [pMin, pMin + step, pMin + step * 2, pMin + step * 3, pMax].map((v) => Math.round(v));
  }, [pMin, pMax]);

  const yArrivalTicks = useMemo(() => {
    const step = (aMax - aMin) / 4;
    return [aMin, aMin + step, aMin + step * 2, aMin + step * 3, aMax].map((v) => Math.round(v));
  }, [aMin, aMax]);

  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden screen-enter"
      style={{ background: "#F1F7F4" }}
    >
      {/*  Header  */}
      <header
        className="flex-shrink-0"
        style={{ background: "#F4FAF7", borderBottom: "1px solid #D5E2DD" }}
      >
        <div
          className="px-4 pb-2 flex items-center gap-3"
          style={{ paddingTop: "max(52px, env(safe-area-inset-top, 52px))" }}
        >
          <button
            onClick={onBack}
            className="tap-target zm-beam-border flex-shrink-0 flex items-center justify-center rounded-2xl font-bold text-sm transition active:scale-95"
            style={{
              width: 44,
              height: 44,
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.2px solid rgba(16, 185, 129, 0.4)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              color: "#183B34",
              fontSize: 18,
            }}
          >
            {lang === "ur" ? "→" : "←"}
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ProductIcon
              name={byproduct || product}
              vertical={vertical}
              size={36}
            />
            <div className="min-w-0">
              <h1
                className="font-extrabold truncate leading-tight"
                style={{
                  fontSize: lang === "ur" ? 22 : 20,
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                  color: "#183B34",
                }}
              >
                {tc(title)}
              </h1>
              <p
                className="text-[11px] truncate font-medium mt-0.5"
                style={{
                  color: "#80918B",
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                }}
              >
                {lang === "ur"
                  ? "پورے پاکستان میں مارکیٹ ریٹس"
                  : "Market rates across Pakistan"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              togglePickBP(pickItem);
              if (voiceEnabled) {
                speakText(
                  picked
                    ? lang === "ur"
                      ? "پسندیدہ سے ہٹا دیا گیا"
                      : "Removed from favorites"
                    : lang === "ur"
                      ? "پسندیدہ میں شامل کر دیا گیا"
                      : "Added to favorites",
                );
              }
            }}
            aria-label={picked ? "Remove from favorites" : "Add to favorites"}
            className="tap-target zm-beam-border zm-beam-border-pink w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition active:scale-90"
            style={{
              background: picked ? "rgba(255, 235, 235, 0.85)" : "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: picked ? "#E11D48" : "#80918B",
              border: picked ? "1.5px solid #FDA4AF" : "1.2px solid rgba(16, 185, 129, 0.4)",
              boxShadow: picked
                ? "0 2px 8px rgba(225,29,72,0.18)"
                : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={picked ? "#E11D48" : "none"}
              stroke={picked ? "#E11D48" : "currentColor"}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
        <div className="px-4 pb-2 flex gap-1.5">
          {(
            [
              ["overview", lang === "ur" ? "جائزہ" : "Overview"],
              ["trends", lang === "ur" ? "رجحانات" : "Trends"],
            ] as ["overview" | "trends", string][]
          ).map(([tTab, label]) => (
            <button
              key={tTab}
              onClick={() => {
                setTab(tTab);
                if (voiceEnabled) {
                  speakText(label);
                }
              }}
              className="tap-target zm-beam-border flex-1 rounded-xl font-bold text-sm transition active:scale-95"
              style={{
                height: lang === "ur" ? 44 : 40,
                background:
                  tab === tTab
                    ? "linear-gradient(135deg, rgba(8, 127, 99, 0.9), rgba(5, 150, 105, 0.85))"
                    : "rgba(255, 255, 255, 0.6)",
                border:
                  tab === tTab
                    ? "1.2px solid rgba(255, 255, 255, 0.4)"
                    : "1.2px solid rgba(16, 185, 129, 0.3)",
                color: tab === tTab ? "#FFFFFF" : "#064E3B",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow:
                  tab === tTab
                    ? "0 4px 14px rgba(8, 127, 99, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.45)"
                    : "0 2px 6px rgba(0, 0, 0, 0.04)",
                fontSize: lang === "ur" ? 18 : 14,
                fontFamily:
                  lang === "ur"
                    ? URDU_FONT
                    : "inherit",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* 1. OVERVIEW SCREEN CONTAINER - 100% Isolated */}
      {tab === "overview" && (
        <div
          className="flex-1 min-h-0 overflow-y-auto px-3.5 pt-2 pb-6 flex flex-col gap-2"
          style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
        >
          {/* Today-Only Free Preview Notice Banner */}
          {isProductTodayOnly(product) && (
            <div
              style={{
                background: "linear-gradient(135deg, #E6F7F0, #D1EFE4)",
                border: "1.5px solid #2FAE68",
                borderRadius: 16,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                boxShadow: "0 2px 10px rgba(8,127,99,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <div>
                  <div
                    style={{ fontSize: 12.5, fontWeight: 800, color: "#064D40" }}
                  >
                    {lang === "ur"
                      ? "صرف آج کا ڈیٹا فعال ہے"
                      : "Today's Free Data Preview"}
                  </div>
                  <div style={{ fontSize: 11, color: "#2E5C4E" }}>
                    {lang === "ur"
                      ? "ماضی کا مکمل ڈیٹا دیکھنے کے لیے سبسکرائب کریں۔"
                      : "Data before today is locked. Subscribe to unlock history."}
                  </div>
                </div>
              </div>
              <button
                onClick={() => push?.({ id: "billing", product, vertical })}
                style={{
                  background: "#087F63",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(8,127,99,0.2)",
                }}
              >
                {lang === "ur" ? "سبسکرائب" : "Subscribe"}
              </button>
            </div>
          )}

          {tab === "overview" && (
            <>

              {/* Dismiss stat date calendar on outside click */}
              {statDateCalOpen && (
                <div
                  className="fixed inset-0 z-[99]"
                  onClick={() => setStatDateCalOpen(false)}
                />
              )}

              {/* 4-Sided Continuous Racetrack Border Card (Rounded Corners & Compact) */}
              {/* 4-Sided Continuous Racetrack Border Card (Rounded Corners & Compact) */}
              {(() => {
                // Resolve active mandi, district and province from real data (allRows) or LOCATIONS
                let cleanMandiName = "Pakpattan Mandi";
                let mandiDist = "Pakpattan";
                let mandiProvince = "Punjab";

                if (locScope.kind === "mandi") {
                  const targetClean = locScope.label
                    .toLowerCase()
                    .replace(/\s*(mandi|منڈی)$/i, "")
                    .trim();

                  // 1. Try finding in real rows
                  const matchedRow = allRows.find((r) => {
                    const rName = r.mandiName
                      .toLowerCase()
                      .replace(/\s*(mandi|منڈی)$/i, "")
                      .trim();
                    const rCity = (r.mandiCity || "")
                      .toLowerCase()
                      .replace(/\s*(mandi|منڈی)$/i, "")
                      .trim();
                    return rName === targetClean || rCity === targetClean || rName.includes(targetClean) || targetClean.includes(rName);
                  });

                  if (matchedRow) {
                    const mPure = matchedRow.mandiName.replace(/\s*(mandi|منڈی)$/i, "").trim();
                    cleanMandiName = lang === "ur"
                      ? (tm(mPure).includes("منڈی") ? tm(mPure) : `${tm(mPure)} منڈی`)
                      : `${mPure} Mandi`;
                    mandiDist = matchedRow.mandiCity || mPure;
                    mandiProvince = matchedRow.province || "Punjab";
                  } else {
                    // 2. Try finding in LOCATIONS hierarchy
                    let found = false;
                    for (const [p, distMap] of Object.entries(LOCATIONS)) {
                      for (const [d, mandisArray] of Object.entries(distMap)) {
                        if (mandisArray.some((m) => m.toLowerCase().replace(/\s*(mandi|منڈی)$/i, "").trim() === targetClean || m.toLowerCase().includes(targetClean))) {
                          const mPure = locScope.label.replace(/\s*(mandi|منڈی)$/i, "").trim();
                          cleanMandiName = lang === "ur"
                            ? (tm(mPure).includes("منڈی") ? tm(mPure) : `${tm(mPure)} منڈی`)
                            : `${mPure} Mandi`;
                          mandiDist = d;
                          mandiProvince = p;
                          found = true;
                          break;
                        }
                      }
                      if (found) break;
                    }
                    if (!found) {
                      const mPure = locScope.label.replace(/\s*(mandi|منڈی)$/i, "").trim();
                      cleanMandiName = lang === "ur"
                        ? (tm(mPure).includes("منڈی") ? tm(mPure) : `${tm(mPure)} منڈی`)
                        : `${mPure} Mandi`;
                      mandiDist = mPure;
                      mandiProvince = "Punjab";
                    }
                  }
                }

                const locationButtonLabel =
                  locScope.kind === "pakistan"
                    ? (lang === "ur" ? "پورا پاکستان" : "All Pakistan")
                    : locScope.kind === "province"
                      ? (lang === "ur" ? "صوبہ " + tm(locScope.label) : locScope.label + " Province")
                      : locScope.kind === "district"
                        ? (lang === "ur" ? "ضلع " + tm(locScope.label) : locScope.label + " District")
                        : cleanMandiName;

                // Province-specific cultural styling and traditional gradient themes
                const PROVINCE_THEMES: Record<string, {
                  gradientH: string;
                  gradientV: string;
                  borderColor: string;
                  bulletColor: string;
                  pattern: "phulkari" | "ajrak" | "khyber" | "baloch" | "pakistan";
                }> = {
                  Punjab: {
                    gradientH: "linear-gradient(90deg, #033D31 0%, #087F63 50%, #033D31 100%)",
                    gradientV: "linear-gradient(180deg, #033D31 0%, #087F63 50%, #033D31 100%)",
                    borderColor: "#087F63",
                    bulletColor: "#FDE047",
                    pattern: "phulkari",
                  },
                  Sindh: {
                    gradientH: "linear-gradient(90deg, #5C0B14 0%, #B91C1C 50%, #5C0B14 100%)",
                    gradientV: "linear-gradient(180deg, #5C0B14 0%, #B91C1C 50%, #5C0B14 100%)",
                    borderColor: "#DC2626",
                    bulletColor: "#FDA4AF",
                    pattern: "ajrak",
                  },
                  KPK: {
                    gradientH: "linear-gradient(90deg, #0C4A6E 0%, #0284C7 50%, #0C4A6E 100%)",
                    gradientV: "linear-gradient(180deg, #0C4A6E 0%, #0284C7 50%, #0C4A6E 100%)",
                    borderColor: "#0284C7",
                    bulletColor: "#BAE6FD",
                    pattern: "khyber",
                  },
                  Balochistan: {
                    gradientH: "linear-gradient(90deg, #7C2D12 0%, #EA580C 50%, #7C2D12 100%)",
                    gradientV: "linear-gradient(180deg, #7C2D12 0%, #EA580C 50%, #7C2D12 100%)",
                    borderColor: "#EA580C",
                    bulletColor: "#FDBA74",
                    pattern: "baloch",
                  },
                  Pakistan: {
                    gradientH: "linear-gradient(90deg, #022c22 0%, #064e3b 50%, #022c22 100%)",
                    gradientV: "linear-gradient(180deg, #022c22 0%, #064e3b 50%, #022c22 100%)",
                    borderColor: "#059669",
                    bulletColor: "#34D399",
                    pattern: "pakistan",
                  },
                };

                const pTheme =
                  locScope.kind === "pakistan"
                    ? PROVINCE_THEMES.Pakistan
                    : locScope.kind === "province"
                      ? PROVINCE_THEMES[locScope.label] || PROVINCE_THEMES.Punjab
                      : PROVINCE_THEMES[mandiProvince] || PROVINCE_THEMES.Punjab;

                // Format Mandi triad: Mandi Name, District Name, Province Name
                const formatMandiTriad = (mPure: string, dist: string, prov: string) => {
                  const mLabel = mPure;
                  const dLabel = tm(dist);
                  const pLabel = tm(prov);
                  return lang === "ur"
                    ? `${mLabel}، ${dLabel}، ${pLabel}`
                    : `${mLabel}, ${dLabel}, ${pLabel}`;
                };

                // Build revolving racetrack strip items based on active location scope
                let baseItems: string[] = [];
                if (locScope.kind === "pakistan") {
                  const pakLabel = lang === "ur" ? "پاکستان" : "Pakistan";
                  baseItems = [pakLabel, pakLabel, pakLabel, pakLabel, pakLabel, pakLabel, pakLabel, pakLabel];
                } else if (locScope.kind === "province") {
                  const provLabel = lang === "ur" ? "صوبہ " + tm(locScope.label) : locScope.label + " Province";
                  baseItems = [provLabel, provLabel, provLabel, provLabel, provLabel, provLabel, provLabel, provLabel];
                } else if (locScope.kind === "district") {
                  const distLabel = lang === "ur" ? "ضلع " + tm(locScope.label) : locScope.label + " District";
                  baseItems = [distLabel, distLabel, distLabel, distLabel, distLabel, distLabel, distLabel, distLabel];
                } else if (locScope.kind === "mandi") {
                  const item = formatMandiTriad(cleanMandiName, mandiDist, mandiProvince);
                  baseItems = [item, item, item, item, item, item];
                } else {
                  const pakLabel = lang === "ur" ? "پاکستان" : "Pakistan";
                  baseItems = [pakLabel, pakLabel, pakLabel, pakLabel, pakLabel, pakLabel, pakLabel, pakLabel];
                }

                return (
                  <div
                    className="w-full rounded-[28px] mb-2 relative shadow-md flex-shrink-0"
                    style={{
                      background: pTheme.gradientH,
                      border: `2px solid ${pTheme.borderColor}`,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                      padding: "15px 13px",
                    }}
                  >
                    {/* Outer Strip Frame with Rounded Corners */}
                    <div className="absolute inset-0 pointer-events-none z-0 rounded-[26px] overflow-hidden">
                      {/* Traditional Cultural Background Pattern Overlay */}
                      <ProvincePatternSvg pattern={pTheme.pattern} opacity={0.32} />

                      {/* 1. TOP BORDER: Moving Left-to-Right */}
                      <div
                        className="absolute top-0 left-0 right-0 overflow-hidden flex items-center z-10 pointer-events-none"
                        style={{
                          height: 16,
                          background: pTheme.gradientH,
                          color: "#FFFFFF",
                          borderBottom: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        <div
                          className="racetrack-track-l2r flex items-center font-bold text-[9px] tracking-wide"
                          style={{
                            fontFamily:
                              lang === "ur"
                                ? URDU_FONT
                                : "inherit",
                          }}
                        >
                          <div className="flex items-center gap-3.5 flex-shrink-0 pr-3.5">
                            {baseItems.map((name, i) => (
                              <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                                <span>{name}</span>
                                <span style={{ color: pTheme.bulletColor, fontSize: 7 }}>•</span>
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3.5 flex-shrink-0 pr-3.5">
                            {baseItems.map((name, i) => (
                              <span key={`dup-${i}`} className="flex items-center gap-1.5 whitespace-nowrap">
                                <span>{name}</span>
                                <span style={{ color: pTheme.bulletColor, fontSize: 7 }}>•</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 2. RIGHT BORDER: Moving Top-to-Bottom */}
                      <div
                        className="absolute top-0 right-0 bottom-0 overflow-hidden z-10 pointer-events-none"
                        style={{
                          width: 16,
                          background: pTheme.gradientV,
                          color: "#FFFFFF",
                          borderLeft: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: 1000,
                            height: 16,
                            transformOrigin: "0 0",
                            transform: "rotate(90deg) translateY(-100%)",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <div
                            className="racetrack-track-l2r flex items-center font-bold text-[9px] tracking-wide"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            <div className="flex items-center gap-3.5 flex-shrink-0 pr-3.5">
                              {baseItems.map((name, i) => (
                                <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span>{name}</span>
                                  <span style={{ color: pTheme.bulletColor, fontSize: 7 }}>•</span>
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-3.5 flex-shrink-0 pr-3.5">
                              {baseItems.map((name, i) => (
                                <span key={`dup-${i}`} className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span>{name}</span>
                                  <span style={{ color: pTheme.bulletColor, fontSize: 7 }}>•</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. BOTTOM BORDER: Moving Right-to-Left */}
                      <div
                        className="absolute bottom-0 left-0 right-0 overflow-hidden flex items-center z-10 pointer-events-none"
                        style={{
                          height: 16,
                          background: pTheme.gradientH,
                          color: "#FFFFFF",
                          borderTop: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        <div
                          className="racetrack-track-r2l flex items-center font-bold text-[9px] tracking-wide"
                          style={{
                            fontFamily:
                              lang === "ur"
                                ? URDU_FONT
                                : "inherit",
                          }}
                        >
                          <div className="flex items-center gap-3.5 flex-shrink-0 pr-3.5">
                            {baseItems.map((name, i) => (
                              <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                                <span>{name}</span>
                                <span style={{ color: pTheme.bulletColor, fontSize: 7 }}>•</span>
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3.5 flex-shrink-0 pr-3.5">
                            {baseItems.map((name, i) => (
                              <span key={`dup-${i}`} className="flex items-center gap-1.5 whitespace-nowrap">
                                <span>{name}</span>
                                <span style={{ color: pTheme.bulletColor, fontSize: 7 }}>•</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 4. LEFT BORDER: Moving Bottom-to-Top */}
                      <div
                        className="absolute top-0 left-0 bottom-0 overflow-hidden z-10 pointer-events-none"
                        style={{
                          width: 16,
                          background: pTheme.gradientV,
                          color: "#FFFFFF",
                          borderRight: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: 1000,
                            height: 16,
                            transformOrigin: "0 0",
                            transform: "rotate(90deg) translateY(-100%)",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <div
                            className="racetrack-track-r2l flex items-center font-bold text-[9px] tracking-wide"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            <div className="flex items-center gap-3.5 flex-shrink-0 pr-3.5">
                              {baseItems.map((name, i) => (
                                <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span>{name}</span>
                                  <span style={{ color: pTheme.bulletColor, fontSize: 7 }}>•</span>
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-3.5 flex-shrink-0 pr-3.5">
                              {baseItems.map((name, i) => (
                                <span key={`dup-${i}`} className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span>{name}</span>
                                  <span style={{ color: pTheme.bulletColor, fontSize: 7 }}>•</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CENTER CONTENT: Inner White Card */}
                    <div
                      className="relative z-10 rounded-[18px] p-2.5 shadow-sm flex flex-col"
                      style={{
                        background: "#FFFFFF",
                      }}
                    >
                      {/* TOP SECTION: Full-width Location dropdown (left) & Date Picker Badge (right) */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Location Dropdown Pill */}
                        <button
                          onClick={() => {
                            setLocSheet(true);
                            if (voiceEnabled) {
                              speakText(lang === "ur" ? "مقام کا انتخاب" : "Select location");
                            }
                          }}
                          className="tap-target flex items-center gap-2 py-1.5 px-3 rounded-2xl transition active:scale-95 text-left group min-w-0 flex-1"
                          style={{
                            background: "#E8F5EE",
                            border: "1.2px solid #A7F3D0",
                            maxWidth: "fit-content",
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: "#087F63", color: "#FFFFFF" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 21h18" />
                              <path d="M5 21V7l7-4 7 4v14" />
                              <path d="M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11H9V10z" />
                            </svg>
                          </div>
                          <span
                            className="font-extrabold text-[13px] sm:text-[14px] text-[#143B33] leading-none truncate max-w-[140px] sm:max-w-[200px]"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {locationButtonLabel}
                          </span>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-80">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {/* Compact date chip — opens calendar (fixed overlay, below) */}
                        <button
                          onClick={() => setStatDateCalOpen((o) => !o)}
                          className="tap-target flex-shrink-0 overflow-hidden flex items-stretch rounded-xl shadow-sm transition active:scale-95"
                          style={{
                            border: "1.2px solid #A7F3D0",
                          }}
                        >
                          <div
                            style={{
                              background: "#087F63",
                              padding: "4px 8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              style={{
                                color: "#fff",
                                fontSize: lang === "ur" ? 11 : 10,
                                fontWeight: 800,
                                letterSpacing: 0.5,
                                fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                              }}
                            >
                              {statDateFilter
                                ? (lang === "ur"
                                  ? ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"][statDateFilter.getMonth()]
                                  : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][statDateFilter.getMonth()])
                                : (lang === "ur" ? "ستمبر" : "September")}
                            </span>
                          </div>
                          <div
                            style={{
                              background: "#FFFFFF",
                              padding: "4px 9px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderLeft: "1px solid #D5E2DD",
                            }}
                          >
                            <span style={{ color: "#143B33", fontSize: 13.5, fontWeight: 900, lineHeight: 1 }}>
                              {statDateFilter ? statDateFilter.getDate() : 14}
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* MIDDLE SECTION: 3 Metrics Grid (MAX PRICE, MIN PRICE, ARRIVAL) */}
                      <div
                        className="grid grid-cols-3 gap-2 py-2 my-1"
                        style={{
                          borderTop: "1px solid #EEF3F0",
                          borderBottom: "1px solid #EEF3F0",
                        }}
                      >
                        {/* Max Price */}
                        <div className="flex flex-col">
                          <span
                            className="font-bold text-[9px] text-[#64748B] uppercase tracking-wider leading-tight"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {lang === "ur" ? "زیادہ قیمت" : "MAX PRICE"}
                          </span>
                          <span
                            className="font-black text-[15px] sm:text-[17px] leading-tight text-[#087F63] mt-0.5 truncate"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {statMax > 0
                              ? (lang === "ur" ? `روپے\u00A0${toUrduDigits(statMax.toLocaleString("en-PK"))}` : `Rs.${statMax.toLocaleString("en-PK")}`)
                              : "—"}
                          </span>
                          <span className="text-[8.5px] font-semibold text-[#80918B] leading-none mt-0.5">
                            {statMax > 0 ? (lang === "ur" ? "(۴۰ کلو)" : "(40 KG)") : ""}
                          </span>
                        </div>

                        {/* Min Price */}
                        <div
                          className="flex flex-col pl-2 sm:pl-3"
                          style={{ borderLeft: "1px solid #EEF3F0" }}
                        >
                          <span
                            className="font-bold text-[9px] text-[#64748B] uppercase tracking-wider leading-tight"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {lang === "ur" ? "کم قیمت" : "MIN PRICE"}
                          </span>
                          <span
                            className="font-black text-[15px] sm:text-[17px] leading-tight text-[#B45309] mt-0.5 truncate"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {statMin > 0
                              ? (lang === "ur" ? `روپے\u00A0${toUrduDigits(statMin.toLocaleString("en-PK"))}` : `Rs.${statMin.toLocaleString("en-PK")}`)
                              : "—"}
                          </span>
                          <span className="text-[8.5px] font-semibold text-[#80918B] leading-none mt-0.5">
                            {statMin > 0 ? (lang === "ur" ? "(۴۰ کلو)" : "(40 KG)") : ""}
                          </span>
                        </div>

                        {/* Arrival */}
                        <div
                          className="flex flex-col pl-2 sm:pl-3"
                          style={{ borderLeft: "1px solid #EEF3F0" }}
                        >
                          <span
                            className="font-bold text-[9px] text-[#64748B] uppercase tracking-wider leading-tight"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {lang === "ur" ? "آمد" : "ARRIVAL"}
                          </span>
                          <span
                            className="font-black text-[15px] sm:text-[17px] leading-tight text-[#087F63] mt-0.5 truncate"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {statArrival > 0
                              ? (lang === "ur"
                                ? `${toUrduDigits(statArrival.toLocaleString())}\u00A0تھیلے`
                                : `${statArrival.toLocaleString()}\u00A0Bags`)
                              : "—"}
                          </span>
                          <span className="text-[8.5px] font-semibold text-[#80918B] leading-none mt-0.5">
                            {statArrival > 0 ? (lang === "ur" ? "(۴۰ کلو)" : "(40 KG)") : ""}
                          </span>
                        </div>
                      </div>

                      {/* BOTTOM SECTION: Rate Type Pill & +5 More Specs Pill */}
                      <div className="relative w-full flex items-center justify-between gap-2 pt-1">
                        {/* 1. EXPOSED RATE TYPE (Clean pill with icon, label & value) */}
                        <button
                          type="button"
                          onClick={() => setAttrSheet(attrSheet === "ratetype" ? null : "ratetype")}
                          className={`tap-target flex items-center gap-2 py-1.5 px-3 rounded-2xl border transition-all duration-150 active:scale-95 min-w-0 ${attrSheet === "ratetype"
                            ? "bg-[#E8F8F3] border-[#087F63] shadow-sm ring-1 ring-[#087F63]"
                            : "bg-[#E8F5EE] border-[#A7F3D0]"
                            }`}
                          title={lang === "ur" ? "نرخ کی قسم تبدیل کریں" : "Change Rate Type"}
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "#087F63", color: "#FFFFFF" }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4 19h4V9H4v10zm6 0h4V4h-4v15zm6 0h4v-7h-4v7z" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="text-[11px] font-semibold text-[#065F46] whitespace-nowrap"
                              style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                            >
                              {lang === "ur" ? "نرخ:" : "Rate:"}
                            </span>
                            <span
                              className="text-[12px] font-black text-[#064E3B] truncate"
                              style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                            >
                              {attrRateType ? tr(attrRateType) : (lang === "ur" ? "منڈی ریٹ" : "Mandi Rate")}
                            </span>
                            <svg
                              width="8"
                              height="8"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#087F63"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`flex-shrink-0 transition-transform duration-200 ${attrSheet === "ratetype" ? "rotate-180" : ""
                                }`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </button>

                        {/* 2. EXPAND / COLLAPSE 5 MORE ATTRIBUTES */}
                        <button
                          type="button"
                          onClick={() => setIsAttrPanelOpen(!isAttrPanelOpen)}
                          className="tap-target flex items-center gap-2 py-1.5 px-3 rounded-2xl border transition-all duration-150 active:scale-95 flex-shrink-0"
                          style={{
                            background: isAttrPanelOpen ? "#F0F8F4" : "#FFFFFF",
                            borderColor: isAttrPanelOpen ? "#A7F3D0" : "#D5E2DD",
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isAttrPanelOpen ? "#E8F5EE" : "#F3F4F6",
                              color: isAttrPanelOpen ? "#087F63" : "#4B5563",
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
                            </svg>
                          </div>
                          <span
                            className="text-[11px] font-extrabold"
                            style={{
                              color: isAttrPanelOpen ? "#087F63" : "#374151",
                              fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                            }}
                          >
                            {isAttrPanelOpen
                              ? (lang === "ur" ? "چھپائیں" : "Hide")
                              : (lang === "ur" ? "+۵ مزید اوصاف" : "+5 More Specs")}
                          </span>
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={isAttrPanelOpen ? "#087F63" : "#6B7280"}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform duration-200 ${isAttrPanelOpen ? "rotate-180" : ""}`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {/* FLOATING RATE TYPE POPOVER CARD */}
                        {attrSheet === "ratetype" && (
                          <>
                            <div
                              className="fixed inset-0 z-40 bg-transparent"
                              onClick={() => setAttrSheet(null)}
                            />
                            <div
                              className="absolute z-50 top-[40px] left-0 w-[58%] min-w-[190px] bg-white rounded-2xl p-3 shadow-2xl border border-[#E2E8F0] flex flex-col animate-fadeIn"
                              style={{
                                boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
                                maxHeight: "230px",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Upward Pointer Notch */}
                              <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-t border-l border-[#E2E8F0] rotate-45" />

                              {/* Header Title */}
                              <div className="font-bold text-[13px] text-[#183B34] pb-1.5 border-b border-[#F1F5F9] flex-shrink-0">
                                {lang === "ur" ? "نرخ کی قسم" : "Rate Type"}
                              </div>

                              {/* Single-Select Radio Options List */}
                              <div
                                className="flex flex-col gap-1 py-1 flex-1 min-h-0 overflow-y-auto pr-1 zm-popover-scrollbar"
                                style={{
                                  scrollbarWidth: "thin",
                                  scrollbarColor: "#087F63 #F1F5F9",
                                  WebkitOverflowScrolling: "touch",
                                }}
                              >
                                {ALL_RATE_TYPES.map((rt) => {
                                  const isSelected = attrRateType === rt;
                                  return (
                                    <button
                                      key={rt}
                                      type="button"
                                      onClick={() => {
                                        setAttrRateType((prev) => (prev === rt ? null : rt));
                                      }}
                                      className="tap-target flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-[#F8FAF9] transition text-left cursor-pointer active:scale-98"
                                    >
                                      <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "border-[#087F63]" : "border-[#9CA3AF]"
                                          }`}
                                      >
                                        {isSelected && (
                                          <div className="w-2 h-2 rounded-full bg-[#087F63]" />
                                        )}
                                      </div>
                                      <span
                                        className={`text-[12.5px] truncate ${isSelected ? "font-bold text-[#087F63]" : "font-medium text-[#374151]"
                                          }`}
                                        style={{
                                          fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                        }}
                                      >
                                        {tr(rt)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Done Button in Fixed Footer */}
                              <div className="flex justify-end pt-1.5 border-t border-[#F1F5F9] mt-auto flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setAttrSheet(null)}
                                  className="px-4 py-1.5 bg-[#087F63] text-white rounded-lg text-[12px] font-bold hover:bg-[#066A52] active:scale-95 transition shadow-sm"
                                  style={{
                                    fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                  }}
                                >
                                  {lang === "ur" ? "ہو گیا" : "Done"}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* BOTTOM SECTION: 6 Attributes (2-column cards matching user design) */}
                      {isAttrPanelOpen && (() => {
                        const specKeysLeft = [
                          {
                            key: "color",
                            label: lang === "ur" ? "رنگ" : "Color",
                            val: attrColor ? t(attrColor) : "--",
                            rawVal: attrColor,
                            icon: (
                              <div
                                className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
                                style={{
                                  background: "radial-gradient(circle at 35% 35%, #FDE047, #CA8A04, #854D0E)",
                                }}
                              />
                            ),
                          },
                          {
                            key: "spec",
                            label: lang === "ur" ? "خصوصیت" : "Spec",
                            val: attrSpec ? t(attrSpec) : "--",
                            rawVal: attrSpec,
                            icon: (
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#087F63"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="flex-shrink-0"
                              >
                                <line x1="8" y1="6" x2="21" y2="6" />
                                <line x1="8" y1="12" x2="21" y2="12" />
                                <line x1="8" y1="18" x2="21" y2="18" />
                                <circle cx="3.5" cy="6" r="1" fill="#087F63" />
                                <circle cx="3.5" cy="12" r="1" fill="#087F63" />
                                <circle cx="3.5" cy="18" r="1" fill="#087F63" />
                              </svg>
                            ),
                          },
                          {
                            key: "variety",
                            label: lang === "ur" ? "قسم" : "Variety",
                            val: attrVariety ? tc(attrVariety) : "--",
                            rawVal: attrVariety,
                            icon: (
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="#087F63"
                                className="flex-shrink-0"
                              >
                                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3 8 0 12-7 12-12zm-3.5 6.5C11 15 9 17 8 19c2.5-3 5-4.5 5.5-4.5z" />
                              </svg>
                            ),
                          },
                        ];

                        const specKeysRight = [
                          {
                            key: "newold",
                            label: lang === "ur" ? "معیار" : "Quality",
                            val: attrNewOld ? t(attrNewOld) : "--",
                            rawVal: attrNewOld,
                            icon: (
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="#087F63"
                                className="flex-shrink-0"
                              >
                                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3 8 0 12-7 12-12zm-3.5 6.5C11 15 9 17 8 19c2.5-3 5-4.5 5.5-4.5z" />
                              </svg>
                            ),
                          },
                          {
                            key: "condition",
                            label: lang === "ur" ? "حالت" : "Condition",
                            val: attrCondition ? t(attrCondition) : "--",
                            rawVal: attrCondition,
                            icon: (
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#087F63"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="flex-shrink-0"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ),
                          },
                          {
                            key: "moisture",
                            label: lang === "ur" ? "نمی" : "Moisture",
                            val: attrMoisture
                              ? (lang === "ur"
                                ? `${toUrduDigits(attrMoisture)}${attrMoisture.includes("٪") || attrMoisture.includes("%") ? "" : "٪"}`
                                : `${attrMoisture}${attrMoisture.includes("%") ? "" : "%"}`)
                              : "--",
                            rawVal: attrMoisture,
                            icon: (
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="#087F63"
                                className="flex-shrink-0"
                              >
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                              </svg>
                            ),
                          },
                        ];

                        const isRightColActive =
                          attrSheet === "newold" ||
                          attrSheet === "condition" ||
                          attrSheet === "moisture";
                        const isLeftColActive =
                          attrSheet === "color" ||
                          attrSheet === "spec" ||
                          attrSheet === "variety";

                        const popoverTop =
                          attrSheet === "color" || attrSheet === "newold"
                            ? "46px"
                            : attrSheet === "spec" || attrSheet === "condition"
                              ? "94px"
                              : "142px";

                        // Build single-choice options for active filter
                        const getSpecOptions = (k: string): string[] => {
                          if (k === "newold") return ["New", "Old"];
                          if (k === "moisture") return ["10-14%", "14-16%", "16-18%", "18-20%"];
                          if (k === "color") return ["Golden", "White", "Brown", "Yellow", "Red", "Green", "Black"];
                          if (k === "spec") return ["Dry", "Fresh", "Standard", "Special"];
                          if (k === "condition") return ["Fine", "Fair", "FAQ", "Average"];
                          if (k === "variety") {
                            const disc = Array.from(
                              new Set(
                                allRows
                                  .map((r) => r.variety)
                                  .filter((v): v is string => Boolean(v && v.trim()))
                              )
                            ).sort();
                            return disc.length > 0 ? disc : ["Super Karnal", "Kainat 1121", "Basmati 515", "Super Kernel", "Basmati 386", "IRRI 6", "IRRI 9"];
                          }
                          return [];
                        };

                        const activeOpts = attrSheet ? getSpecOptions(attrSheet) : [];
                        const activeTitle =
                          attrSheet === "newold"
                            ? (lang === "ur" ? "معیار" : "Quality")
                            : attrSheet === "moisture"
                              ? (lang === "ur" ? "نمی" : "Moisture")
                              : attrSheet === "color"
                                ? (lang === "ur" ? "رنگ" : "Color")
                                : attrSheet === "spec"
                                  ? (lang === "ur" ? "خصوصیت" : "Spec")
                                  : attrSheet === "variety"
                                    ? (lang === "ur" ? "قسم" : "Variety")
                                    : attrSheet === "condition"
                                      ? (lang === "ur" ? "حالت" : "Condition")
                                      : "";

                        const activeCurrVal =
                          attrSheet === "newold"
                            ? attrNewOld
                            : attrSheet === "moisture"
                              ? attrMoisture
                              : attrSheet === "color"
                                ? attrColor
                                : attrSheet === "spec"
                                  ? attrSpec
                                  : attrSheet === "variety"
                                    ? attrVariety
                                    : attrSheet === "condition"
                                      ? attrCondition
                                      : null;

                        const setSpecVal = (v: string) => {
                          if (attrSheet === "newold") setAttrNewOld((prev) => (prev === v ? null : v));
                          else if (attrSheet === "moisture") setAttrMoisture((prev) => (prev === v ? null : v));
                          else if (attrSheet === "color") setAttrColor((prev) => (prev === v ? null : v));
                          else if (attrSheet === "spec") setAttrSpec((prev) => (prev === v ? null : v));
                          else if (attrSheet === "variety") setAttrVariety((prev) => (prev === v ? null : v));
                          else if (attrSheet === "condition") setAttrCondition((prev) => (prev === v ? null : v));
                        };

                        const formatOptLabel = (k: string, opt: string) => {
                          if (k === "variety") return tc(opt);
                          if (k === "moisture") {
                            return lang === "ur"
                              ? `${toUrduDigits(opt)}${opt.includes("٪") || opt.includes("%") ? "" : "٪"}`
                              : `${opt}${opt.includes("%") ? "" : "%"}`;
                          }
                          return t(opt);
                        };

                        return (
                          <div className="relative pt-2 animate-fadeIn">
                            {/* Backdrop when floating popup is active */}
                            {(isLeftColActive || isRightColActive) && (
                              <div
                                className="fixed inset-0 z-30 bg-transparent"
                                onClick={() => setAttrSheet(null)}
                              />
                            )}

                            {/* 2-COLUMN TILES GRID */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* LEFT COLUMN */}
                              <div className="flex flex-col gap-1.5">
                                {specKeysLeft.map((item) => {
                                  const isActive = attrSheet === item.key;
                                  return (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() =>
                                        setAttrSheet(isActive ? null : item.key)
                                      }
                                      className={`tap-target w-full h-[42px] flex items-center justify-between px-2.5 py-1 rounded-xl border transition-all text-left active:scale-[0.98] ${isActive
                                        ? "bg-[#E8F8F3] border-[#087F63] shadow-sm ring-1 ring-[#087F63]"
                                        : "bg-white border-[#E5E7EB] hover:bg-[#F9FBFA]"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {item.icon}
                                        <div className="min-w-0 flex-1 flex flex-col justify-center leading-tight">
                                          <span
                                            className="text-[9.5px] font-bold text-[#6B7280] block truncate"
                                            style={{
                                              fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                            }}
                                          >
                                            {item.label}
                                          </span>
                                          <span
                                            className={`text-[12px] font-bold block truncate mt-0.5 ${isActive ? "text-[#087F63]" : "text-[#1F2937]"
                                              }`}
                                            style={{
                                              fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                            }}
                                          >
                                            {item.val}
                                          </span>
                                        </div>
                                      </div>
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke={isActive ? "#087F63" : "#9CA3AF"}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="flex-shrink-0 transition-transform"
                                      >
                                        {isActive ? (
                                          <polyline points="18 15 12 9 6 15" />
                                        ) : (
                                          <polyline points="9 18 15 12 9 6" />
                                        )}
                                      </svg>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* RIGHT COLUMN */}
                              <div className="flex flex-col gap-1.5">
                                {specKeysRight.map((item) => {
                                  const isActive = attrSheet === item.key;
                                  return (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() =>
                                        setAttrSheet(isActive ? null : item.key)
                                      }
                                      className={`tap-target w-full h-[42px] flex items-center justify-between px-2.5 py-1 rounded-xl border transition-all text-left active:scale-[0.98] ${isActive
                                        ? "bg-[#E8F8F3] border-[#087F63] shadow-sm ring-1 ring-[#087F63]"
                                        : "bg-white border-[#E5E7EB] hover:bg-[#F9FBFA]"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {item.icon}
                                        <div className="min-w-0 flex-1 flex flex-col justify-center leading-tight">
                                          <span
                                            className="text-[9.5px] font-bold text-[#6B7280] block truncate"
                                            style={{
                                              fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                            }}
                                          >
                                            {item.label}
                                          </span>
                                          <span
                                            className={`text-[12px] font-bold block truncate mt-0.5 ${isActive ? "text-[#087F63]" : "text-[#1F2937]"
                                              }`}
                                            style={{
                                              fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                            }}
                                          >
                                            {item.val}
                                          </span>
                                        </div>
                                      </div>
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke={isActive ? "#087F63" : "#9CA3AF"}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="flex-shrink-0 transition-transform"
                                      >
                                        {isActive ? (
                                          <polyline points="18 15 12 9 6 15" />
                                        ) : (
                                          <polyline points="9 18 15 12 9 6" />
                                        )}
                                      </svg>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* FLOATING DROPDOWN POPOVER CARD */}
                            {(isLeftColActive || isRightColActive) && (
                              <div
                                className={`absolute z-50 bg-white rounded-2xl p-3 shadow-2xl border border-[#E2E8F0] flex flex-col animate-fadeIn ${isRightColActive
                                  ? "right-0 w-[54%] min-w-[175px]"
                                  : "left-0 w-[54%] min-w-[175px]"
                                  }`}
                                style={{
                                  top: popoverTop,
                                  maxHeight: "230px",
                                  boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Upward Pointer Notch */}
                                <div
                                  className={`absolute -top-1.5 w-3 h-3 bg-white border-t border-l border-[#E2E8F0] rotate-45 ${isRightColActive ? "right-8" : "left-8"
                                    }`}
                                />

                                {/* Header Title */}
                                <div className="font-bold text-[13px] text-[#183B34] pb-1.5 border-b border-[#F1F5F9] flex-shrink-0">
                                  {activeTitle}
                                </div>

                                {/* Single-Select Radio Options List */}
                                <div
                                  className="flex flex-col gap-1 py-1 flex-1 min-h-0 overflow-y-auto pr-1 zm-popover-scrollbar"
                                  style={{
                                    scrollbarWidth: "thin",
                                    scrollbarColor: "#087F63 #F1F5F9",
                                    WebkitOverflowScrolling: "touch",
                                  }}
                                >
                                  {activeOpts.map((opt) => {
                                    const isSelected = activeCurrVal === opt;
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setSpecVal(opt)}
                                        className="tap-target flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-[#F8FAF9] transition text-left cursor-pointer active:scale-98"
                                      >
                                        <div
                                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                            ? "border-[#087F63]"
                                            : "border-[#9CA3AF]"
                                            }`}
                                        >
                                          {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-[#087F63]" />
                                          )}
                                        </div>
                                        <span
                                          className={`text-[12.5px] truncate ${isSelected
                                            ? "font-bold text-[#087F63]"
                                            : "font-medium text-[#374151]"
                                            }`}
                                          style={{
                                            fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                          }}
                                        >
                                          {formatOptLabel(attrSheet!, opt)}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Done Button in Fixed Footer */}
                                <div className="flex justify-end pt-1.5 border-t border-[#F1F5F9] mt-auto flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setAttrSheet(null)}
                                    className="px-4 py-1.5 bg-[#087F63] text-white rounded-lg text-[12px] font-bold hover:bg-[#066A52] active:scale-95 transition shadow-sm"
                                    style={{
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {lang === "ur" ? "ہو گیا" : "Done"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}

              {/* Date Calendar Popup (fixed overlay) */}
              {statDateCalOpen && (() => {
                const mn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const mnUr = ["\u062c\u0646\u0648\u0631\u06cc", "\u0641\u0631\u0648\u0631\u06cc", "\u0645\u0627\u0631\u0686", "\u0627\u067e\u0631\u06cc\u0644", "\u0645\u0626\u06cc", "\u062c\u0648\u0646", "\u062c\u0648\u0644\u0627\u0626\u06cc", "\u0627\u06af\u0633\u062a", "\u0633\u062a\u0645\u0628\u0631", "\u0627\u06a9\u062a\u0648\u0628\u0631", "\u0646\u0648\u0645\u0628\u0631", "\u062f\u0633\u0645\u0628\u0631"];
                const sdYear = statDateCalMonth.getFullYear();
                const sdMonthIdx = statDateCalMonth.getMonth();
                const sdMonthName = lang === "ur"
                  ? `${mnUr[sdMonthIdx]} ${sdYear}`
                  : statDateCalMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                const sdFirstDow = new Date(sdYear, sdMonthIdx, 1).getDay();
                const sdDaysInMonth = new Date(sdYear, sdMonthIdx + 1, 0).getDate();
                const sdCalDays: (number | null)[] = [
                  ...Array(sdFirstDow).fill(null),
                  ...Array.from({ length: sdDaysInMonth }, (_, i) => i + 1),
                ];
                while (sdCalDays.length % 7 !== 0) sdCalDays.push(null);
                const sdIsSame = (a: Date, b: Date) =>
                  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
                const sdIsRef = (d: Date) => sdIsSame(d, new Date(2026, 8, 14));
                return (
                  <div className="fixed z-[120] rounded-2xl overflow-hidden shadow-2xl" style={{ top: "22%", right: 16, width: 260, background: "#F4FAF7", border: "1px solid #D5E2DD" }} onClick={(e) => e.stopPropagation()}>
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <button onClick={() => setStatDateCalMonth(new Date(sdYear, sdMonthIdx - 1, 1))} className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: "#E8EFEC", color: "#2F4A43", fontSize: 16 }}>&#8249;</button>
                        <p className="font-bold" style={{ color: "#183B34", fontSize: lang === "ur" ? 16 : 14, fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}>{sdMonthName}</p>
                        <button onClick={() => setStatDateCalMonth(new Date(sdYear, sdMonthIdx + 1, 1))} className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: "#E8EFEC", color: "#2F4A43", fontSize: 16 }}>&#8250;</button>
                      </div>
                      {statDateFilter && (
                        <div className="flex justify-end mb-1">
                          <button onClick={() => { setStatDateFilter(null); setStatDateCalOpen(false); }} className="font-bold px-2 py-0.5 rounded-full" style={{ background: "#F9E1DE", color: "#A83B37", fontSize: lang === "ur" ? 12 : 10, fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}>
                            {lang === "ur" ? "\u06c1\u0679\u0627\u0626\u06cc\u06ba (\u0622\u062c)" : "Clear (Today)"}
                          </button>
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
                        {(lang === "ur" ? ["\u0627\u062a", "\u067e\u06cc", "\u0645\u0646", "\u0628\u062f", "\u062c\u0645", "\u062c\u0645", "\u06c1\u0641"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]).map((d) => (
                          <div key={d} className="text-center font-bold text-[10px]" style={{ color: "#80918B", paddingBottom: 2, fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}>{d}</div>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                        {sdCalDays.map((day, idx) => {
                          if (!day) return <div key={idx} />;
                          const d = new Date(sdYear, sdMonthIdx, day);
                          const selected = statDateFilter ? sdIsSame(d, statDateFilter) : false;
                          const isRef = sdIsRef(d);
                          return (
                            <button key={idx} onClick={() => { setStatDateFilter(d); setStatDateCalOpen(false); }} className="tap-target flex items-center justify-center rounded-full font-semibold text-xs mx-auto" style={{ width: 30, height: 30, background: selected ? "#087F63" : isRef ? "#E4F2EC" : "transparent", color: selected ? "#fff" : isRef ? "#075E4F" : "#2F4A43", border: isRef && !selected ? "1.5px solid #087F63" : "none" }}>{day}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Pakistan Map Interactive Expandable Card (378x76 with 3D Tilt & Spring Expansion) */}
              {(() => {
                const currentCommodity = product || byproduct || "Wheat";
                const isPakistanScope = locScope.kind === "pakistan" || !locScope.label;

                // The map button's label + zoom target follow the specific
                // mandi/district the user picked (focusedMandi) even though
                // locScope itself has been broadened to that location's
                // province to drive the table -- so picking Okara zooms the
                // map straight to Okara while the table shows all of Punjab.
                // With nothing specific picked, it falls back to locScope
                // (a province, or All Pakistan).
                const focusedMandiEntry = focusedMandi
                  ? INITIAL_MANDIS.find(
                    (m) =>
                      m.name.toLowerCase() === focusedMandi.label.toLowerCase() ||
                      m.city.toLowerCase() === focusedMandi.label.toLowerCase() ||
                      focusedMandi.label.toLowerCase().includes(m.city.toLowerCase())
                  )
                  : undefined;

                const cmn = focusedMandi
                  ? focusedMandi.label
                  : isPakistanScope
                    ? (lang === "ur" ? "پورا پاکستان" : "All Pakistan")
                    : locScope.label;

                const prov = focusedMandi
                  ? focusedMandiEntry?.province || (locScope.kind === "province" ? locScope.label : undefined)
                  : locScope.kind === "province"
                    ? locScope.label
                    : undefined;

                const focusMandiName = focusedMandi ? focusedMandi.label : undefined;
                const focusProvinceName =
                  !focusedMandi && !isPakistanScope && locScope.kind === "province" ? locScope.label : undefined;

                // Every real row nationwide for this by-product (allRows is
                // unfiltered by the table's locScope) -- the map derives
                // which mandis get a pin, and everything shown once one is
                // tapped, from this alone.
                const mapRecords: MapByProductRecord[] = allRows.map((r) => ({
                  mandiName: r.mandiName,
                  district: r.mandiCity,
                  province: r.province,
                  rateType: r.rateType,
                  min: r.min,
                  max: r.max,
                  arrival: r.arrival,
                  date: r.date,
                  newOld: r.newOld,
                  variety: r.variety,
                  color: r.color,
                }));

                return (
                  <ExpandableMandiMapCard
                    mandiName={cmn}
                    provinceName={prov}
                    commodityName={byproduct || currentCommodity}
                    records={mapRecords}
                    focusMandiName={focusMandiName}
                    focusProvinceName={focusProvinceName}
                    lang={lang}
                    urduFont={URDU_FONT}
                  />
                );
              })()}

              {/* Inline Mandi Rates Table — all Pakistan mandis for this byproduct */}
              {(() => {
                const PROVINCES = ["Punjab", "Sindh", "KPK", "Balochistan"];
                // Source rows, honoring locScope when a specific province/district/mandi is selected
                // Source rows, honoring spec filters and locScope when a specific province/district/mandi is selected
                const tableScopedRows = rows.filter((r) => inLocScope(r));
                const tableSourceRows = tableScopedRows.length > 0 ? tableScopedRows : rows;
                const tableRows = tableSourceRows.filter(
                  (r) =>
                    !tableProvinceFilter || r.province === tableProvinceFilter,
                );
                const BASE_DATE = new Date(2026, 8, 14);
                const USER_SIGNUP_DATE = new Date(2026, 8, 10); // Sign up reference date
                const tableDateVariation = tableDateFilter
                  ? (() => {
                    const diffMs =
                      BASE_DATE.getTime() - tableDateFilter.getTime();
                    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                    return Math.max(0.88, 1 - diffDays * 0.012);
                  })()
                  : 1;
                const monthNames = [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ];
                const monthNamesUr = [
                  "جنوری",
                  "فروری",
                  "مارچ",
                  "اپریل",
                  "مئی",
                  "جون",
                  "جولائی",
                  "اگست",
                  "ستمبر",
                  "اکتوبر",
                  "نومبر",
                  "دسمبر",
                ];
                const dateLabel = tableDateFilter
                  ? lang === "ur"
                    ? `${tableDateFilter.getDate()} ${monthNamesUr[tableDateFilter.getMonth()]}`
                    : `${tableDateFilter.getDate()} ${monthNames[tableDateFilter.getMonth()]}`
                  : lang === "ur"
                    ? "آج"
                    : "Today";
                // Calendar helpers for table date picker
                const tcYear = tableDateCalMonth.getFullYear();
                const tcMonthIdx = tableDateCalMonth.getMonth();
                const tcMonthName =
                  lang === "ur"
                    ? `${monthNamesUr[tcMonthIdx]} ${tcYear}`
                    : tableDateCalMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                const tcFirstDow = new Date(tcYear, tcMonthIdx, 1).getDay();
                const tcDaysInMonth = new Date(
                  tcYear,
                  tcMonthIdx + 1,
                  0,
                ).getDate();
                const tcCalDays: (number | null)[] = [
                  ...Array(tcFirstDow).fill(null),
                  ...Array.from({ length: tcDaysInMonth }, (_, i) => i + 1),
                ];
                while (tcCalDays.length % 7 !== 0) tcCalDays.push(null);
                const tcIsSameDay = (a: Date, b: Date) =>
                  a.getFullYear() === b.getFullYear() &&
                  a.getMonth() === b.getMonth() &&
                  a.getDate() === b.getDate();
                const tcIsToday = (d: Date) =>
                  tcIsSameDay(d, new Date(2026, 8, 14));
                return (
                  <>
                    {/* Backdrop overlay when expanded in landscape mode */}
                    {isTableExpanded && (
                      <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => {
                          setIsTableExpanded(false);
                          setSelectedMandiGraphRow(null);
                          if (inDevicePreview()) requestDeviceOrientation("portrait");
                        }}
                      />
                    )}

                    <div
                      className={
                        isTableExpanded
                          ? `zm-landscape-expanded-table ${landscapeRotated && !inDevicePreview() ? "zm-force-landscape" : ""} transition-all duration-300`
                          : "rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-sm"
                      }
                      style={{
                        border: isTableExpanded ? "none" : "1.5px solid #D5E2DD",
                        background: "#F4FAF7",
                      }}
                    >
                      {/* Top Header on Bottom Sheet (portrait handle) */}
                      {isTableExpanded && !landscapeRotated && (
                        <div
                          className="w-10 h-1 rounded-full mx-auto mt-2 mb-0.5 bg-[#C7D6D0] flex-shrink-0 cursor-pointer"
                          onClick={() => {
                            setIsTableExpanded(false);
                            setSelectedMandiGraphRow(null);
                            if (inDevicePreview()) requestDeviceOrientation("portrait");
                          }}
                        />
                      )}
                      {/* Table header with title, date button, province chips & Trend Interval selector */}
                      <div
                        className="px-3 sm:px-4 pt-2 pb-2"
                        style={{
                          borderBottom: "1px solid #E8EFEC",
                          background: "#F1F7F4",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {isTableExpanded && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsTableExpanded(false);
                                  setSelectedMandiGraphRow(null);
                                  if (inDevicePreview()) requestDeviceOrientation("portrait");
                                }}
                                className="tap-target flex items-center justify-center w-7 h-7 rounded-full bg-[#E5EFEA] hover:bg-[#D5E5DE] text-[#064E3B] transition active:scale-95 flex-shrink-0"
                                title={lang === "ur" ? "واپس / بند کریں" : "Back / Close"}
                              >
                                ✕
                              </button>
                            )}
                            <div className="min-w-0">
                              <p
                                className="font-extrabold text-sm truncate"
                                style={{
                                  color: "#183B34",
                                  fontSize: lang === "ur" ? 17 : 14,
                                  fontFamily:
                                    lang === "ur"
                                      ? URDU_FONT
                                      : "inherit",
                                }}
                              >
                                {lang === "ur"
                                  ? `${tm(tableProvinceFilter || "پاکستان")} میں ${tc(title)}`
                                  : `${title} in ${tableProvinceFilter || "Pakistan"}`}
                              </p>
                              <p
                                className="text-[10px] mt-0.5"
                                style={{
                                  color: "#52635F",
                                  fontSize: lang === "ur" ? 13 : 10,
                                  fontFamily:
                                    lang === "ur"
                                      ? URDU_FONT
                                      : "inherit",
                                }}
                              >
                                {lang === "ur"
                                  ? `${tableRows.length} منڈیاں · تفصیل کے لیے منتخب کریں`
                                  : `${tableRows.length} mandi${tableRows.length !== 1 ? "s" : ""} · tap row to view details`}
                              </p>
                            </div>
                          </div>

                          {/* Top Action Buttons: Rotate Toggle, Date picker & Expand/Collapse Button */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Screen Orientation Rotate Toggle (visible when expanded) */}
                            {isTableExpanded && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = !landscapeRotated;
                                  setLandscapeRotated(next);
                                  if (inDevicePreview()) {
                                    requestDeviceOrientation(next ? "landscape" : "portrait");
                                  }
                                }}
                                className="tap-target zm-beam-border flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs transition active:scale-95"
                                style={{
                                  background: "rgba(255, 255, 255, 0.75)",
                                  color: "#064E3B",
                                  border: "1.2px solid #10B981",
                                  backdropFilter: "blur(12px)",
                                  WebkitBackdropFilter: "blur(12px)",
                                  fontSize: lang === "ur" ? 13 : 11,
                                  fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                }}
                                title={lang === "ur" ? "رخ تبدیل کریں" : "Rotate orientation"}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#064E3B"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                                </svg>
                                <span>{landscapeRotated ? (lang === "ur" ? "عمودی" : "Portrait") : (lang === "ur" ? "افقی" : "Landscape")}</span>
                              </button>
                            )}

                            {/* Expand / Collapse Table Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsTableExpanded((prev) => {
                                  if (prev) {
                                    setSelectedMandiGraphRow(null);
                                    if (inDevicePreview()) requestDeviceOrientation("portrait");
                                    return false;
                                  }
                                  setLandscapeRotated(true);
                                  if (inDevicePreview()) requestDeviceOrientation("landscape");
                                  return true;
                                });
                              }}
                              className="tap-target zm-beam-border flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs transition active:scale-95"
                              style={{
                                background: isTableExpanded
                                  ? "linear-gradient(135deg, rgba(167, 243, 208, 0.75), rgba(110, 231, 183, 0.6))"
                                  : "rgba(255, 255, 255, 0.65)",
                                color: "#064E3B",
                                border: "1.2px solid #10B981",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                boxShadow: isTableExpanded
                                  ? "0 4px 14px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.7)"
                                  : "0 2px 8px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
                                fontSize: lang === "ur" ? 14 : 12,
                                fontFamily:
                                  lang === "ur"
                                    ? URDU_FONT
                                    : "inherit",
                              }}
                              title={
                                isTableExpanded
                                  ? lang === "ur"
                                    ? "ٹیبل چھوٹا کریں"
                                    : "Collapse table"
                                  : lang === "ur"
                                    ? "ٹیبل بڑا کریں"
                                    : "Expand table"
                              }
                            >
                              {isTableExpanded ? (
                                /* Collapse icon */
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#064E3B"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="18 15 12 9 6 15" />
                                </svg>
                              ) : (
                                /* Double arrow expand icon */
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#064E3B"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="15 3 21 3 21 9" />
                                  <polyline points="9 21 3 21 3 15" />
                                  <line x1="21" y1="3" x2="14" y2="10" />
                                  <line x1="3" y1="21" x2="10" y2="14" />
                                </svg>
                              )}
                              <span>
                                {isTableExpanded
                                  ? lang === "ur"
                                    ? "چھوٹا کریں"
                                    : "Collapse"
                                  : lang === "ur"
                                    ? "پورا ٹیبل"
                                    : "Expand"}
                              </span>
                            </button>

                            {/* Date picker button */}
                            <button
                              onClick={() => setTableDateCalOpen((o) => !o)}
                              className="tap-target zm-beam-border flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs flex-shrink-0 transition active:scale-95"
                              style={{
                                background: tableDateFilter
                                  ? "linear-gradient(135deg, rgba(167, 243, 208, 0.75), rgba(110, 231, 183, 0.6))"
                                  : "rgba(255, 255, 255, 0.65)",
                                color: "#064E3B",
                                border: "1.2px solid #10B981",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                boxShadow: tableDateFilter
                                  ? "0 4px 14px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.7)"
                                  : "0 2px 8px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
                                fontSize: lang === "ur" ? 14 : 12,
                                fontFamily:
                                  lang === "ur"
                                    ? URDU_FONT
                                    : "inherit",
                              }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#064E3B"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {dateLabel}
                            </button>
                          </div>
                        </div>

                        {/* Filter row: Province chips */}
                        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                          {/* Province filter chips */}
                          <div
                            className="flex gap-1.5 overflow-x-auto pb-0.5"
                            style={{ scrollbarWidth: "none" }}
                          >
                            {[null, ...PROVINCES].map((p) => {
                              const isSelected = tableProvinceFilter === p;
                              return (
                                <button
                                  key={p || "all"}
                                  onClick={() => {
                                    setTableProvinceFilter(p);
                                    // Keep the location filter (and the map's
                                    // focus target) in sync with the chip so
                                    // the two controls never disagree.
                                    setFocusedMandi(null);
                                    setLocScope(
                                      p ? { kind: "province", label: p } : { kind: "pakistan", label: "All Pakistan" }
                                    );
                                    if (voiceEnabled) {
                                      const msg = p
                                        ? (lang === "ur" ? `صوبہ ${tm(p)}` : `${p} Province`)
                                        : (lang === "ur" ? "تمام صوبے" : "All Provinces");
                                      speakText(msg);
                                    }
                                  }}
                                  className="flex-shrink-0 zm-beam-border px-3.5 py-1 rounded-full font-bold text-xs transition active:scale-95"
                                  style={{
                                    background: isSelected
                                      ? "linear-gradient(135deg, rgba(167, 243, 208, 0.75), rgba(110, 231, 183, 0.6))"
                                      : "rgba(255, 255, 255, 0.65)",
                                    color: "#064E3B",
                                    border: "1.2px solid #10B981",
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    boxShadow: isSelected
                                      ? "0 4px 14px rgba(16, 185, 129, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.7)"
                                      : "0 2px 6px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
                                    fontSize: lang === "ur" ? 13.5 : 11,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {p
                                    ? tm(p)
                                    : lang === "ur"
                                      ? "تمام صوبے"
                                      : "All Provinces"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Inline calendar for table date picker */}
                      {tableDateCalOpen && (
                        <div
                          className="px-4 pt-3 pb-2"
                          style={{
                            borderBottom: "1px solid #D5E2DD",
                            background: "#F4FAF7",
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() =>
                                setTableDateCalMonth(
                                  new Date(tcYear, tcMonthIdx - 1, 1),
                                )
                              }
                              className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold"
                              style={{
                                background: "#E8EFEC",
                                color: "#2F4A43",
                                fontSize: 16,
                              }}
                            >
                              ‹
                            </button>
                            <p
                              className="font-bold text-sm"
                              style={{
                                color: "#183B34",
                                fontSize: lang === "ur" ? 16 : 14,
                                fontFamily:
                                  lang === "ur"
                                    ? URDU_FONT
                                    : "inherit",
                              }}
                            >
                              {tcMonthName}
                            </p>
                            <button
                              onClick={() =>
                                setTableDateCalMonth(
                                  new Date(tcYear, tcMonthIdx + 1, 1),
                                )
                              }
                              className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold"
                              style={{
                                background: "#E8EFEC",
                                color: "#2F4A43",
                                fontSize: 16,
                              }}
                            >
                              ›
                            </button>
                          </div>
                          {tableDateFilter && (
                            <div className="flex justify-end mb-1">
                              <button
                                onClick={() => {
                                  setTableDateFilter(null);
                                  setTableDateCalOpen(false);
                                }}
                                className="font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: "#F9E1DE",
                                  color: "#A83B34",
                                  fontSize: lang === "ur" ? 12 : 10,
                                  fontFamily:
                                    lang === "ur"
                                      ? URDU_FONT
                                      : "inherit",
                                }}
                              >
                                {lang === "ur" ? "تاریخ ہٹائیں" : "Clear date"}
                              </button>
                            </div>
                          )}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(7,1fr)",
                              marginBottom: 4,
                            }}
                          >
                            {(lang === "ur"
                              ? ["ات", "پی", "من", "بد", "جم", "جم", "ہف"]
                              : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
                            ).map((d) => (
                              <div
                                key={d}
                                className="text-center font-bold text-[10px]"
                                style={{
                                  color: "#80918B",
                                  paddingBottom: 2,
                                  fontFamily:
                                    lang === "ur"
                                      ? URDU_FONT
                                      : "inherit",
                                }}
                              >
                                {d}
                              </div>
                            ))}
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(7,1fr)",
                              gap: 2,
                            }}
                          >
                            {tcCalDays.map((day, idx) => {
                              if (!day) return <div key={idx} />;
                              const d = new Date(tcYear, tcMonthIdx, day);
                              const selected = tableDateFilter
                                ? tcIsSameDay(d, tableDateFilter)
                                : false;
                              const isRef = tcIsToday(d);
                              // Dates prior to user signup date are locked/blurred
                              const isPriorToSignup = d.getTime() < new Date(USER_SIGNUP_DATE.getFullYear(), USER_SIGNUP_DATE.getMonth(), USER_SIGNUP_DATE.getDate()).getTime();
                              if (isPriorToSignup) {
                                return (
                                  <button
                                    key={idx}
                                    disabled
                                    className="tap-target flex items-center justify-center rounded-full font-medium text-xs mx-auto opacity-20 cursor-not-allowed select-none"
                                    style={{
                                      width: 30,
                                      height: 30,
                                      filter: "blur(0.8px)",
                                      color: "#80918B",
                                    }}
                                    title={lang === "ur" ? "سائن اپ سے پہلے کی تاریخ" : "Locked prior to signup"}
                                  >
                                    {day}
                                  </button>
                                );
                              }

                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setTableDateFilter(d);
                                    setTableDateCalOpen(false);
                                  }}
                                  className="tap-target flex items-center justify-center rounded-full font-semibold text-xs mx-auto shadow-sm"
                                  style={{
                                    width: 30,
                                    height: 30,
                                    background: selected
                                      ? "#087F63"
                                      : isRef
                                        ? "#E4F2EC"
                                        : "#fff",
                                    color: selected
                                      ? "#fff"
                                      : isRef
                                        ? "#075E4F"
                                        : "#183B34",
                                    border:
                                      selected
                                        ? "none"
                                        : isRef
                                          ? "1.5px solid #087F63"
                                          : "1px solid #C7E8D8",
                                  }}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                          <p
                            className="text-[9.5px] text-center text-[#52635F] mt-2 opacity-80"
                            style={{
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {lang === "ur"
                              ? "* سائن اپ کی تاریخ سے پہلے کی تاریخیں غیر فعال ہیں"
                              : "* Dates prior to signup date are locked"}
                          </p>
                        </div>
                      )}

                      {/* Horizontally and vertically scrollable table container with visible scrollbars */}
                      <div
                        ref={tableScrollRef}
                        className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-auto zm-table-scroll-container"
                        style={{
                          maxHeight: isTableExpanded ? "none" : 240,
                          height: isTableExpanded ? "100%" : "auto",
                          overscrollBehavior: "contain",
                          WebkitOverflowScrolling: "touch",
                          scrollbarWidth: "thin",
                          scrollbarColor: "#087F63 #E4F2EC",
                          paddingBottom: isTableExpanded ? 24 : 4,
                        }}
                      >
                        {tableRows.length === 0 ? (
                          <div className="flex items-center justify-center py-8 opacity-50">
                            <p
                              className="font-semibold"
                              style={{
                                fontSize: lang === "ur" ? 16 : 14,
                                fontFamily:
                                  lang === "ur"
                                    ? URDU_FONT
                                    : "inherit",
                              }}
                            >
                              {lang === "ur"
                                ? `کوئی منڈی ڈیٹا دستیاب نہیں${tableProvinceFilter ? ` (${tm(tableProvinceFilter)})` : ""}`
                                : `No mandi data${tableProvinceFilter ? ` in ${tableProvinceFilter}` : ""}`}
                            </p>
                          </div>
                        ) : (
                          <table
                            style={{
                              width: "100%",
                              minWidth: "740px",
                              borderCollapse: "separate",
                              borderSpacing: 0,
                              fontSize: lang === "ur" ? 12 : 11,
                            }}
                          >
                            <thead
                              style={{
                                position: "sticky",
                                top: 0,
                                zIndex: 20,
                                background: "#F1F7F4",
                              }}
                            >
                              <tr style={{ borderBottom: "1.5px solid #D5E2DD" }}>
                                {/* 1. Station (Sticky Left Column) */}
                                <th
                                  style={{
                                    position: "sticky",
                                    left: 0,
                                    zIndex: 25,
                                    background: "#F1F7F4",
                                    padding: "7px 6px",
                                    textAlign: lang === "ur" ? "right" : "left",
                                    fontWeight: 800,
                                    fontSize: lang === "ur" ? 13 : 10,
                                    color: "#80918B",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.03em",
                                    borderBottom: "1.5px solid #D5E2DD",
                                    borderRight: "1px solid #D5E2DD",
                                    minWidth: 84,
                                    maxWidth: 90,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {lang === "ur" ? "منڈی" : "Station"}
                                </th>

                                {/* 2. Min – Max */}
                                <th
                                  style={{
                                    padding: "7px 4px",
                                    textAlign: "center",
                                    fontWeight: 800,
                                    fontSize: lang === "ur" ? 13 : 10,
                                    color: "#80918B",
                                    textTransform: "uppercase",
                                    borderBottom: "1.5px solid #D5E2DD",
                                    minWidth: 96,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {lang === "ur" ? "کم – زیادہ" : "Min – Max"}
                                </th>

                                {/* 3. Price Type */}
                                <th
                                  style={{
                                    padding: "7px 2px",
                                    textAlign: "center",
                                    fontWeight: 800,
                                    fontSize: lang === "ur" ? 13 : 9.5,
                                    color: "#80918B",
                                    textTransform: "uppercase",
                                    borderBottom: "1.5px solid #D5E2DD",
                                    minWidth: 54,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {lang === "ur" ? "قسم" : "Price Type"}
                                </th>

                                {/* 4. Primary Special Attribute First (Moisture for Maize, Color for Cotton/Sesame, Variety for Rice, Quality for Wheat/Gram/others) */}
                                {primarySpecialAttr === "moisture" && (
                                  <th
                                    style={{
                                      padding: "7px 4px",
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: lang === "ur" ? 13 : 10,
                                      color: "#80918B",
                                      textTransform: "uppercase",
                                      borderBottom: "1.5px solid #D5E2DD",
                                      minWidth: 64,
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {lang === "ur" ? "نمی" : "Moisture"}
                                  </th>
                                )}
                                {primarySpecialAttr === "color" && (
                                  <th
                                    style={{
                                      padding: "7px 4px",
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: lang === "ur" ? 13 : 10,
                                      color: "#80918B",
                                      textTransform: "uppercase",
                                      borderBottom: "1.5px solid #D5E2DD",
                                      minWidth: 64,
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {lang === "ur" ? "رنگ" : "Color"}
                                  </th>
                                )}
                                {primarySpecialAttr === "variety" && (
                                  <th
                                    style={{
                                      padding: "7px 4px",
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: lang === "ur" ? 13 : 10,
                                      color: "#80918B",
                                      textTransform: "uppercase",
                                      borderBottom: "1.5px solid #D5E2DD",
                                      minWidth: 74,
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {lang === "ur" ? "قسم" : "Variety"}
                                  </th>
                                )}
                                {primarySpecialAttr === "quality" && (
                                  <th
                                    style={{
                                      padding: "7px 4px",
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: lang === "ur" ? 13 : 10,
                                      color: "#80918B",
                                      textTransform: "uppercase",
                                      borderBottom: "1.5px solid #D5E2DD",
                                      minWidth: 64,
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {lang === "ur" ? "معیار" : "Quality"}
                                  </th>
                                )}

                                {/* 5. Trend (with Interval dropdown) */}
                                <th
                                  style={{
                                    padding: "7px 4px",
                                    textAlign: "center",
                                    fontWeight: 800,
                                    fontSize: lang === "ur" ? 13 : 9.5,
                                    color: "#80918B",
                                    textTransform: "uppercase",
                                    borderBottom: "1.5px solid #D5E2DD",
                                    minWidth: 68,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  <div className="relative inline-flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTrendDropdownOpen(!trendDropdownOpen);
                                      }}
                                      className="tap-target inline-flex items-center gap-0.5 font-extrabold uppercase tracking-wide px-1 py-0.5 rounded-md hover:bg-[#E4F2EC] transition"
                                      style={{
                                        color: "#087F63",
                                        fontSize: lang === "ur" ? 12 : 9,
                                        fontFamily:
                                          lang === "ur"
                                            ? URDU_FONT
                                            : "inherit",
                                      }}
                                      title={lang === "ur" ? "رجحان کا دورانیہ منتخب کریں" : "Select trend duration"}
                                    >
                                      <span>
                                        {lang === "ur"
                                          ? `رجحان (${tableTrendInterval === "24h" ? "24گھنٹے" : tableTrendInterval === "72h" ? "72گھنٹے" : tableTrendInterval === "weekly" ? "ہفتہ وار" : "ماہانہ"})`
                                          : `Trend (${tableTrendInterval === "24h" ? "24H" : tableTrendInterval === "72h" ? "72H" : tableTrendInterval === "weekly" ? "7D" : "30D"})`}
                                      </span>
                                      <span className="text-[9px] text-[#087F63]">▾</span>
                                    </button>

                                    {/* Dropdown Menu for Trend Interval */}
                                    {trendDropdownOpen && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-40"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTrendDropdownOpen(false);
                                          }}
                                        />
                                        <div
                                          className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-2xl border border-[#C7E8D8] py-1 min-w-[140px] text-left"
                                          style={{
                                            direction: lang === "ur" ? "rtl" : "ltr",
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="px-3 py-1 text-[10px] font-bold text-[#80918B] border-b border-[#E8EFEC] uppercase tracking-wider">
                                            {lang === "ur" ? "دورانیہ منتخب کریں" : "Select Interval"}
                                          </div>
                                          {[
                                            { id: "24h", labelUr: "24 گھنٹے (24h)", labelEn: "24 Hours (24h)" },
                                            { id: "72h", labelUr: "72 گھنٹے (72h)", labelEn: "72 Hours (72h)" },
                                            { id: "weekly", labelUr: "ہفتہ وار (7 دن)", labelEn: "Weekly (7 Days)" },
                                            { id: "monthly", labelUr: "ماہانہ (30 دن)", labelEn: "Monthly (30 Days)" },
                                          ].map((opt) => (
                                            <button
                                              key={opt.id}
                                              type="button"
                                              onClick={() => {
                                                setTableTrendInterval(opt.id as any);
                                                setTrendDropdownOpen(false);
                                              }}
                                              className="w-full px-3 py-2 text-xs font-bold flex items-center justify-between hover:bg-[#E8F5EF] transition text-left"
                                              style={{
                                                color: tableTrendInterval === opt.id ? "#087F63" : "#183B34",
                                                background: tableTrendInterval === opt.id ? "#F0F9F5" : "transparent",
                                                fontFamily:
                                                  lang === "ur"
                                                    ? URDU_FONT
                                                    : "inherit",
                                              }}
                                            >
                                              <span>{lang === "ur" ? opt.labelUr : opt.labelEn}</span>
                                              {tableTrendInterval === opt.id && (
                                                <span className="text-[#087F63] font-black text-xs">✓</span>
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </th>

                                {/* 6. Arrival Quantity */}
                                <th
                                  style={{
                                    padding: "7px 4px",
                                    textAlign: "center",
                                    fontWeight: 800,
                                    fontSize: lang === "ur" ? 13 : 10,
                                    color: "#80918B",
                                    textTransform: "uppercase",
                                    borderBottom: "1.5px solid #D5E2DD",
                                    minWidth: 64,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {lang === "ur" ? "آمد" : "Arrival"}
                                </th>

                                {/* 7. Arrival Unit */}
                                <th
                                  style={{
                                    padding: "7px 4px",
                                    textAlign: "center",
                                    fontWeight: 800,
                                    fontSize: lang === "ur" ? 13 : 10,
                                    color: "#80918B",
                                    textTransform: "uppercase",
                                    borderBottom: "1.5px solid #D5E2DD",
                                    minWidth: 74,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {lang === "ur" ? "آمد کی اکائی" : "Unit"}
                                </th>

                                {/* Remaining Spec Columns */}
                                {primarySpecialAttr !== "quality" && (
                                  <th
                                    style={{
                                      padding: "7px 4px",
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: lang === "ur" ? 13 : 10,
                                      color: "#80918B",
                                      textTransform: "uppercase",
                                      borderBottom: "1.5px solid #D5E2DD",
                                      minWidth: 64,
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {lang === "ur" ? "معیار" : "Quality"}
                                  </th>
                                )}

                                {primarySpecialAttr !== "moisture" && (
                                  <th
                                    style={{
                                      padding: "7px 4px",
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: lang === "ur" ? 13 : 10,
                                      color: "#80918B",
                                      textTransform: "uppercase",
                                      borderBottom: "1.5px solid #D5E2DD",
                                      minWidth: 64,
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {lang === "ur" ? "نمی" : "Moisture"}
                                  </th>
                                )}

                                {primarySpecialAttr !== "color" && (
                                  <th
                                    style={{
                                      padding: "7px 4px",
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: lang === "ur" ? 13 : 10,
                                      color: "#80918B",
                                      textTransform: "uppercase",
                                      borderBottom: "1.5px solid #D5E2DD",
                                      minWidth: 64,
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {lang === "ur" ? "رنگ" : "Color"}
                                  </th>
                                )}

                                {primarySpecialAttr !== "variety" && (
                                  <th
                                    style={{
                                      padding: "7px 4px",
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: lang === "ur" ? 13 : 10,
                                      color: "#80918B",
                                      textTransform: "uppercase",
                                      borderBottom: "1.5px solid #D5E2DD",
                                      minWidth: 74,
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {lang === "ur" ? "قسم" : "Variety"}
                                  </th>
                                )}

                                {/* 10. Origin */}
                                <th
                                  style={{
                                    padding: "7px 4px",
                                    textAlign: "center",
                                    fontWeight: 800,
                                    fontSize: lang === "ur" ? 13 : 10,
                                    color: "#80918B",
                                    textTransform: "uppercase",
                                    borderBottom: "1.5px solid #D5E2DD",
                                    minWidth: 70,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {lang === "ur" ? "علاقہ" : "Origin"}
                                </th>

                                {/* 11. Condition */}
                                <th
                                  style={{
                                    padding: "7px 4px",
                                    textAlign: "center",
                                    fontWeight: 800,
                                    fontSize: lang === "ur" ? 13 : 10,
                                    color: "#80918B",
                                    textTransform: "uppercase",
                                    borderBottom: "1.5px solid #D5E2DD",
                                    minWidth: 68,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {lang === "ur" ? "حالت" : "Condition"}
                                </th>

                                {/* 12. Specification */}
                                <th
                                  style={{
                                    padding: "7px 4px",
                                    textAlign: "center",
                                    fontWeight: 800,
                                    fontSize: lang === "ur" ? 13 : 10,
                                    color: "#80918B",
                                    textTransform: "uppercase",
                                    borderBottom: "1.5px solid #D5E2DD",
                                    minWidth: 84,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {lang === "ur" ? "خصوصیت" : "Specification"}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableRows.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={12}
                                    style={{
                                      padding: "32px 16px",
                                      textAlign: "center",
                                      color: "#80918B",
                                    }}
                                  >
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      <span className="text-2xl">📋</span>
                                      <p
                                        className="font-bold text-[13px] text-[#52635F]"
                                        style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                                      >
                                        {lang === "ur"
                                          ? "اس انتخاب کے لیے کوئی ڈیٹا دستیاب نہیں ہے"
                                          : "No data available for this selection"}
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                tableRows.map((r, ci) => {
                                  // Multi-interval trend calculation derived from real Excel observations
                                  const rowTimeline = getExcelTimeline({
                                    product,
                                    byproduct: r.byproduct || byproduct,
                                    locationLabel: r.mandiName,
                                    locationKind: "mandi",
                                    rateType: r.rateType,
                                    range: "year",
                                  });

                                  let rowMin = 0;
                                  let rowMax = 0;
                                  let rowArr = 0;
                                  let intervalPct = 0;
                                  let intervalTrend: "up" | "down" | "stable" = "stable";

                                  if (isDateInRange && dateIdx >= 0) {
                                    const startIdx =
                                      tableTrendInterval === "72h"
                                        ? Math.max(0, dateIdx - 3)
                                        : tableTrendInterval === "weekly"
                                          ? Math.max(0, dateIdx - 7)
                                          : tableTrendInterval === "monthly"
                                            ? 0
                                            : Math.max(0, dateIdx - 1);

                                    const sliceMins = rowTimeline.mins.slice(startIdx, dateIdx + 1).filter((v) => v > 0);
                                    rowMin = sliceMins.length > 0 ? Math.min(...sliceMins) : (rowTimeline.mins[dateIdx] ?? r.min);

                                    const sliceMaxs = rowTimeline.maxs.slice(startIdx, dateIdx + 1).filter((v) => v > 0);
                                    rowMax = sliceMaxs.length > 0 ? Math.max(...sliceMaxs) : (rowTimeline.maxs[dateIdx] ?? r.max);

                                    const sliceArrs = rowTimeline.arrivals.slice(startIdx, dateIdx + 1).filter((v) => v > 0);
                                    rowArr = sliceArrs.length > 0 ? sliceArrs.reduce((a, b) => a + b, 0) : (rowTimeline.arrivals[dateIdx] ?? parseArrival(r.arrival));

                                    const pSeries = rowTimeline.prices;
                                    const pLatest = pSeries[dateIdx] ?? 0;
                                    const pPrev = pSeries[startIdx] ?? pLatest;

                                    if (pPrev > 0 && pLatest > 0) {
                                      const delta = pLatest - pPrev;
                                      intervalPct = Math.round((Math.abs(delta) / pPrev) * 1000) / 10;
                                      if (delta > 0.01) intervalTrend = "up";
                                      else if (delta < -0.01) intervalTrend = "down";
                                    }
                                  } else {
                                    rowMin = r.min;
                                    rowMax = r.max;
                                    rowArr = parseArrival(r.arrival);
                                  }

                                  const trendArrow =
                                    intervalTrend === "up" ? "▲" : intervalTrend === "down" ? "▼" : "—";
                                  const trendColor =
                                    intervalTrend === "up"
                                      ? "#16A34A"
                                      : intervalTrend === "down"
                                        ? "#C94A43"
                                        : "#52635F";
                                  const rtColor = RATE_COLORS[r.rateType] || "#52635F";
                                  const isRowModalActive =
                                    selectedMandiGraphRow?.mandiName === r.mandiName &&
                                    selectedMandiGraphRow?.rateType === r.rateType;
                                  // If a mandi graph is selected/open, highlight only that active mandi; otherwise highlight the initial/scope mandi
                                  const isSelected = selectedMandiGraphRow
                                    ? isRowModalActive
                                    : (locScope.kind === "mandi" &&
                                      (locScope.label === r.mandiName ||
                                        locScope.label.replace(/\s*mandi$/i, "").replace(/\s*منڈی$/i, "") ===
                                        r.mandiName.replace(/\s*mandi$/i, "").replace(/\s*منڈی$/i, "")));
                                  const rowBg = isSelected
                                    ? "#E4F2EC"
                                    : ci % 2 === 0
                                      ? "#FFFFFF"
                                      : "#F8FCFA";

                                  return (
                                    <React.Fragment key={`${r.mandiName}-${r.rateType}-${ci}`}>
                                      <tr
                                        onClick={() => {
                                          // Only expand this row's own inline graph -- do NOT
                                          // change locScope here. locScope drives the whole
                                          // table + the top overview chart, so setting it on a
                                          // row click was re-scoping the entire screen down to
                                          // this one mandi instead of just expanding the row.
                                          setSelectedMandiGraphRow((prev) => {
                                            if (
                                              prev?.mandiName === r.mandiName &&
                                              prev?.rateType === r.rateType
                                            ) {
                                              return null;
                                            }
                                            if (!isTableExpanded) {
                                              setIsTableExpanded(true);
                                              setLandscapeRotated(true);
                                            }
                                            return {
                                              mandiName: r.mandiName,
                                              rateType: r.rateType,
                                              min: rowMin,
                                              max: rowMax,
                                              trend: intervalTrend,
                                              trendPct: intervalPct,
                                              arrival: rowArr > 0 ? rowArr : undefined,
                                            };
                                          });

                                          if (voiceEnabled) {
                                            const cleanMandi = r.mandiName.replace(/\s*mandi$/i, "").replace(/\s*منڈی$/i, "");
                                            const minVal = rowMin > 0 ? rowMin.toLocaleString("en-PK") : "";
                                            const maxVal = rowMax > 0 ? rowMax.toLocaleString("en-PK") : "";
                                            const rtUr = tr(r.rateType).replace(" ریٹ", "").replace(" Rate", "");
                                            const spoken = lang === "ur"
                                              ? `${tm(cleanMandi)} منڈی، ${rtUr}، ریٹ ${minVal} سے ${maxVal} روپے`
                                              : `${cleanMandi} Mandi, ${r.rateType} rate, ${minVal} to ${maxVal} rupees`;
                                            speakText(spoken);
                                          }
                                        }}
                                        className="cursor-pointer transition hover:bg-[#EAF5F0]"
                                        style={{
                                          background: rowBg,
                                          borderBottom: isRowModalActive ? "none" : "1px solid #EBF2EE",
                                        }}
                                      >
                                        {/* 1. Station (Sticky) */}
                                        <td
                                          style={{
                                            position: "sticky",
                                            left: 0,
                                            zIndex: 10,
                                            background: rowBg,
                                            padding: "7px 6px",
                                            fontWeight: 700,
                                            color: "#183B34",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: 90,
                                            borderRight: "1px solid #D5E2DD",
                                            fontFamily:
                                              lang === "ur"
                                                ? URDU_FONT
                                                : "inherit",
                                          }}
                                        >
                                          {tm(
                                            r.mandiName
                                              .replace(/\s*mandi$/i, "")
                                              .replace(/\s*منڈی$/i, ""),
                                          )}
                                        </td>

                                        {/* 2. Min – Max */}
                                        <td
                                          style={{
                                            padding: "7px 4px",
                                            textAlign: "center",
                                            color: rowMin > 0 ? "#087F63" : "#80918B",
                                            fontWeight: 800,
                                            fontSize: 11,
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {rowMin > 0 && rowMax > 0
                                            ? `${rowMin.toLocaleString("en-PK")} – ${rowMax.toLocaleString("en-PK")}`
                                            : "—"}
                                        </td>

                                        {/* 3. Price Type */}
                                        <td
                                          style={{
                                            padding: "7px 2px",
                                            textAlign: "center",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          <span
                                            className="px-1.5 py-0.5 rounded-md font-bold text-[9px]"
                                            style={{
                                              background: `${rtColor}15`,
                                              color: rtColor,
                                              fontFamily:
                                                lang === "ur"
                                                  ? URDU_FONT
                                                  : "inherit",
                                            }}
                                          >
                                            {tr(r.rateType)
                                              .replace(" ریٹ", "")
                                              .replace(" Rate", "")}
                                          </span>
                                        </td>

                                        {/* 4. Primary Special Attribute First */}
                                        {primarySpecialAttr === "moisture" && (
                                          <td
                                            style={{
                                              padding: "7px 4px",
                                              textAlign: "center",
                                              color: "#087F63",
                                              fontWeight: 700,
                                              fontSize: 10,
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {r.moisture ? (r.moisture.includes("%") ? r.moisture : `${r.moisture}%`) : "—"}
                                          </td>
                                        )}
                                        {primarySpecialAttr === "color" && (
                                          <td
                                            style={{
                                              padding: "7px 4px",
                                              textAlign: "center",
                                              color: "#52635F",
                                              fontWeight: 600,
                                              fontSize: 10,
                                              whiteSpace: "nowrap",
                                              fontFamily:
                                                lang === "ur"
                                                  ? URDU_FONT
                                                  : "inherit",
                                            }}
                                          >
                                            {r.color ? tc(r.color) : "—"}
                                          </td>
                                        )}
                                        {primarySpecialAttr === "variety" && (
                                          <td
                                            style={{
                                              padding: "7px 4px",
                                              textAlign: "center",
                                              color: "#52635F",
                                              fontWeight: 600,
                                              fontSize: 10,
                                              whiteSpace: "nowrap",
                                              fontFamily:
                                                lang === "ur"
                                                  ? URDU_FONT
                                                  : "inherit",
                                            }}
                                          >
                                            {r.variety || "—"}
                                          </td>
                                        )}
                                        {primarySpecialAttr === "quality" && (
                                          <td
                                            style={{
                                              padding: "7px 4px",
                                              textAlign: "center",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            <span
                                              className="px-2 py-0.5 rounded-md font-bold text-[10px]"
                                              style={{
                                                background: (r.newOld || r.quality) === "New" ? "#E4F4EC" : "#FFF4E6",
                                                color: (r.newOld || r.quality) === "New" ? "#0A7F5A" : "#B45309",
                                                fontFamily:
                                                  lang === "ur"
                                                    ? URDU_FONT
                                                    : "inherit",
                                              }}
                                            >
                                              {r.newOld || r.quality || "—"}
                                            </span>
                                          </td>
                                        )}

                                        {/* 5. Trend */}
                                        <td
                                          style={{
                                            padding: "7px 4px",
                                            textAlign: "center",
                                            color: trendColor,
                                            fontWeight: 800,
                                            fontSize: 10.5,
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {rowMin > 0 ? (
                                            <span>
                                              <span>{trendArrow}</span>{" "}
                                              {intervalPct > 0 ? `${intervalPct}%` : ""}
                                            </span>
                                          ) : (
                                            "—"
                                          )}
                                        </td>

                                        {/* 6. Arrival Quantity */}
                                        <td
                                          style={{
                                            padding: "7px 4px",
                                            textAlign: "center",
                                            color: rowArr > 0 ? "#087F63" : "#80918B",
                                            fontWeight: 700,
                                            fontSize: 10,
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {rowArr > 0
                                            ? (lang === "ur" ? `${toUrduDigits(rowArr.toLocaleString("en-PK"))} بوریاں` : `${rowArr.toLocaleString("en-PK")} Bags`)
                                            : "—"}
                                        </td>

                                        {/* 7. Arrival Unit */}
                                        <td
                                          style={{
                                            padding: "7px 4px",
                                            textAlign: "center",
                                            color: rowArr > 0 ? "#087F63" : "#80918B",
                                            fontWeight: 700,
                                            fontSize: 10,
                                            whiteSpace: "nowrap",
                                            fontFamily:
                                              lang === "ur"
                                                ? URDU_FONT
                                                : "inherit",
                                          }}
                                        >
                                          {rowArr > 0 ? ((r as any).arrivalUnit || (lang === "ur" ? "۴۰ کلو" : "40 kg")) : "—"}
                                        </td>

                                        {/* Remaining Spec Columns */}
                                        {primarySpecialAttr !== "quality" && (
                                          <td
                                            style={{
                                              padding: "7px 4px",
                                              textAlign: "center",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            <span
                                              className="px-2 py-0.5 rounded-md font-bold text-[10px]"
                                              style={{
                                                background: (r.newOld || r.quality) === "New" ? "#E4F4EC" : "#FFF4E6",
                                                color: (r.newOld || r.quality) === "New" ? "#0A7F5A" : "#B45309",
                                                fontFamily:
                                                  lang === "ur"
                                                    ? URDU_FONT
                                                    : "inherit",
                                              }}
                                            >
                                              {r.newOld || r.quality || "—"}
                                            </span>
                                          </td>
                                        )}

                                        {primarySpecialAttr !== "moisture" && (
                                          <td
                                            style={{
                                              padding: "7px 4px",
                                              textAlign: "center",
                                              color: "#087F63",
                                              fontWeight: 700,
                                              fontSize: 10,
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {r.moisture ? (r.moisture.includes("%") ? r.moisture : `${r.moisture}%`) : "—"}
                                          </td>
                                        )}

                                        {primarySpecialAttr !== "color" && (
                                          <td
                                            style={{
                                              padding: "7px 4px",
                                              textAlign: "center",
                                              color: "#52635F",
                                              fontWeight: 600,
                                              fontSize: 10,
                                              whiteSpace: "nowrap",
                                              fontFamily:
                                                lang === "ur"
                                                  ? URDU_FONT
                                                  : "inherit",
                                            }}
                                          >
                                            {r.color ? tc(r.color) : "—"}
                                          </td>
                                        )}

                                        {primarySpecialAttr !== "variety" && (
                                          <td
                                            style={{
                                              padding: "7px 4px",
                                              textAlign: "center",
                                              color: "#52635F",
                                              fontWeight: 600,
                                              fontSize: 10,
                                              whiteSpace: "nowrap",
                                              fontFamily:
                                                lang === "ur"
                                                  ? URDU_FONT
                                                  : "inherit",
                                            }}
                                          >
                                            {r.variety || "—"}
                                          </td>
                                        )}

                                        {/* 10. Origin */}
                                        <td
                                          style={{
                                            padding: "7px 4px",
                                            textAlign: "center",
                                            color: "#52635F",
                                            fontWeight: 600,
                                            fontSize: 10,
                                            whiteSpace: "nowrap",
                                            fontFamily:
                                              lang === "ur"
                                                ? URDU_FONT
                                                : "inherit",
                                          }}
                                        >
                                          {r.origin ? tm(r.origin) : "—"}
                                        </td>

                                        {/* 11. Condition */}
                                        <td
                                          style={{
                                            padding: "7px 4px",
                                            textAlign: "center",
                                            color: "#52635F",
                                            fontWeight: 600,
                                            fontSize: 10,
                                            whiteSpace: "nowrap",
                                            fontFamily:
                                              lang === "ur"
                                                ? URDU_FONT
                                                : "inherit",
                                          }}
                                        >
                                          {r.condition || r.quality || "—"}
                                        </td>

                                        {/* 12. Specification */}
                                        <td
                                          style={{
                                            padding: "7px 4px",
                                            textAlign: "center",
                                            color: "#52635F",
                                            fontWeight: 600,
                                            fontSize: 10,
                                            whiteSpace: "nowrap",
                                            fontFamily:
                                              lang === "ur"
                                                ? URDU_FONT
                                                : "inherit",
                                          }}
                                        >
                                          {r.spec || "—"}
                                        </td>
                                      </tr>

                                      {/* Inline Expandable Trend Graph Row directly below this clicked row */}
                                      {isRowModalActive && (
                                        <tr>
                                          <td
                                            colSpan={13}
                                            className="p-0 border-b-2 border-[#10B981]"
                                            style={{
                                              background: "#F4FAF7",
                                              padding: 0,
                                            }}
                                          >
                                            <div
                                              style={{
                                                position: "sticky",
                                                left: 0,
                                                width: tableClientWidth > 0 ? `${tableClientWidth}px` : "100%",
                                                maxWidth: tableClientWidth > 0 ? `${tableClientWidth}px` : "100%",
                                                boxSizing: "border-box",
                                              }}
                                              className="p-2 sm:p-3.5 flex flex-col gap-2.5 shadow-inner bg-[#F4FAF7]"
                                            >
                                              {/* Trends-matching Card Container */}
                                              <div
                                                className="rounded-2xl p-3 sm:p-4 flex flex-col gap-3 shadow-sm bg-white"
                                                style={{
                                                  border: "1px solid #D5E2DD",
                                                  width: "100%",
                                                  boxSizing: "border-box",
                                                }}
                                              >
                                                {/* 1. Top Row: Price vs Arrival Switcher Tabs + Close Button */}
                                                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E8EFEC]">
                                                  <div className="flex items-center bg-[#E5EFEA] p-0.5 rounded-lg border border-[#CCE2D7]">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTableGraphView("price");
                                                      }}
                                                      className="tap-target px-3 py-1 rounded-md text-[10.5px] font-extrabold transition"
                                                      style={{
                                                        background: tableGraphView === "price" ? "#087F63" : "transparent",
                                                        color: tableGraphView === "price" ? "#FFFFFF" : "#4E665E",
                                                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                                      }}
                                                    >
                                                      {lang === "ur" ? "قیمت کا رجحان" : "Price Trend"}
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTableGraphView("arrival");
                                                      }}
                                                      className="tap-target px-3 py-1 rounded-md text-[10.5px] font-extrabold transition"
                                                      style={{
                                                        background: tableGraphView === "arrival" ? "#D97706" : "transparent",
                                                        color: tableGraphView === "arrival" ? "#FFFFFF" : "#4E665E",
                                                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                                      }}
                                                    >
                                                      {lang === "ur" ? "آمد کا رجحان" : "Arrival Trend"}
                                                    </button>
                                                  </div>

                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSelectedMandiGraphRow(null);
                                                    }}
                                                    className="tap-target w-7 h-7 rounded-full bg-[#E5EFEA] hover:bg-[#D5E5DE] text-[#064D40] text-xs font-bold flex items-center justify-center transition active:scale-95 flex-shrink-0"
                                                    title={lang === "ur" ? "بند کریں" : "Close"}
                                                  >
                                                    ✕
                                                  </button>
                                                </div>

                                                {/* 2. Second Row: Granularity Filters (1, 5, 15, 30, 1H, 5H, 1D, 1W, 1M) */}
                                                <div className="flex items-center gap-1 overflow-x-auto py-1 border-b border-[#E8EFEC]" style={{ scrollbarWidth: "none" }}>
                                                  {["1", "5", "15", "30", "1H", "5H", "1D", "1W", "1M"].map((g) => {
                                                    const isGActive = tableGraphGranularity === g;
                                                    return (
                                                      <button
                                                        key={g}
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setTableGraphGranularity(g);
                                                        }}
                                                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors flex-shrink-0 ${isGActive
                                                          ? tableGraphView === "price"
                                                            ? "bg-[#087F63] text-white shadow-xs"
                                                            : "bg-[#D97706] text-white shadow-xs"
                                                          : "text-[#52635F] hover:bg-[#F1F7F4] hover:text-[#143B33]"
                                                          }`}
                                                      >
                                                        {g}
                                                      </button>
                                                    );
                                                  })}
                                                </div>

                                                {/* 2. Main Graph Body according to Price vs Arrival */}
                                                {tableGraphView === "price" ? (
                                                  <>
                                                    {(() => {
                                                      const graphData = buildMandiInlineGraphFromRows({
                                                        allRows,
                                                        mandiName: r.mandiName,
                                                        rateType: r.rateType,
                                                        timeframe: graphTimeframe,
                                                        lang,
                                                        view: "price",
                                                      });
                                                      const pts = graphData.points;
                                                      const len = pts.length;
                                                      const hoverI = tableGraphHoverIdx !== null && tableGraphHoverIdx < len ? tableGraphHoverIdx : len - 1;
                                                      const displayPrice = pts[hoverI] ?? graphData.latestPrice;
                                                      const startPrice = pts[0] || displayPrice || 1;
                                                      const changeAmt = displayPrice - startPrice;
                                                      const absPct = Math.abs((changeAmt / (startPrice || 1)) * 100).toFixed(2);
                                                      const isPositive = changeAmt > 0;
                                                      const isFlat = changeAmt === 0;
                                                      const seriesMax = Math.max(...pts, displayPrice);
                                                      const seriesMin = Math.min(...pts, displayPrice);
                                                      const seriesAvg = Math.round(pts.reduce((a, b) => a + b, 0) / (len || 1));
                                                      const currentDateLabel = graphData.dates[hoverI] || graphData.dates[len - 1] || "14 Sep 2026";

                                                      const CW = 540;
                                                      const CH = 155;
                                                      const PL = 46;
                                                      const PR = 46;
                                                      const PT = 14;
                                                      const PB = 26;
                                                      const chartW = CW - PL - PR;
                                                      const volBaseY = CH - PB;
                                                      const volMaxH = 22;
                                                      const separatorY = volBaseY - volMaxH - 6;
                                                      const lineChartH = separatorY - PT - 8;
                                                      const pMin = graphData.yMinBound;
                                                      const pMax = graphData.yMaxBound;
                                                      const yOf = (v: number) => PT + lineChartH - ((v - pMin) / (pMax - pMin || 1)) * lineChartH;
                                                      const xOf = (i: number) => PL + (i / (len - 1 || 1)) * chartW;
                                                      const maxArr = graphData.peakArrival || 1;
                                                      const currentCloseY = yOf(displayPrice);

                                                      return (
                                                        <>
                                                          {/* Commodity Header HUD */}
                                                          <div className="flex flex-col gap-2 border-b border-[#E8EFEC] pb-2.5">
                                                            <div className="flex items-center justify-between">
                                                              <div className="flex items-center gap-2">
                                                                <span
                                                                  className="text-xs sm:text-sm font-extrabold text-[#143B33]"
                                                                  style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                                                                >
                                                                  {tm(r.mandiName.replace(/\s*mandi$/i, "").replace(/\s*منڈی$/i, ""))} — {byproduct ? `${tc(byproduct)}` : `${tc(product)}`}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-[#087F63] bg-[#E8F8F4] px-2 py-0.5 rounded-full border border-[#C2E8DB]">
                                                                  {tr(r.rateType).replace(" ریٹ", "").replace(" Rate", "")}
                                                                </span>
                                                              </div>
                                                              <span className="text-[10px] font-bold text-[#80918B]">
                                                                {lang === "ur" ? "روپے فی ۴۰ کلو" : "PKR / 40kg"}
                                                              </span>
                                                            </div>

                                                            {/* Price & Change Display */}
                                                            <div className="flex items-baseline justify-between flex-wrap gap-2">
                                                              <div className="flex items-baseline gap-2.5">
                                                                <span className="text-2xl sm:text-3xl font-black text-[#143B33] tracking-tight">
                                                                  {lang === "ur" ? `روپے ${toUrduDigits(displayPrice.toLocaleString())}` : `Rs. ${displayPrice.toLocaleString()}`}
                                                                </span>
                                                                <span
                                                                  className="text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1"
                                                                  style={{
                                                                    background: isFlat ? "#F3F4F6" : isPositive ? "#DCFCE7" : "#FEE2E2",
                                                                    color: isFlat ? "#4B5563" : isPositive ? "#15803D" : "#B91C1C",
                                                                    border: `1px solid ${isFlat ? "#E5E7EB" : isPositive ? "#86EFAC" : "#FCA5A5"}`,
                                                                  }}
                                                                >
                                                                  <span>{isFlat ? "—" : isPositive ? "▲" : "▼"}</span>
                                                                  <span>{absPct}%</span>
                                                                </span>
                                                              </div>

                                                              {/* Date / Scrub Indicator */}
                                                              <div className="text-[11px] font-semibold text-[#52635F]">
                                                                {currentDateLabel}
                                                              </div>
                                                            </div>

                                                            {/* Stat Summary Bar (High, Low, Avg) */}
                                                            <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                                                              <div className="bg-[#F8FBFA] p-1.5 rounded-lg border border-[#E8EFEC] flex flex-col">
                                                                <span className="text-[#80918B] font-semibold">
                                                                  {lang === "ur" ? "زیادہ سے زیادہ" : "Period High"}
                                                                </span>
                                                                <span className="font-bold text-[#143B33] text-xs">
                                                                  {lang === "ur" ? `روپے ${toUrduDigits(seriesMax.toLocaleString())}` : `Rs. ${seriesMax.toLocaleString()}`}
                                                                </span>
                                                              </div>
                                                              <div className="bg-[#F8FBFA] p-1.5 rounded-lg border border-[#E8EFEC] flex flex-col">
                                                                <span className="text-[#80918B] font-semibold">
                                                                  {lang === "ur" ? "کم سے کم" : "Period Low"}
                                                                </span>
                                                                <span className="font-bold text-[#143B33] text-xs">
                                                                  {lang === "ur" ? `روپے ${toUrduDigits(seriesMin.toLocaleString())}` : `Rs. ${seriesMin.toLocaleString()}`}
                                                                </span>
                                                              </div>
                                                              <div className="bg-[#F8FBFA] p-1.5 rounded-lg border border-[#E8EFEC] flex flex-col">
                                                                <span className="text-[#80918B] font-semibold">
                                                                  {lang === "ur" ? "اوسط ریٹ" : "Period Avg"}
                                                                </span>
                                                                <span className="font-bold text-[#087F63] text-xs">
                                                                  {lang === "ur" ? `روپے ${toUrduDigits(seriesAvg.toLocaleString())}` : `Rs. ${seriesAvg.toLocaleString()}`}
                                                                </span>
                                                              </div>
                                                            </div>
                                                          </div>

                                                          {/* SVG Chart Canvas */}
                                                          <div className="relative w-full select-none bg-[#FCFDFD] rounded-xl border border-[#EDF4F1] p-1">
                                                            <svg
                                                              viewBox={`0 0 ${CW} ${CH}`}
                                                              className="w-full select-none"
                                                              style={{ height: isTableExpanded ? 160 : 135, display: "block", touchAction: "none" }}
                                                              onMouseDown={(e) => {
                                                                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                                                                const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                                                                const i = Math.round((relX / chartW) * (len - 1));
                                                                setTableGraphHoverIdx(Math.max(0, Math.min(len - 1, i)));
                                                              }}
                                                              onMouseMove={(e) => {
                                                                if (e.buttons === 1 || tableGraphHoverIdx !== null) {
                                                                  const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                                                                  const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                                                                  const i = Math.round((relX / chartW) * (len - 1));
                                                                  setTableGraphHoverIdx(Math.max(0, Math.min(len - 1, i)));
                                                                }
                                                              }}
                                                              onMouseUp={() => setTableGraphHoverIdx(null)}
                                                              onMouseLeave={() => setTableGraphHoverIdx(null)}
                                                              onTouchStart={(e) => {
                                                                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                                                                const touch = e.touches[0];
                                                                if (touch) {
                                                                  const relX = ((touch.clientX - rect.left) / rect.width) * CW - PL;
                                                                  const i = Math.round((relX / chartW) * (len - 1));
                                                                  setTableGraphHoverIdx(Math.max(0, Math.min(len - 1, i)));
                                                                }
                                                              }}
                                                              onTouchMove={(e) => {
                                                                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                                                                const touch = e.touches[0];
                                                                if (touch) {
                                                                  const relX = ((touch.clientX - rect.left) / rect.width) * CW - PL;
                                                                  const i = Math.round((relX / chartW) * (len - 1));
                                                                  setTableGraphHoverIdx(Math.max(0, Math.min(len - 1, i)));
                                                                }
                                                              }}
                                                              onTouchEnd={() => setTableGraphHoverIdx(null)}
                                                              onTouchCancel={() => setTableGraphHoverIdx(null)}
                                                            >
                                                              <defs>
                                                                <linearGradient
                                                                  id={`tableInlinePriceGrad-${ci}`}
                                                                  x1="0"
                                                                  y1="0"
                                                                  x2="0"
                                                                  y2="1"
                                                                >
                                                                  <stop offset="0%" stopColor="#087F63" stopOpacity="0.22" />
                                                                  <stop offset="75%" stopColor="#087F63" stopOpacity="0.03" />
                                                                  <stop offset="100%" stopColor="#087F63" stopOpacity="0.00" />
                                                                </linearGradient>
                                                              </defs>

                                                              {/* Horizontal Gridlines + Left & Right Price Axis Labels */}
                                                              {graphData.yLabels.map((tick, ti) => {
                                                                const y = yOf(tick.val);
                                                                return (
                                                                  <g key={`yTick-${ti}`}>
                                                                    <line
                                                                      x1={PL}
                                                                      y1={y}
                                                                      x2={CW - PR}
                                                                      y2={y}
                                                                      stroke="#E8EFEF"
                                                                      strokeWidth="1"
                                                                      strokeDasharray="3 3"
                                                                    />
                                                                    <text
                                                                      x={PL - 6}
                                                                      y={y + 3.5}
                                                                      textAnchor="end"
                                                                      fontSize="10"
                                                                      fontWeight="700"
                                                                      fill="#1E3A34"
                                                                    >
                                                                      {tick.label}
                                                                    </text>
                                                                    <text
                                                                      x={CW - PR + 8}
                                                                      y={y + 3.5}
                                                                      textAnchor="start"
                                                                      fontSize="10"
                                                                      fontWeight="700"
                                                                      fill="#264E43"
                                                                    >
                                                                      {tick.val}
                                                                    </text>
                                                                  </g>
                                                                );
                                                              })}

                                                              {/* Pane Separator Line (Line Graph vs Bar Graph) */}
                                                              <line
                                                                x1={PL}
                                                                y1={separatorY}
                                                                x2={CW - PR}
                                                                y2={separatorY}
                                                                stroke="#CBD5E1"
                                                                strokeWidth="1.2"
                                                                strokeDasharray="4 3"
                                                              />
                                                              <text
                                                                x={PL - 6}
                                                                y={separatorY + 3.5}
                                                                textAnchor="end"
                                                                fontSize="9.5"
                                                                fontWeight="800"
                                                                fill="#475569"
                                                              >
                                                                0
                                                              </text>
                                                              <text
                                                                x={CW - PR + 8}
                                                                y={separatorY + 3.5}
                                                                textAnchor="start"
                                                                fontSize="9.5"
                                                                fontWeight="800"
                                                                fill="#475569"
                                                              >
                                                                VOL
                                                              </text>

                                                              {/* Volume Baseline / X-Axis Baseline */}
                                                              <line
                                                                x1={PL}
                                                                y1={volBaseY}
                                                                x2={CW - PR}
                                                                y2={volBaseY}
                                                                stroke="#C8DCD5"
                                                                strokeWidth="1.4"
                                                              />

                                                              {/* X-Axis Date Labels */}
                                                              {graphData.xLabels.map((lbl, i) =>
                                                                lbl ? (
                                                                  <text
                                                                    key={`xPriceTick-${i}`}
                                                                    x={xOf(i)}
                                                                    y={CH - 8}
                                                                    textAnchor="middle"
                                                                    fontSize="10"
                                                                    fontWeight="700"
                                                                    fill="#1E3A34"
                                                                    fontFamily={lang === "ur" ? URDU_FONT : "inherit"}
                                                                  >
                                                                    {lbl}
                                                                  </text>
                                                                ) : null,
                                                              )}

                                                              {/* Mini Arrival Volume Bars along Bottom */}
                                                              {graphData.arrivals.map((arrVal, i) => {
                                                                const barX = xOf(i);
                                                                const barH = (arrVal / maxArr) * volMaxH;
                                                                const prevP = i > 0 ? pts[i - 1] : pts[i];
                                                                const curP = pts[i];
                                                                const isUp = curP >= prevP;
                                                                const barW = Math.max(2.5, Math.min(6, (chartW / len) * 0.55));
                                                                const isHov = tableGraphHoverIdx === i;

                                                                return (
                                                                  <rect
                                                                    key={`vol-${i}`}
                                                                    x={barX - barW / 2}
                                                                    y={volBaseY - barH}
                                                                    width={barW}
                                                                    height={barH}
                                                                    rx={1}
                                                                    fill={isUp ? "#10B981" : "#EF4444"}
                                                                    opacity={isHov ? 1 : 0.65}
                                                                  />
                                                                );
                                                              })}

                                                              {/* Area & Line */}
                                                              {(() => {
                                                                const lineCoords = pts.map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");
                                                                const areaCoords = `${lineCoords} L${xOf(len - 1).toFixed(1)},${separatorY} L${PL},${separatorY} Z`;
                                                                return (
                                                                  <g>
                                                                    <path d={areaCoords} fill={`url(#tableInlinePriceGrad-${ci})`} />
                                                                    <path d={lineCoords} stroke="#087F63" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                                                    {/* Dotted Latest Price Guideline */}
                                                                    <line x1={PL} y1={currentCloseY} x2={CW - PR} y2={currentCloseY} stroke="#087F63" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.6" />
                                                                    {/* Latest Price Tag */}
                                                                    <g transform={`translate(${CW - PR + 2}, ${currentCloseY - 7})`}>
                                                                      <rect x={0} y={0} width={28} height={14} rx={3} fill="#087F63" />
                                                                      <text x={14} y={10} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFFFFF">
                                                                        {displayPrice >= 1000 ? `${(displayPrice / 1000).toFixed(1)}k` : displayPrice}
                                                                      </text>
                                                                    </g>
                                                                    {/* Live Pulse Dot */}
                                                                    <circle cx={xOf(len - 1)} cy={currentCloseY} r="4" fill="#087F63" stroke="#FFFFFF" strokeWidth="2" />
                                                                  </g>
                                                                );
                                                              })()}

                                                              {/* Interactive Hover Crosshairs */}
                                                              {tableGraphHoverIdx !== null && (
                                                                <g>
                                                                  <line x1={xOf(tableGraphHoverIdx)} y1={PT} x2={xOf(tableGraphHoverIdx)} y2={volBaseY} stroke="#0284C7" strokeWidth="1.2" strokeDasharray="2 2" />
                                                                  <line x1={PL} y1={yOf(pts[tableGraphHoverIdx])} x2={CW - PR} y2={yOf(pts[tableGraphHoverIdx])} stroke="#0284C7" strokeWidth="1" strokeDasharray="2 2" opacity="0.75" />
                                                                  <circle cx={xOf(tableGraphHoverIdx)} cy={yOf(pts[tableGraphHoverIdx])} r="5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
                                                                </g>
                                                              )}
                                                            </svg>

                                                            {/* Interactive Hover Tooltip */}
                                                            {tableGraphHoverIdx !== null && (() => {
                                                              const curP = pts[tableGraphHoverIdx] || 0;
                                                              const minP = graphData.mins?.[tableGraphHoverIdx] || Math.max(0, curP - Math.round(curP * 0.008));
                                                              const maxP = graphData.maxs?.[tableGraphHoverIdx] || (curP + Math.round(curP * 0.008));
                                                              const volVal = graphData.arrivals?.[tableGraphHoverIdx] || 0;
                                                              const dateStr = graphData.dates[tableGraphHoverIdx] || "14 Sep 2026";

                                                              return (
                                                                <div
                                                                  className="pointer-events-none absolute z-20 rounded-xl shadow-xl border p-2 flex flex-col gap-1 backdrop-blur-md transition-all duration-75"
                                                                  style={{
                                                                    left: `${Math.min(Math.max((xOf(tableGraphHoverIdx) / CW) * 100, 24), 76)}%`,
                                                                    top: 8,
                                                                    transform: "translateX(-50%)",
                                                                    background: "rgba(255, 255, 255, 0.97)",
                                                                    borderColor: "#38BDF8",
                                                                    minWidth: 150,
                                                                    boxShadow: "0 8px 24px -4px rgba(2, 132, 199, 0.22)",
                                                                  }}
                                                                >
                                                                  <div className="flex items-center justify-between text-[10px] font-bold text-[#0284C7] border-b border-[#E0F2FE] pb-1">
                                                                    <span>DT:</span>
                                                                    <span className="font-mono text-[#0F172A]">{dateStr}</span>
                                                                  </div>
                                                                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-semibold text-[#334155] pt-1">
                                                                    <span className="text-[#64748B]">{lang === "ur" ? "کم سے کم ریٹ:" : "Min Rate:"}</span>
                                                                    <span className="font-mono font-bold text-right text-[#B91C1C]">Rs. {minP.toLocaleString()}</span>
                                                                    <span className="text-[#64748B]">{lang === "ur" ? "زیادہ سے زیادہ:" : "Max Rate:"}</span>
                                                                    <span className="font-mono font-bold text-right text-[#15803D]">Rs. {maxP.toLocaleString()}</span>
                                                                    <span className="text-[#64748B]">{lang === "ur" ? "آمد:" : "Arrivals:"}</span>
                                                                    <span className="font-mono font-bold text-right text-[#0284C7]">{volVal > 0 ? `${volVal.toLocaleString()} bags` : "—"}</span>
                                                                  </div>
                                                                </div>
                                                              );
                                                            })()}
                                                          </div>
                                                        </>
                                                      );
                                                    })()}
                                                  </>
                                                ) : (
                                                  <>
                                                    {(() => {
                                                      const arrivalData = buildMandiInlineGraphFromRows({
                                                        allRows,
                                                        mandiName: r.mandiName,
                                                        rateType: r.rateType,
                                                        timeframe: graphTimeframe,
                                                        lang,
                                                        view: "arrival",
                                                      });
                                                      const pts = arrivalData.points;
                                                      const len = pts.length;
                                                      const hoverI = tableGraphHoverIdx !== null && tableGraphHoverIdx < len ? tableGraphHoverIdx : len - 1;
                                                      const displayArr = pts[hoverI] ?? arrivalData.latestArrival;
                                                      const totalArr = arrivalData.totalArrival;
                                                      const peakArr = arrivalData.peakArrival;
                                                      const avgArr = Math.round(totalArr / (len || 1));
                                                      const currentDateLabel = arrivalData.dates[hoverI] || arrivalData.dates[len - 1] || "14 Sep 2026";

                                                      const CW = 540;
                                                      const CH = 155;
                                                      const PL = 46;
                                                      const PR = 46;
                                                      const PT = 14;
                                                      const PB = 26;
                                                      const chartW = CW - PL - PR;
                                                      const volBaseY = CH - PB;
                                                      const volMaxH = 22;
                                                      const separatorY = volBaseY - volMaxH - 6;
                                                      const lineChartH = separatorY - PT - 8;
                                                      const aMin = 0;
                                                      const aMax = arrivalData.yMaxBound;
                                                      const yOf = (v: number) => PT + lineChartH - ((v - aMin) / (aMax - aMin || 1)) * lineChartH;
                                                      const xOf = (i: number) => PL + (i / (len - 1 || 1)) * chartW;

                                                      return (
                                                        <>
                                                          {/* Arrival Header HUD */}
                                                          <div className="flex flex-col gap-2 border-b border-[#E8EFEC] pb-2.5">
                                                            <div className="flex items-center justify-between">
                                                              <div className="flex items-center gap-1.5">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                                                                <span
                                                                  className="text-xs sm:text-sm font-extrabold text-[#143B33]"
                                                                  style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                                                                >
                                                                  {tm(r.mandiName.replace(/\s*mandi$/i, "").replace(/\s*منڈی$/i, ""))} — {lang === "ur" ? "آمد کی مقدار (مارکیٹ رسد)" : "Arrival Volume Trend"}
                                                                </span>
                                                              </div>
                                                              <span className="text-[10px] font-semibold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-[#FDE68A]">
                                                                {lang === "ur" ? "تھیلے" : "Bags"}
                                                              </span>
                                                            </div>

                                                            <div className="flex items-baseline justify-between flex-wrap gap-2">
                                                              <div className="flex items-baseline gap-2">
                                                                <span className="text-2xl font-black text-[#92400E]">
                                                                  {lang === "ur" ? `${toUrduDigits(displayArr.toLocaleString())} تھیلے` : `${displayArr.toLocaleString()} Bags`}
                                                                </span>
                                                              </div>
                                                              <div className="text-[11px] font-semibold text-[#52635F]">
                                                                {currentDateLabel}
                                                              </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                                                              <div className="bg-[#FFFDF5] p-1.5 rounded-lg border border-[#FDE68A] flex flex-col">
                                                                <span className="text-[#92400E] font-semibold">{lang === "ur" ? "کل آمد" : "Total Period"}</span>
                                                                <span className="font-bold text-[#78350F] text-xs">
                                                                  {totalArr.toLocaleString()} Bags
                                                                </span>
                                                              </div>
                                                              <div className="bg-[#FFFDF5] p-1.5 rounded-lg border border-[#FDE68A] flex flex-col">
                                                                <span className="text-[#92400E] font-semibold">{lang === "ur" ? "سب سے زیادہ" : "Peak Day"}</span>
                                                                <span className="font-bold text-[#78350F] text-xs">
                                                                  {peakArr.toLocaleString()} Bags
                                                                </span>
                                                              </div>
                                                              <div className="bg-[#FFFDF5] p-1.5 rounded-lg border border-[#FDE68A] flex flex-col">
                                                                <span className="text-[#92400E] font-semibold">{lang === "ur" ? "روزانہ اوسط" : "Daily Avg"}</span>
                                                                <span className="font-bold text-[#92400E] text-xs">
                                                                  {avgArr.toLocaleString()} Bags
                                                                </span>
                                                              </div>
                                                            </div>
                                                          </div>

                                                          {/* SVG Arrival Canvas */}
                                                          <div className="relative w-full select-none bg-[#FCFDFD] rounded-xl border border-[#EDF4F1] p-1">
                                                            <svg
                                                              viewBox={`0 0 ${CW} ${CH}`}
                                                              className="w-full select-none"
                                                              style={{ height: isTableExpanded ? 160 : 135, display: "block", touchAction: "none" }}
                                                              onMouseDown={(e) => {
                                                                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                                                                const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                                                                const i = Math.round((relX / chartW) * (len - 1));
                                                                setTableGraphHoverIdx(Math.max(0, Math.min(len - 1, i)));
                                                              }}
                                                              onMouseMove={(e) => {
                                                                if (e.buttons === 1 || tableGraphHoverIdx !== null) {
                                                                  const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                                                                  const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                                                                  const i = Math.round((relX / chartW) * (len - 1));
                                                                  setTableGraphHoverIdx(Math.max(0, Math.min(len - 1, i)));
                                                                }
                                                              }}
                                                              onMouseUp={() => setTableGraphHoverIdx(null)}
                                                              onMouseLeave={() => setTableGraphHoverIdx(null)}
                                                              onTouchStart={(e) => {
                                                                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                                                                const touch = e.touches[0];
                                                                if (touch) {
                                                                  const relX = ((touch.clientX - rect.left) / rect.width) * CW - PL;
                                                                  const i = Math.round((relX / chartW) * (len - 1));
                                                                  setTableGraphHoverIdx(Math.max(0, Math.min(len - 1, i)));
                                                                }
                                                              }}
                                                              onTouchMove={(e) => {
                                                                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                                                                const touch = e.touches[0];
                                                                if (touch) {
                                                                  const relX = ((touch.clientX - rect.left) / rect.width) * CW - PL;
                                                                  const i = Math.round((relX / chartW) * (len - 1));
                                                                  setTableGraphHoverIdx(Math.max(0, Math.min(len - 1, i)));
                                                                }
                                                              }}
                                                              onTouchEnd={() => setTableGraphHoverIdx(null)}
                                                              onTouchCancel={() => setTableGraphHoverIdx(null)}
                                                            >
                                                              <defs>
                                                                <linearGradient id={`tableInlineArrGrad-${ci}`} x1="0" y1="0" x2="0" y2="1">
                                                                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.32" />
                                                                  <stop offset="85%" stopColor="#D97706" stopOpacity="0.04" />
                                                                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.00" />
                                                                </linearGradient>
                                                              </defs>

                                                              {/* Horizontal Dashed Gridlines + Y Ticks */}
                                                              {arrivalData.yLabels.map((tick, ti) => {
                                                                const y = yOf(tick.val);
                                                                return (
                                                                  <g key={`yArrTick-${ti}`}>
                                                                    <line x1={PL} y1={y} x2={CW - PR} y2={y} stroke="#E2ECE8" strokeWidth="1" strokeDasharray="4 4" />
                                                                    <text x={PL - 6} y={y + 3.5} textAnchor="end" fontSize="10.5" fontWeight="700" fill="#1E3A34">
                                                                      {tick.label}
                                                                    </text>
                                                                    <text x={CW - PR + 8} y={y + 3.5} textAnchor="start" fontSize="10" fontWeight="700" fill="#264E43">
                                                                      {tick.val}
                                                                    </text>
                                                                  </g>
                                                                );
                                                              })}

                                                              {/* Pane Separator Line (Line Graph vs Bar Graph) */}
                                                              <line
                                                                x1={PL}
                                                                y1={separatorY}
                                                                x2={CW - PR}
                                                                y2={separatorY}
                                                                stroke="#94A3B8"
                                                                strokeWidth="1.2"
                                                                strokeDasharray="4 3"
                                                              />
                                                              <text
                                                                x={PL - 6}
                                                                y={separatorY + 3.5}
                                                                textAnchor="end"
                                                                fontSize="9.5"
                                                                fontWeight="800"
                                                                fill="#475569"
                                                              >
                                                                0
                                                              </text>
                                                              <text
                                                                x={CW - PR + 8}
                                                                y={separatorY + 3.5}
                                                                textAnchor="start"
                                                                fontSize="9.5"
                                                                fontWeight="800"
                                                                fill="#475569"
                                                              >
                                                                VOL
                                                              </text>

                                                              {/* X-Axis Baseline */}
                                                              <line x1={PL} y1={volBaseY} x2={CW - PR} y2={volBaseY} stroke="#C8DCD5" strokeWidth="1.4" />

                                                              {/* X-Axis Dates */}
                                                              {arrivalData.xLabels.map((lbl, i) =>
                                                                lbl ? (
                                                                  <text key={`xArrTick-${i}`} x={xOf(i)} y={CH - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1E3A34" fontFamily={lang === "ur" ? URDU_FONT : "inherit"}>
                                                                    {lbl}
                                                                  </text>
                                                                ) : null,
                                                              )}

                                                              {/* Arrival Volume Bars along Bottom */}
                                                              {pts.map((arrVal, i) => {
                                                                const barX = xOf(i);
                                                                const maxVal = arrivalData.peakArrival || 1;
                                                                const barH = (arrVal / maxVal) * volMaxH;
                                                                const barW = Math.max(2.5, Math.min(6, (chartW / len) * 0.55));
                                                                const isHov = tableGraphHoverIdx === i;
                                                                return (
                                                                  <rect
                                                                    key={`arr-vol-bar-${i}`}
                                                                    x={barX - barW / 2}
                                                                    y={volBaseY - barH}
                                                                    width={barW}
                                                                    height={barH}
                                                                    rx={1}
                                                                    fill="#D97706"
                                                                    opacity={isHov ? 0.95 : 0.6}
                                                                  />
                                                                );
                                                              })}

                                                              {/* Area Fill */}
                                                              <path
                                                                d={[
                                                                  ...pts.map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`),
                                                                  `L${xOf(len - 1).toFixed(1)},${separatorY}`,
                                                                  `L${PL},${separatorY}`,
                                                                  "Z",
                                                                ].join(" ")}
                                                                fill={`url(#tableInlineArrGrad-${ci})`}
                                                              />

                                                              {/* Main Line */}
                                                              <path
                                                                d={pts.map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ")}
                                                                stroke="#D97706"
                                                                strokeWidth="2.8"
                                                                fill="none"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                              />

                                                              {/* Hover Guide and Marker */}
                                                              {tableGraphHoverIdx !== null && (
                                                                <g>
                                                                  <line x1={xOf(tableGraphHoverIdx)} y1={PT} x2={xOf(tableGraphHoverIdx)} y2={volBaseY} stroke="#92400E" strokeWidth="1.2" strokeDasharray="3 3" />
                                                                  <circle cx={xOf(tableGraphHoverIdx)} cy={yOf(pts[tableGraphHoverIdx])} r="5" fill="#D97706" stroke="#FFFFFF" strokeWidth="2" />
                                                                </g>
                                                              )}
                                                            </svg>

                                                            {/* Interactive Hover Tooltip for Arrival */}
                                                            {tableGraphHoverIdx !== null && (() => {
                                                              const volVal = pts[tableGraphHoverIdx] || 0;
                                                              const dateStr = arrivalData.dates[tableGraphHoverIdx] || "14 Sep 2026";
                                                              return (
                                                                <div
                                                                  className="pointer-events-none absolute z-20 rounded-xl shadow-xl border p-2 flex flex-col gap-1 backdrop-blur-md transition-all duration-75"
                                                                  style={{
                                                                    left: `${Math.min(Math.max((xOf(tableGraphHoverIdx) / CW) * 100, 24), 76)}%`,
                                                                    top: 8,
                                                                    transform: "translateX(-50%)",
                                                                    background: "rgba(255, 255, 255, 0.97)",
                                                                    borderColor: "#FDE68A",
                                                                    minWidth: 140,
                                                                    boxShadow: "0 8px 24px -4px rgba(217, 119, 6, 0.22)",
                                                                  }}
                                                                >
                                                                  <div className="flex items-center justify-between text-[10px] font-bold text-[#92400E] border-b border-[#FEF3C7] pb-1">
                                                                    <span>DT:</span>
                                                                    <span className="font-mono text-[#0F172A]">{dateStr}</span>
                                                                  </div>
                                                                  <div className="flex items-center justify-between text-[10.5px] font-semibold text-[#334155] pt-1">
                                                                    <span className="text-[#78350F]">{lang === "ur" ? "آمد:" : "Arrivals:"}</span>
                                                                    <span className="font-mono font-bold text-right text-[#92400E]">
                                                                      {volVal > 0 ? `${volVal.toLocaleString()} bags` : "—"}
                                                                    </span>
                                                                  </div>
                                                                </div>
                                                              );
                                                            })()}
                                                          </div>
                                                        </>
                                                      );
                                                    })()}
                                                  </>
                                                )}

                                                {/* 3. Timeframe Filter: 1 Month, 3 Months, 6 Months, 1 Year */}
                                                <div className="pt-0.5">
                                                  <div className="grid grid-cols-4 gap-1.5 border border-[#D5E2DD] rounded-xl p-1 bg-[#F9FBFA]">
                                                    {[
                                                      { id: "1M", labelEn: "1 Month", labelUr: "۱ مہینہ" },
                                                      { id: "3M", labelEn: "3 Months", labelUr: "۳ مہینے" },
                                                      { id: "6M", labelEn: "6 Months", labelUr: "۶ مہینے" },
                                                      { id: "1Y", labelEn: "1 Year", labelUr: "۱ سال" },
                                                    ].map((tf) => {
                                                      const isTfActive = graphTimeframe === tf.id;
                                                      return (
                                                        <button
                                                          key={tf.id}
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setGraphTimeframe(tf.id as any);
                                                          }}
                                                          className={`flex items-center justify-center py-2 px-1 rounded-lg transition-all font-bold ${isTfActive
                                                            ? tableGraphView === "price"
                                                              ? "bg-[#087F63] text-white shadow-sm ring-1 ring-[#087F63]/30 scale-[1.01]"
                                                              : "bg-[#D97706] text-white shadow-sm ring-1 ring-[#D97706]/30 scale-[1.01]"
                                                            : "bg-white/80 text-[#52635F] hover:bg-white hover:text-[#183B34] border border-[#E8EFEC]"
                                                            }`}
                                                          style={{
                                                            fontSize: lang === "ur" ? 13 : 11,
                                                            fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                                          }}
                                                        >
                                                          <span>{lang === "ur" ? tf.labelUr : tf.labelEn}</span>
                                                        </button>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Date table sheet */}
              {dateTableOpen &&
                (() => {
                  const allTableRows = getRowsForProducts([product]).filter(
                    (r) => !byproduct || isMatchByproduct(r.byproduct, byproduct),
                  );

                  // Query actual real Excel observations for the selected historical date
                  const selYear = dtSelDate.getFullYear();
                  const selMonth = String(dtSelDate.getMonth() + 1).padStart(2, "0");
                  const selDay = String(dtSelDate.getDate()).padStart(2, "0");
                  const targetDateKey = `${selYear}-${selMonth}-${selDay}`;

                  const dateIdx = REAL_DATES_TIMELINE.indexOf(targetDateKey);

                  const filteredTableRows = allTableRows
                    .filter((r) => {
                      if (dtPriceType && r.rateType !== dtPriceType) return false;
                      return true;
                    })
                    .map((r) => {
                      if (dateIdx >= 0) {
                        const rowTimeline = getExcelTimeline({
                          product,
                          byproduct: r.byproduct || byproduct,
                          locationLabel: r.mandiName,
                          locationKind: "mandi",
                          rateType: r.rateType,
                          range: "year",
                        });
                        const mi = rowTimeline.mins[dateIdx] ?? r.min;
                        const mx = rowTimeline.maxs[dateIdx] ?? r.max;
                        const arr = rowTimeline.arrivals[dateIdx] ?? 0;
                        return {
                          ...r,
                          min: mi,
                          max: mx,
                          arrival: arr > 0 ? arr.toLocaleString("en-PK") : "—",
                        };
                      }
                      return r;
                    });

                  const allPriceTypes = [
                    ...new Set(allTableRows.map((r) => r.rateType)),
                  ];
                  const specs = [
                    "Seed Quality",
                    "Retail",
                    "Damage",
                    "Export Grade",
                  ];
                  const conditions = ["Dry", "Wet", "Mix"];
                  const qualities = ["New", "Old", "Cleaned", "Uncleaned"];

                  // Calendar helpers
                  const selD = dtSelDate;
                  const calM = dtCalMonth;
                  const calYear = calM.getFullYear();
                  const calMonthIdx = calM.getMonth();
                  const monthNamesUr = [
                    "جنوری",
                    "فروری",
                    "مارچ",
                    "اپریل",
                    "مئی",
                    "جون",
                    "جولائی",
                    "اگست",
                    "ستمبر",
                    "اکتوبر",
                    "نومبر",
                    "دسمبر",
                  ];
                  const monthName =
                    lang === "ur"
                      ? `${monthNamesUr[calMonthIdx]} ${calYear}`
                      : calM.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      });
                  const firstDow = new Date(calYear, calMonthIdx, 1).getDay(); // 0=Sun
                  const daysInMonth = new Date(
                    calYear,
                    calMonthIdx + 1,
                    0,
                  ).getDate();
                  const prevMonth = () =>
                    setDtCalMonth(new Date(calYear, calMonthIdx - 1, 1));
                  const nextMonth = () =>
                    setDtCalMonth(new Date(calYear, calMonthIdx + 1, 1));
                  const isSameDay = (a: Date, b: Date) =>
                    a.getFullYear() === b.getFullYear() &&
                    a.getMonth() === b.getMonth() &&
                    a.getDate() === b.getDate();
                  const isToday = (d: Date) => isSameDay(d, new Date());
                  const calDays: (number | null)[] = [
                    ...Array(firstDow).fill(null),
                    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                  ];
                  while (calDays.length % 7 !== 0) calDays.push(null);

                  const urDaysFull = [
                    "اتوار",
                    "پیر",
                    "منگل",
                    "بدھ",
                    "جمعرات",
                    "جمعہ",
                    "ہفتہ",
                  ];
                  const selDateStr =
                    lang === "ur"
                      ? `${urDaysFull[selD.getDay()]}، ${selD.getDate()} ${monthNamesUr[selD.getMonth()]} ${selD.getFullYear()}`
                      : selD.toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });

                  // Column header dropdown opts
                  const colOpts: Record<string, string[]> = {
                    Quality: qualities,
                    "Price Type": allPriceTypes.map((tPt) =>
                      tPt.replace(" Rate", ""),
                    ),
                    Specification: specs,
                    Condition: conditions,
                  };
                  const colLabels: Record<string, string> = {
                    Station: lang === "ur" ? "منڈی" : "Station",
                    "Min – Max": lang === "ur" ? "کم – زیادہ" : "Min – Max",
                    "Price Type": lang === "ur" ? "نرخ کی قسم" : "Price Type",
                    Trend: lang === "ur" ? "رجحان" : "Trend",
                    Quality: lang === "ur" ? "معیار" : "Quality",
                    Arrival: lang === "ur" ? "آمد" : "Arrival",
                    Color: lang === "ur" ? "رنگ" : "Color",
                    Variety: lang === "ur" ? "قسم" : "Variety",
                    Condition: lang === "ur" ? "حالت" : "Condition",
                    Specification: lang === "ur" ? "خصوصیت" : "Specification",
                  };
                  const colState: Record<string, string | null> = {
                    Quality: dtQuality,
                    "Price Type": dtPriceType,
                    Specification: dtSpec,
                    Condition: dtCondition,
                  };
                  const colSetter: Record<string, (v: string | null) => void> = {
                    Quality: setDtQuality,
                    "Price Type": (v) => setDtPriceType(v ? v + " Rate" : null),
                    Specification: setDtSpec,
                    Condition: setDtCondition,
                  };

                  return (
                    <div
                      className="zm-sheet-overlay"
                      style={{ zIndex: 250 }}
                      onClick={() => {
                        setDateTableOpen(false);
                        setDtOpenCol(null);
                      }}
                    >
                      <div
                        className="zm-sheet-high"
                        style={{ background: "#F4FAF7", maxHeight: "96vh" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Drag handle + title + calendar icon button */}
                        <div
                          className="px-5 pt-4 pb-3 flex-shrink-0"
                          style={{
                            borderBottom: "1px solid #D5E2DD",
                            background: "#F1F7F4",
                          }}
                        >
                          <div
                            className="w-10 h-1 rounded-full mx-auto mb-3"
                            style={{ background: "#C7D6D0" }}
                          />
                          <div className="flex items-center justify-between">
                            <div>
                              <p
                                className="font-extrabold text-base"
                                style={{
                                  color: "#075E4F",
                                  fontSize: lang === "ur" ? 18 : 16,
                                  fontFamily:
                                    lang === "ur"
                                      ? URDU_FONT
                                      : "inherit",
                                }}
                              >
                                {lang === "ur"
                                  ? `${tc(title)} ریٹ پنجاب`
                                  : `${title} Rate Punjab`}
                              </p>
                              <p
                                className="text-xs mt-0.5"
                                style={{
                                  color: "#52635F",
                                  fontSize: lang === "ur" ? 13 : 12,
                                  fontFamily:
                                    lang === "ur"
                                      ? URDU_FONT
                                      : "inherit",
                                }}
                              >
                                {selDateStr}
                              </p>
                            </div>
                            {/* Calendar icon button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDtCalOpen((o) => !o);
                              }}
                              className="tap-target flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold text-xs"
                              style={{
                                background: dtCalOpen ? "#087F63" : "#E4F2EC",
                                color: dtCalOpen ? "#fff" : "#075E4F",
                                border: "1px solid #C7E8D8",
                                fontSize: lang === "ur" ? 14 : 12,
                                fontFamily:
                                  lang === "ur"
                                    ? URDU_FONT
                                    : "inherit",
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {lang === "ur" ? "تاریخ منتخب کریں" : "Pick Date"}
                            </button>
                          </div>
                        </div>

                        {/* Expandable calendar */}
                        {dtCalOpen && (
                          <div
                            className="px-4 pt-3 pb-2 flex-shrink-0"
                            style={{
                              borderBottom: "1px solid #D5E2DD",
                              background: "#F4FAF7",
                            }}
                          >
                            {/* Month nav */}
                            <div className="flex items-center justify-between mb-2">
                              <button
                                onClick={prevMonth}
                                className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold text-base"
                                style={{
                                  background: "#E8EFEC",
                                  color: "#2F4A43",
                                }}
                              >
                                ‹
                              </button>
                              <p
                                className="font-bold text-sm"
                                style={{
                                  color: "#183B34",
                                  fontSize: lang === "ur" ? 16 : 14,
                                  fontFamily:
                                    lang === "ur"
                                      ? URDU_FONT
                                      : "inherit",
                                }}
                              >
                                {monthName}
                              </p>
                              <button
                                onClick={nextMonth}
                                className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold text-base"
                                style={{
                                  background: "#E8EFEC",
                                  color: "#2F4A43",
                                }}
                              >
                                ›
                              </button>
                            </div>
                            {/* Day headers */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7,1fr)",
                                marginBottom: 4,
                              }}
                            >
                              {(lang === "ur"
                                ? ["ات", "پی", "من", "بد", "جم", "جم", "ہف"]
                                : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
                              ).map((d) => (
                                <div
                                  key={d}
                                  className="text-center font-bold text-[10px]"
                                  style={{
                                    color: "#80918B",
                                    paddingBottom: 2,
                                    fontFamily:
                                      lang === "ur"
                                        ? URDU_FONT
                                        : "inherit",
                                  }}
                                >
                                  {d}
                                </div>
                              ))}
                            </div>
                            {/* Day grid */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7,1fr)",
                                gap: 2,
                              }}
                            >
                              {calDays.map((day, idx) => {
                                if (!day) return <div key={idx} />;
                                const d = new Date(calYear, calMonthIdx, day);
                                const selected = isSameDay(d, selD);
                                const today = isToday(d);
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setDtSelDate(d);
                                      setDtCalOpen(false);
                                    }}
                                    className="tap-target flex items-center justify-center rounded-full font-semibold text-xs mx-auto"
                                    style={{
                                      width: 32,
                                      height: 32,
                                      background: selected
                                        ? "#087F63"
                                        : today
                                          ? "#E4F2EC"
                                          : "transparent",
                                      color: selected
                                        ? "#fff"
                                        : today
                                          ? "#075E4F"
                                          : "#2F4A43",
                                      border:
                                        today && !selected
                                          ? "1.5px solid #087F63"
                                          : "none",
                                    }}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Table with column-header dropdowns & visible scrollbars */}
                        <div
                          className="flex-1 overflow-auto zm-table-scroll-container"
                          style={{
                            scrollbarWidth: "thin",
                            scrollbarColor: "#087F63 #E4F2EC",
                          }}
                          onClick={() => setDtOpenCol(null)}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              fontSize: lang === "ur" ? 12 : 10.5,
                            }}
                          >
                            <thead
                              style={{ position: "sticky", top: 0, zIndex: 10 }}
                            >
                              <tr
                                style={{ background: "#075E4F", color: "#fff" }}
                              >
                                {[
                                  "Station",
                                  "Min – Max",
                                  "Price Type",
                                  "Quality",
                                  "Trend",
                                  "Arrival",
                                  "Color",
                                  "Variety",
                                  "Condition",
                                  "Specification",
                                ].map((col) => {
                                  const hasFilter = col in colOpts;
                                  const activeVal = colState[col];
                                  const displayVal =
                                    col === "Price Type" && dtPriceType
                                      ? tr(dtPriceType)
                                        .replace(" ریٹ", "")
                                        .replace(" Rate", "")
                                      : activeVal
                                        ? col === "Specification" ||
                                          col === "Condition" ||
                                          col === "Quality" ||
                                          col === "Color" ||
                                          col === "Variety"
                                          ? t(activeVal)
                                          : activeVal
                                        : null;
                                  const colTitle = colLabels[col] || col;
                                  return (
                                    <th
                                      key={col}
                                      style={{
                                        padding: "7px 8px",
                                        textAlign:
                                          col === "Station"
                                            ? lang === "ur" ? "right" : "left"
                                            : "center",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                        borderRight:
                                          "1px solid rgba(255,255,255,0.15)",
                                        position: col === "Station" ? "sticky" : "relative",
                                        left: col === "Station" ? 0 : "auto",
                                        zIndex: col === "Station" ? 15 : 10,
                                        background: "#075E4F",
                                        fontSize: lang === "ur" ? 13 : 10.5,
                                        fontFamily:
                                          lang === "ur"
                                            ? URDU_FONT
                                            : "inherit",
                                      }}
                                    >
                                      {hasFilter ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDtOpenCol(
                                              dtOpenCol === col ? null : col,
                                            );
                                          }}
                                          className="flex items-center justify-center gap-0.5 font-bold text-white mx-auto"
                                          style={{
                                            fontSize: lang === "ur" ? 13 : 10.5,
                                            fontFamily:
                                              lang === "ur"
                                                ? URDU_FONT
                                                : "inherit",
                                          }}
                                        >
                                          {displayVal ? (
                                            <span
                                              style={{
                                                background:
                                                  "rgba(255,255,255,0.25)",
                                                borderRadius: 4,
                                                padding: "1px 4px",
                                              }}
                                            >
                                              {displayVal}
                                            </span>
                                          ) : (
                                            colTitle
                                          )}
                                          <span
                                            style={{ fontSize: 8, opacity: 0.8 }}
                                          >
                                            ▾
                                          </span>
                                        </button>
                                      ) : (
                                        colTitle
                                      )}
                                      {/* Dropdown */}
                                      {dtOpenCol === col && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: lang === "ur" ? "auto" : 0,
                                            right: lang === "ur" ? 0 : "auto",
                                            zIndex: 100,
                                            background: "#F4FAF7",
                                            borderRadius: 10,
                                            boxShadow:
                                              "0 8px 24px rgba(0,0,0,0.18)",
                                            minWidth: 140,
                                            overflow: "hidden",
                                            border: "1px solid #D5E2DD",
                                          }}
                                        >
                                          <button
                                            onClick={() => {
                                              colSetter[col](null);
                                              setDtOpenCol(null);
                                            }}
                                            className={`tap-target w-full ${lang === "ur" ? "text-right" : "text-left"} px-3 py-2 text-xs font-semibold`}
                                            style={{
                                              color:
                                                !activeVal &&
                                                  !(
                                                    col === "Price Type" &&
                                                    dtPriceType
                                                  )
                                                  ? "#075E4F"
                                                  : "#2F4A43",
                                              background:
                                                !activeVal &&
                                                  !(
                                                    col === "Price Type" &&
                                                    dtPriceType
                                                  )
                                                  ? "#E4F2EC"
                                                  : "#fff",
                                              fontSize: lang === "ur" ? 14 : 12,
                                              fontFamily:
                                                lang === "ur"
                                                  ? URDU_FONT
                                                  : "inherit",
                                            }}
                                          >
                                            {lang === "ur" ? "تمام" : "All"}
                                          </button>
                                          {colOpts[col].map((opt) => {
                                            const isActive =
                                              col === "Price Type"
                                                ? dtPriceType === opt + " Rate"
                                                : activeVal === opt;
                                            const optText =
                                              col === "Price Type"
                                                ? tr(opt + " Rate")
                                                  .replace(" ریٹ", "")
                                                  .replace(" Rate", "")
                                                : t(opt);
                                            return (
                                              <button
                                                key={opt}
                                                onClick={() => {
                                                  colSetter[col](
                                                    isActive ? null : opt,
                                                  );
                                                  setDtOpenCol(null);
                                                }}
                                                className={`tap-target w-full ${lang === "ur" ? "text-right" : "text-left"} px-3 py-2 text-xs font-semibold`}
                                                style={{
                                                  color: isActive
                                                    ? "#075E4F"
                                                    : "#2F4A43",
                                                  background: isActive
                                                    ? "#E4F2EC"
                                                    : "#fff",
                                                  fontSize:
                                                    lang === "ur" ? 14 : 12,
                                                  fontFamily:
                                                    lang === "ur"
                                                      ? URDU_FONT
                                                      : "inherit",
                                                }}
                                              >
                                                {optText}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTableRows.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={10}
                                    style={{
                                      padding: "24px",
                                      textAlign: "center",
                                      color: "#80918B",
                                      fontSize: lang === "ur" ? 16 : 13,
                                      fontFamily:
                                        lang === "ur"
                                          ? URDU_FONT
                                          : "inherit",
                                    }}
                                  >
                                    {lang === "ur"
                                      ? "کوئی ریکارڈ موجود نہیں ہے"
                                      : "No matching rows"}
                                  </td>
                                </tr>
                              ) : (
                                filteredTableRows.map((r, i) => {
                                  const trendIcon =
                                    r.trend === "up"
                                      ? "▲"
                                      : r.trend === "down"
                                        ? "▼"
                                        : "–";
                                  const trendColor =
                                    r.trend === "up"
                                      ? "#159447"
                                      : r.trend === "down"
                                        ? "#C94A43"
                                        : "#80918B";
                                  const rowQuality =
                                    r.newOld || r.quality || dtQuality || attrNewOld || "—";
                                  const rowSpec = r.spec || dtSpec || attrSpec || "—";
                                  const rowCond =
                                    r.condition || r.quality || dtCondition || attrCondition || "—";
                                  const rtColor = RATE_COLORS[r.rateType] || "#075E4F";
                                  const rowBg = i % 2 === 0 ? "#fff" : "#F1F7F4";

                                  return (
                                    <tr
                                      key={i}
                                      onClick={() => {
                                        if (voiceEnabled) {
                                          const cleanMandi = r.mandiName.replace(/\s*mandi$/i, "").replace(/\s*منڈی$/i, "");
                                          const minVal = Math.round(r.min).toLocaleString("en-PK");
                                          const maxVal = Math.round(r.max).toLocaleString("en-PK");
                                          const rtUr = tr(r.rateType).replace(" ریٹ", "").replace(" Rate", "");
                                          const spoken = lang === "ur"
                                            ? `${tm(cleanMandi)} منڈی، ${rtUr}، ریٹ ${minVal} سے ${maxVal} روپے`
                                            : `${cleanMandi} Mandi, ${r.rateType} rate, ${minVal} to ${maxVal} rupees`;
                                          speakText(spoken);
                                        }
                                      }}
                                      className="cursor-pointer transition hover:bg-[#EAF5F0]"
                                      style={{
                                        background: rowBg,
                                        borderBottom: "1px solid #E6EFEB",
                                      }}
                                    >
                                      {/* 1. Station */}
                                      <td
                                        style={{
                                          position: "sticky",
                                          left: 0,
                                          zIndex: 5,
                                          background: rowBg,
                                          padding: "7px 8px",
                                          fontWeight: 700,
                                          color: "#183B34",
                                          whiteSpace: "nowrap",
                                          fontSize: lang === "ur" ? 14 : 11,
                                          borderRight: "1px solid #D5E2DD",
                                          fontFamily:
                                            lang === "ur"
                                              ? URDU_FONT
                                              : "inherit",
                                        }}
                                      >
                                        {tm(r.mandiName.replace(" Mandi", ""))}
                                      </td>

                                      {/* 2. Min – Max */}
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          fontWeight: 700,
                                          color: "#075E4F",
                                          whiteSpace: "nowrap",
                                          textAlign: "center",
                                          fontSize: lang === "ur" ? 13 : 11,
                                        }}
                                      >
                                        {fmt(r.min)} – {fmt(r.max)}
                                      </td>

                                      {/* 3. Price Type */}
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          textAlign: "center",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <span
                                          className="rounded-full px-1.5 py-0.5 font-semibold"
                                          style={{
                                            background: rtColor + "18",
                                            color: rtColor,
                                            fontSize: lang === "ur" ? 11 : 10,
                                            fontFamily:
                                              lang === "ur"
                                                ? URDU_FONT
                                                : "inherit",
                                          }}
                                        >
                                          {tr(r.rateType)
                                            .replace(" ریٹ", "")
                                            .replace(" Rate", "")}
                                        </span>
                                      </td>

                                      {/* 4. Quality (New or Old) */}
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          textAlign: "center",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <span
                                          className="px-2 py-0.5 rounded-md font-bold text-[10px]"
                                          style={{
                                            background: rowQuality === "New" ? "#E4F4EC" : "#FFF4E6",
                                            color: rowQuality === "New" ? "#0A7F5A" : "#B45309",
                                            fontFamily:
                                              lang === "ur"
                                                ? URDU_FONT
                                                : "inherit",
                                          }}
                                        >
                                          {lang === "ur"
                                            ? rowQuality === "New"
                                              ? "نیا"
                                              : "پرانا"
                                            : rowQuality}
                                        </span>
                                      </td>

                                      {/* 5. Trend */}
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          color: trendColor,
                                          fontWeight: 700,
                                          fontSize: 11,
                                          textAlign: "center",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {trendIcon}{" "}
                                        {r.trendPct > 0 ? r.trendPct + "%" : ""}
                                      </td>

                                      {/* 6. Arrival */}
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          color: "#2F4A43",
                                          textAlign: "center",
                                          whiteSpace: "nowrap",
                                          fontSize: lang === "ur" ? 13 : 10.5,
                                        }}
                                      >
                                        {r.arrival || "—"}
                                      </td>

                                      {/* 7. Color */}
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          color: "#2F4A43",
                                          textAlign: "center",
                                          fontSize: lang === "ur" ? 13 : 10.5,
                                          fontFamily:
                                            lang === "ur"
                                              ? URDU_FONT
                                              : "inherit",
                                        }}
                                      >
                                        {lang === "ur"
                                          ? (r.color ? (t(r.color) || r.color) : "—")
                                          : r.color || "—"}
                                      </td>

                                      {/* 8. Variety */}
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          color: "#075E4F",
                                          textAlign: "center",
                                          fontWeight: 600,
                                          fontSize: lang === "ur" ? 13 : 10.5,
                                          fontFamily:
                                            lang === "ur"
                                              ? URDU_FONT
                                              : "inherit",
                                        }}
                                      >
                                        {lang === "ur"
                                          ? (r.variety ? (t(r.variety) || r.variety) : "—")
                                          : r.variety || "—"}
                                      </td>

                                      {/* 9. Condition */}
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          color: "#2F4A43",
                                          textAlign: "center",
                                          fontSize: lang === "ur" ? 13 : 10.5,
                                          fontFamily:
                                            lang === "ur"
                                              ? URDU_FONT
                                              : "inherit",
                                        }}
                                      >
                                        {lang === "ur"
                                          ? t(rowCond) || rowCond || "—"
                                          : rowCond || "—"}
                                      </td>

                                      {/* 10. Specification */}
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          color: "#2F4A43",
                                          textAlign: "center",
                                          fontSize: lang === "ur" ? 13 : 10.5,
                                          fontFamily:
                                            lang === "ur"
                                              ? URDU_FONT
                                              : "inherit",
                                        }}
                                      >
                                        {lang === "ur"
                                          ? t(rowSpec) || rowSpec || "—"
                                          : rowSpec || "—"}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div
                          className="flex justify-between items-center px-4 py-2 flex-shrink-0"
                          style={{
                            borderTop: "1px solid #D5E2DD",
                            background: "#F1F7F4",
                          }}
                        >
                          <span
                            className="text-[10px]"
                            style={{
                              color: "#80918B",
                              fontSize: lang === "ur" ? 13 : 10,
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {lang === "ur"
                              ? "یونٹ = روپے · فی ۴۰ کلو"
                              : "Unit = Rs. · Unit = (40 kg)"}
                          </span>
                          <button
                            onClick={() => setDateTableOpen(false)}
                            className="tap-target font-bold"
                            style={{
                              color: "#075E4F",
                              fontSize: lang === "ur" ? 15 : 12,
                              fontFamily:
                                lang === "ur"
                                  ? URDU_FONT
                                  : "inherit",
                            }}
                          >
                            {lang === "ur" ? "بند کریں" : "Close"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </>
          )}
        </div>
      )}

      {/* 2. TRENDS SCREEN CONTAINER - 100% Isolated */}
      {tab === "trends" && (
        <div
          className="flex-1 min-h-0 overflow-y-auto px-3.5 pt-2 pb-6 flex flex-col gap-3"
          style={{
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
            overscrollBehaviorY: "contain",
          }}
        >
          {/* Top Bar: Title on left, Location selector pill on right */}
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-xs font-bold uppercase tracking-wide"
              style={{
                color: "#52635F",
                fontSize: lang === "ur" ? 15 : 12,
                fontFamily:
                  lang === "ur"
                    ? URDU_FONT
                    : "inherit",
              }}
            >
              {lang === "ur" ? "قیمتوں کے رجحانات" : "Price Trends"}
            </p>

            <div className="flex items-center gap-1.5">
              {/* Location selector */}
              <button
                onClick={() => setLocSheet(true)}
                className="tap-target flex items-center gap-1 rounded-xl font-bold text-xs px-2.5 py-1.5 transition active:scale-95"
                style={{
                  background:
                    locScope.kind === "mandi" ? "#087F63" : "#E4F2EC",
                  color: locScope.kind === "mandi" ? "#fff" : "#075E4F",
                  border:
                    locScope.kind === "mandi" ? "none" : "1px solid #C7E8D8",
                  fontSize: lang === "ur" ? 13 : 11,
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                }}
              >
                <span>
                  {locScope.kind === "mandi"
                    ? tm(locScope.label.replace(" Mandi", ""))
                    : locScope.kind === "province"
                      ? tm(locScope.label)
                      : locScope.kind === "district"
                        ? tm(locScope.label)
                        : lang === "ur"
                          ? "پاکستان"
                          : "Pakistan"}
                </span>
                <span className="text-[9px] opacity-70">▾</span>
              </button>
            </div>
          </div>

          {/* Segmented Switcher: Price Trend vs Arrival Trend */}
          <div className="flex gap-2">
            {(
              [
                ["price", lang === "ur" ? "قیمت کا رجحان" : "Price Trend"],
                [
                  "arrival",
                  lang === "ur" ? "آمد کا رجحان" : "Arrival Trend",
                ],
              ] as ["price" | "arrival", string][]
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setTrendMode(m)}
                className="tap-target flex-1 rounded-xl font-bold text-xs transition"
                style={{
                  height: 34,
                  background: trendMode === m ? "#075E4F" : "#E8EFEC",
                  color: trendMode === m ? "#fff" : "#183B34",
                  fontSize: lang === "ur" ? 14 : 11.5,
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {trendMode === "price" ? (
            <>
              {/* Trends Price Card */}
              <div
                className="rounded-2xl p-3.5 flex flex-col gap-3 shadow-sm"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #D5E2DD",
                }}
              >
                {/* Top Bar: Financial Chart Controls & Granularity Filter */}
                <div className="flex items-center justify-between gap-1 pb-2 border-b border-[#E8EFEC] flex-wrap">
                  {/* Granularity Pills: 1, 5, 15, 30, 1H, 5H, 1D, 1W, 1M */}
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5" style={{ scrollbarWidth: "none" }}>
                    {["1", "5", "15", "30", "1H", "5H", "1D", "1W", "1M"].map((g) => {
                      const isGActive = stockGranularity === g;
                      return (
                        <button
                          key={g}
                          onClick={() => setStockGranularity(g)}
                          className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition-colors ${isGActive
                            ? "bg-[#087F63] text-white shadow-xs"
                            : "text-[#52635F] hover:bg-[#F1F7F4] hover:text-[#143B33]"
                            }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>

                  {/* Compare Button & Mode Indicator */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setCompareMode((prev) => {
                          const next = !prev;
                          if (next) {
                            if (activeTypes.length < 2) {
                              const other = orderedRateTypes.find((t) => t !== focusedType) || ALL_RATE_TYPES.find((t) => t !== focusedType) || "Mill Rate";
                              setActiveTypes([focusedType, other]);
                            }
                          } else {
                            setActiveTypes([focusedType]);
                          }
                          return next;
                        });
                      }}
                      className="tap-target flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all active:scale-95 shadow-xs"
                      style={{
                        background: compareMode ? "#087F63" : "#F1F7F4",
                        color: compareMode ? "#FFFFFF" : "#143B33",
                        border: `1.5px solid ${compareMode ? "#087F63" : "#B8D5CB"}`,
                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                      }}
                    >
                      <span>+ {compareMode ? (lang === "ur" ? "اکیلا دیکھیں (Single)" : "Single Mode") : (lang === "ur" ? "موازنہ کریں (Compare)" : "Compare Rates")}</span>
                    </button>
                  </div>
                </div>

                {/* Agricultural Commodity Header */}
                {(() => {
                  const mainSeries = activeSeries.find((s) => s.label === focusedType) || activeSeries[0] || priceSeries[0];
                  const currentIdx = hoverIdx !== null ? hoverIdx : len - 1;
                  const displayPrice = mainSeries?.data[currentIdx] || 0;
                  const startPrice = mainSeries?.data[0] || displayPrice || 1;
                  const changeAmt = displayPrice - startPrice;
                  const absPct = Math.abs((changeAmt / (startPrice || 1)) * 100).toFixed(2);
                  const isPositive = changeAmt > 0;
                  const isFlat = changeAmt === 0;
                  const seriesMax = mainSeries ? Math.max(...mainSeries.data) : displayPrice;
                  const seriesMin = mainSeries ? Math.min(...mainSeries.data) : displayPrice;
                  const seriesAvg = mainSeries ? Math.round(mainSeries.data.reduce((a, b) => a + b, 0) / mainSeries.data.length) : displayPrice;

                  return (
                    <div className="flex flex-col gap-2 border-b border-[#E8EFEC] pb-2.5">
                      {/* Title & Active Rate Type Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs sm:text-sm font-extrabold text-[#143B33]"
                            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                          >
                            {byproduct ? `${tc(byproduct)}` : `${tc(product)}`} {lang === "ur" ? "مارکیٹ ریٹ انڈیکس" : "Market Rate Index"}
                          </span>
                          <span className="text-[10px] font-bold text-[#087F63] bg-[#E8F8F4] px-2 py-0.5 rounded-full border border-[#C2E8DB]">
                            {tr(focusedType).replace(" ریٹ", "").replace(" Rate", "")}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#80918B]">
                          {lang === "ur" ? "روپے فی ۴۰ کلو" : "PKR / 40kg"}
                        </span>
                      </div>

                      {/* Price & Change Display */}
                      <div className="flex items-baseline justify-between flex-wrap gap-2">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-2xl sm:text-3xl font-black text-[#143B33] tracking-tight">
                            {lang === "ur" ? `روپے ${toUrduDigits(displayPrice.toLocaleString())}` : `Rs. ${displayPrice.toLocaleString()}`}
                          </span>
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1"
                            style={{
                              background: isFlat ? "#F3F4F6" : isPositive ? "#DCFCE7" : "#FEE2E2",
                              color: isFlat ? "#4B5563" : isPositive ? "#15803D" : "#B91C1C",
                              border: `1px solid ${isFlat ? "#E5E7EB" : isPositive ? "#86EFAC" : "#FCA5A5"}`,
                            }}
                          >
                            <span>{isFlat ? "—" : isPositive ? "▲" : "▼"}</span>
                            <span>{absPct}%</span>
                          </span>
                        </div>

                        {/* Date / Scrub Indicator */}
                        <div className="text-[11px] font-semibold text-[#52635F]">
                          {fullDateLabels[currentIdx]?.fullDate || "14 Sep 2026"}
                        </div>
                      </div>

                      {/* Stat Summary Bar (High, Low, Avg) */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                        <div className="bg-[#F8FBFA] p-1.5 rounded-lg border border-[#E8EFEC] flex flex-col">
                          <span className="text-[#80918B] font-semibold">
                            {lang === "ur" ? "زیادہ سے زیادہ" : "Period High"}
                          </span>
                          <span className="font-bold text-[#143B33] text-xs">
                            {lang === "ur" ? `روپے ${toUrduDigits(seriesMax)}` : `Rs. ${seriesMax.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="bg-[#F8FBFA] p-1.5 rounded-lg border border-[#E8EFEC] flex flex-col">
                          <span className="text-[#80918B] font-semibold">
                            {lang === "ur" ? "کم سے کم" : "Period Low"}
                          </span>
                          <span className="font-bold text-[#143B33] text-xs">
                            {lang === "ur" ? `روپے ${toUrduDigits(seriesMin)}` : `Rs. ${seriesMin.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="bg-[#F8FBFA] p-1.5 rounded-lg border border-[#E8EFEC] flex flex-col">
                          <span className="text-[#80918B] font-semibold">
                            {lang === "ur" ? "اوسط ریٹ" : "Period Avg"}
                          </span>
                          <span className="font-bold text-[#087F63] text-xs">
                            {lang === "ur" ? `روپے ${toUrduDigits(seriesAvg)}` : `Rs. ${seriesAvg.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Active Comparison Legend when Compare Mode is Active */}
                {compareMode && (
                  <div className="flex flex-wrap gap-1.5 items-center p-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                    <span className="text-[10.5px] font-bold text-[#166534]">
                      {lang === "ur" ? "موازنہ کیا جا رہا ہے:" : "Comparing Rates:"}
                    </span>
                    {activeSeries.map((s) => {
                      const curVal = s.data[hoverIdx !== null ? hoverIdx : len - 1] || 0;
                      return (
                        <span
                          key={`comp-badge-${s.label}`}
                          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-white shadow-xs"
                          style={{ background: s.color || "#087F63" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                          <span>{tr(s.label).replace(" ریٹ", "").replace(" Rate", "")}:</span>
                          <span>{lang === "ur" ? `روپے ${toUrduDigits(curVal.toLocaleString())}` : `Rs. ${curVal.toLocaleString()}`}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* SVG Chart Canvas (Price Trend with Volume Bars) */}
                {(() => {
                  const mainSeries = activeSeries.find((s) => s.label === focusedType) || activeSeries[0] || priceSeries[0];
                  const currentClose = mainSeries?.data[len - 1] || 0;
                  const currentCloseY = yOf(currentClose, pMin, pMax);

                  // Arrival volume scaling
                  const maxArr = Math.max(...arrivalData, 1);
                  const volBaseY = CH - PB;
                  const volMaxH = 24;
                  const separatorY = compareMode ? volBaseY : volBaseY - volMaxH - 8;

                  return (
                    <div className="relative w-full select-none bg-[#FCFDFD] rounded-xl border border-[#EDF4F1] p-1">
                      <svg
                        viewBox={`0 0 ${CW} ${CH}`}
                        className="w-full select-none"
                        style={{ height: CH, display: "block", touchAction: "none" }}
                        onMouseDown={(e) => {
                          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                          const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                          const i = Math.round((relX / chartW) * (len - 1));
                          setHoverIdx(Math.max(0, Math.min(len - 1, i)));
                        }}
                        onMouseMove={(e) => {
                          if (e.buttons === 1 || hoverIdx !== null) {
                            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                            const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                            const i = Math.round((relX / chartW) * (len - 1));
                            setHoverIdx(Math.max(0, Math.min(len - 1, i)));
                          }
                        }}
                        onMouseUp={() => setHoverIdx(null)}
                        onMouseLeave={() => setHoverIdx(null)}
                        onTouchStart={(e) => {
                          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                          const touch = e.touches[0];
                          if (touch) {
                            const relX = ((touch.clientX - rect.left) / rect.width) * CW - PL;
                            const i = Math.round((relX / chartW) * (len - 1));
                            setHoverIdx(Math.max(0, Math.min(len - 1, i)));
                          }
                        }}
                        onTouchMove={(e) => {
                          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                          const touch = e.touches[0];
                          if (touch) {
                            const relX = ((touch.clientX - rect.left) / rect.width) * CW - PL;
                            const i = Math.round((relX / chartW) * (len - 1));
                            setHoverIdx(Math.max(0, Math.min(len - 1, i)));
                          }
                        }}
                        onTouchEnd={() => setHoverIdx(null)}
                        onTouchCancel={() => setHoverIdx(null)}
                      >
                        <defs>
                          {activeSeries.map((s) => (
                            <linearGradient
                              key={`grad-${s.label}`}
                              id={`areaGrad-${s.label.replace(/\s+/g, "_")}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor={s.color || "#087F63"} stopOpacity="0.22" />
                              <stop offset="75%" stopColor={s.color || "#087F63"} stopOpacity="0.03" />
                              <stop offset="100%" stopColor={s.color || "#087F63"} stopOpacity="0.00" />
                            </linearGradient>
                          ))}
                        </defs>

                        {/* Horizontal Gridlines + Left & Right Price Axis Labels */}
                        {yPriceTicks.map((tick, ti) => {
                          const y = yOf(tick, pMin, pMax);
                          return (
                            <g key={`yTick-${ti}`}>
                              <line
                                x1={PL}
                                y1={y}
                                x2={CW - PR}
                                y2={y}
                                stroke="#E2ECE8"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={PL - 6}
                                y={y + 3.5}
                                textAnchor="end"
                                fontSize="10.5"
                                fontWeight="700"
                                fill="#1E3A34"
                              >
                                {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                              </text>
                              <text
                                x={CW - PR + 8}
                                y={y + 3.5}
                                textAnchor="start"
                                fontSize="10"
                                fontWeight="700"
                                fill="#264E43"
                              >
                                {tick}
                              </text>
                            </g>
                          );
                        })}

                        {/* Pane Separator Line (Line Graph vs Bar Graph) */}
                        {!compareMode && (
                          <>
                            <line
                              x1={PL}
                              y1={separatorY}
                              x2={CW - PR}
                              y2={separatorY}
                              stroke="#94A3B8"
                              strokeWidth="1.2"
                              strokeDasharray="4 3"
                            />
                            <text
                              x={PL - 6}
                              y={separatorY + 3.5}
                              textAnchor="end"
                              fontSize="9.5"
                              fontWeight="800"
                              fill="#475569"
                            >
                              0
                            </text>
                            <text
                              x={CW - PR + 8}
                              y={separatorY + 3.5}
                              textAnchor="start"
                              fontSize="9.5"
                              fontWeight="800"
                              fill="#475569"
                            >
                              VOL
                            </text>
                          </>
                        )}

                        {/* Volume Baseline / X-Axis Baseline */}
                        <line
                          x1={PL}
                          y1={volBaseY}
                          x2={CW - PR}
                          y2={volBaseY}
                          stroke="#C8DCD5"
                          strokeWidth="1.4"
                        />

                        {/* X-Axis Date Labels */}
                        {xLabels.map((lbl, i) =>
                          lbl ? (
                            <text
                              key={`xPriceTick-${i}`}
                              x={xOf(i, len)}
                              y={CH - 8}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="700"
                              fill="#1E3A34"
                              fontFamily={lang === "ur" ? URDU_FONT : "inherit"}
                            >
                              {lbl}
                            </text>
                          ) : null,
                        )}

                        {/* Mini Arrival Volume Bars along Bottom (Hidden when comparing) */}
                        {!compareMode &&
                          arrivalData.map((arrVal, i) => {
                            const barX = xOf(i, len);
                            const barH = (arrVal / maxArr) * volMaxH;
                            const prevP = i > 0 ? (mainSeries?.data[i - 1] || 0) : (mainSeries?.data[i] || 0);
                            const curP = mainSeries?.data[i] || 0;
                            const isUp = curP >= prevP;
                            const barW = Math.max(2, Math.min(6, (chartW / len) * 0.55));
                            const isHov = hoverIdx === i;

                            return (
                              <rect
                                key={`vol-${i}`}
                                x={barX - barW / 2}
                                y={volBaseY - barH}
                                width={barW}
                                height={barH}
                                rx={1}
                                fill={isUp ? "#10B981" : "#EF4444"}
                                opacity={isHov ? 1 : 0.65}
                              />
                            );
                          })}

                        {/* Line Graphs Rendering: Multiple Lines in Compare Mode, Single Line in Normal Mode */}
                        {compareMode ? (
                          // Compare Mode: Render ALL activeSeries with distinct solid colored lines and price tags
                          activeSeries.map((s) => {
                            const pts = s.data
                              .map(
                                (v, i) =>
                                  `${i === 0 ? "M" : "L"}${xOf(i, len).toFixed(1)},${yOf(v, pMin, pMax).toFixed(1)}`,
                              )
                              .join(" ");
                            const sClose = s.data[len - 1] || 0;
                            const sCloseY = yOf(sClose, pMin, pMax);

                            return (
                              <g key={`comp-line-${s.label}`}>
                                <path
                                  d={pts}
                                  stroke={s.color || "#087F63"}
                                  strokeWidth="2.5"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {/* Latest Price Right-side Tag */}
                                <g transform={`translate(${CW - PR + 4}, ${Math.max(PT, Math.min(separatorY - 16, sCloseY - 8))})`}>
                                  <rect
                                    x={0}
                                    y={0}
                                    width={38}
                                    height={16}
                                    rx={4}
                                    fill={s.color || "#087F63"}
                                    stroke="#FFFFFF"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={19}
                                    y={11.5}
                                    textAnchor="middle"
                                    fontSize="9.5"
                                    fontWeight="800"
                                    fill="#FFFFFF"
                                  >
                                    {sClose >= 1000 ? `${(sClose / 1000).toFixed(1)}k` : sClose}
                                  </text>
                                </g>
                                {/* Live Pulse Dot on Latest Value */}
                                <circle
                                  cx={xOf(len - 1, len)}
                                  cy={sCloseY}
                                  r="3.5"
                                  fill={s.color || "#087F63"}
                                  stroke="#FFFFFF"
                                  strokeWidth="1.5"
                                />
                              </g>
                            );
                          })
                        ) : (
                          // Single Focused Rate Type Line & Area Gradient Glow
                          (() => {
                            const s = activeSeries.find((ser) => ser.label === focusedType) || activeSeries[0];
                            if (!s) return null;
                            const pts = s.data
                              .map(
                                (v, i) =>
                                  `${i === 0 ? "M" : "L"}${xOf(i, len).toFixed(1)},${yOf(v, pMin, pMax).toFixed(1)}`,
                              )
                              .join(" ");
                            const areaPath = `${pts} L${xOf(len - 1, len).toFixed(1)},${separatorY} L${PL},${separatorY} Z`;

                            return (
                              <g key={`main-${s.label}`}>
                                <path
                                  d={areaPath}
                                  fill={`url(#areaGrad-${s.label.replace(/\s+/g, "_")})`}
                                />
                                <path
                                  d={pts}
                                  stroke={s.color || "#087F63"}
                                  strokeWidth="2.5"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                {/* Dotted Horizontal Guideline for latest price */}
                                <line
                                  x1={PL}
                                  y1={currentCloseY}
                                  x2={CW - PR}
                                  y2={currentCloseY}
                                  stroke={s.color || "#087F63"}
                                  strokeWidth="0.9"
                                  strokeDasharray="3 3"
                                  opacity="0.6"
                                />
                                {/* Latest Price Right-side Tag */}
                                <g transform={`translate(${CW - PR + 4}, ${Math.max(PT, Math.min(separatorY - 16, currentCloseY - 8))})`}>
                                  <rect
                                    x={0}
                                    y={0}
                                    width={38}
                                    height={16}
                                    rx={4}
                                    fill={s.color || "#087F63"}
                                    stroke="#FFFFFF"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={19}
                                    y={11.5}
                                    textAnchor="middle"
                                    fontSize="9.5"
                                    fontWeight="800"
                                    fill="#FFFFFF"
                                  >
                                    {currentClose >= 1000 ? `${(currentClose / 1000).toFixed(1)}k` : currentClose}
                                  </text>
                                </g>

                                {/* Live Pulse Dot on Latest Value */}
                                <circle
                                  cx={xOf(len - 1, len)}
                                  cy={currentCloseY}
                                  r="4"
                                  fill={s.color || "#087F63"}
                                  stroke="#FFFFFF"
                                  strokeWidth="2"
                                />
                              </g>
                            );
                          })()
                        )}

                        {/* Interactive Hover Crosshair Lines */}
                        {hoverIdx !== null && (
                          <g>
                            {/* Full-height vertical crosshair */}
                            <line
                              x1={xOf(hoverIdx, len)}
                              y1={PT}
                              x2={xOf(hoverIdx, len)}
                              y2={volBaseY}
                              stroke="#0284C7"
                              strokeWidth="1.2"
                              strokeDasharray="2 2"
                            />
                            {/* Horizontal crosshair */}
                            <line
                              x1={PL}
                              y1={yOf(mainSeries?.data[hoverIdx] || 0, pMin, pMax)}
                              x2={CW - PR}
                              y2={yOf(mainSeries?.data[hoverIdx] || 0, pMin, pMax)}
                              stroke="#0284C7"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                              opacity="0.75"
                            />
                            <circle
                              cx={xOf(hoverIdx, len)}
                              cy={yOf(mainSeries?.data[hoverIdx] || 0, pMin, pMax)}
                              r="5"
                              fill="#0284C7"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                          </g>
                        )}
                      </svg>

                      {/* Interactive Agricultural Hover Tooltip */}
                      {hoverIdx !== null && (() => {
                        const dateStr = fullDateLabels[hoverIdx]?.fullDate || "14 Sep 2026";

                        if (compareMode) {
                          return (
                            <div
                              className="pointer-events-none absolute z-20 rounded-xl shadow-xl border p-2.5 flex flex-col gap-1.5 backdrop-blur-md transition-all duration-75"
                              style={{
                                left: `${Math.min(Math.max((xOf(hoverIdx, len) / CW) * 100, 24), 76)}%`,
                                top: 12,
                                transform: "translateX(-50%)",
                                background: "rgba(255, 255, 255, 0.97)",
                                borderColor: "#087F63",
                                minWidth: 170,
                                boxShadow: "0 8px 24px -4px rgba(8, 127, 99, 0.22)",
                              }}
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold text-[#087F63] border-b border-[#E8EFEC] pb-1">
                                <span>{lang === "ur" ? "تاریخ:" : "Date:"}</span>
                                <span className="font-mono text-[#0F172A]">{dateStr}</span>
                              </div>
                              <div className="flex flex-col gap-1 pt-0.5">
                                {activeSeries.map((s) => {
                                  const pVal = s.data[hoverIdx] || 0;
                                  return (
                                    <div key={`tip-${s.label}`} className="flex items-center justify-between text-[10.5px]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ background: s.color || "#087F63" }} />
                                        <span className="font-semibold text-[#334155]">{tr(s.label).replace(" ریٹ", "").replace(" Rate", "")}:</span>
                                      </div>
                                      <span className="font-mono font-bold" style={{ color: s.color || "#087F63" }}>
                                        Rs. {pVal.toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        const curP = mainSeries?.data[hoverIdx] || 0;
                        const minP = mainSeries?.mins?.[hoverIdx] || Math.max(0, curP - Math.round(curP * 0.008));
                        const maxP = mainSeries?.maxs?.[hoverIdx] || (curP + Math.round(curP * 0.008));
                        const volVal = arrivalData[hoverIdx] || 0;

                        return (
                          <div
                            className="pointer-events-none absolute z-20 rounded-xl shadow-xl border p-2.5 flex flex-col gap-1 backdrop-blur-md transition-all duration-75"
                            style={{
                              left: `${Math.min(Math.max((xOf(hoverIdx, len) / CW) * 100, 24), 76)}%`,
                              top: 12,
                              transform: "translateX(-50%)",
                              background: "rgba(255, 255, 255, 0.97)",
                              borderColor: "#38BDF8",
                              minWidth: 160,
                              boxShadow: "0 8px 24px -4px rgba(2, 132, 199, 0.22)",
                            }}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-[#0284C7] border-b border-[#E0F2FE] pb-1">
                              <span>DT:</span>
                              <span className="font-mono text-[#0F172A]">{dateStr}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px] font-semibold text-[#334155] pt-1">
                              <span className="text-[#64748B]">
                                {lang === "ur" ? "کم سے کم ریٹ:" : "Min Rate:"}
                              </span>
                              <span className="font-mono font-bold text-right text-[#B91C1C]">
                                Rs. {minP.toLocaleString()}
                              </span>

                              <span className="text-[#64748B]">
                                {lang === "ur" ? "زیادہ سے زیادہ:" : "Max Rate:"}
                              </span>
                              <span className="font-mono font-bold text-right text-[#15803D]">
                                Rs. {maxP.toLocaleString()}
                              </span>

                              <span className="text-[#64748B]">
                                {lang === "ur" ? "آمد:" : "Arrivals:"}
                              </span>
                              <span className="font-mono font-bold text-right text-[#0284C7]">
                                {volVal > 0 ? `${volVal.toLocaleString()} bags` : "—"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* 1. Timeframe Filter: 1 Month, 3 Months, 6 Months, 1 Year */}
                <div className="pt-0.5">
                  <div className="grid grid-cols-4 gap-1.5 border border-[#D5E2DD] rounded-xl p-1 bg-[#F9FBFA]">
                    {[
                      { id: "1M", labelEn: "1 Month", labelUr: "۱ مہینہ", r: "month" as const },
                      { id: "3M", labelEn: "3 Months", labelUr: "۳ مہینے", r: "quarter" as const },
                      { id: "6M", labelEn: "6 Months", labelUr: "۶ مہینے", r: "quarter" as const },
                      { id: "1Y", labelEn: "1 Year", labelUr: "۱ سال", r: "quarter" as const },
                    ].map((tf) => {
                      const isTfActive = stockTimeframe === tf.id;
                      return (
                        <button
                          key={tf.id}
                          onClick={() => {
                            setStockTimeframe(tf.id as any);
                            setRange(tf.r);
                          }}
                          className={`flex items-center justify-center py-2 px-1 rounded-lg transition-all font-bold ${isTfActive
                            ? "bg-[#087F63] text-white shadow-sm ring-1 ring-[#087F63]/30 scale-[1.01]"
                            : "bg-white/80 text-[#52635F] hover:bg-white hover:text-[#183B34] border border-[#E8EFEC]"
                            }`}
                          style={{
                            fontSize: lang === "ur" ? 13 : 11,
                            fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                          }}
                        >
                          <span>{lang === "ur" ? tf.labelUr : tf.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Rate Types Selector (Selected Card Rate Type First, Remaining Next, All at the End) */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-bold text-[#52635F]"
                      style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                    >
                      {lang === "ur" ? "نرخ منتخب کریں (ریٹ تبدیل کریں)" : "Select Rate Type"}
                    </span>
                    {compareMode && (
                      <span className="text-[10px] font-semibold text-[#087F63] bg-[#E8F8F4] px-1.5 py-0.5 rounded">
                        {activeSeries.length} {lang === "ur" ? "اقسام فعال ہیں" : "Active Types"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center w-full" style={{ direction: "ltr" }}>
                    {/* Individual Rate Types with Overview selection in the 1st position */}
                    {orderedRateTypes.map((tRt) => {
                      const isFocused = focusedType === tRt;
                      const isCompared = activeTypes.includes(tRt);
                      const isSelected = compareMode ? isCompared : isFocused;
                      const chipColor = RATE_COLORS[tRt] || "#087F63";

                      return (
                        <button
                          key={tRt}
                          onClick={() => {
                            if (compareMode) {
                              // Multi-select toggle in compare mode: stacks or unstacks rate types
                              setActiveTypes((prev) => {
                                if (prev.includes(tRt)) {
                                  if (prev.length > 1) {
                                    const remaining = prev.filter((x) => x !== tRt);
                                    if (focusedType === tRt) setFocusedType(remaining[0]);
                                    return remaining;
                                  }
                                  return prev; // keep at least 1 rate type selected
                                } else {
                                  setFocusedType(tRt);
                                  return [...prev, tRt];
                                }
                              });
                            } else {
                              setFocusedType(tRt);
                              setActiveTypes([tRt]);
                            }
                          }}
                          className="tap-target flex items-center gap-1.5 rounded-full font-bold transition-all active:scale-95 shadow-xs"
                          style={{
                            fontSize: lang === "ur" ? 13 : 11,
                            padding: "5px 11px",
                            background: isSelected ? chipColor : "#F4FAF7",
                            border: `1.5px solid ${isSelected ? chipColor : "#D5E2DD"}`,
                            color: isSelected ? "#FFFFFF" : "#52635F",
                            fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                          }}
                        >
                          <span
                            className="rounded-full flex-shrink-0"
                            style={{
                              width: 7,
                              height: 7,
                              background: isSelected ? "#FFFFFF" : chipColor,
                            }}
                          />
                          <span>{tr(tRt).replace(" ریٹ", "").replace(" Rate", "")}</span>
                          {compareMode && isSelected && (
                            <span className="text-[9px] bg-white/25 px-1 rounded-sm">✓</span>
                          )}
                        </button>
                      );
                    })}

                    {/* All / تمام نرخ Button at the Very End */}
                    <button
                      onClick={() => {
                        if (compareMode && activeTypes.length === ALL_RATE_TYPES.length) {
                          setCompareMode(false);
                          setActiveTypes([focusedType]);
                        } else {
                          setCompareMode(true);
                          setActiveTypes([...ALL_RATE_TYPES]);
                        }
                      }}
                      className="tap-target flex items-center gap-1.5 rounded-full font-bold transition-all active:scale-95 shadow-xs"
                      style={{
                        fontSize: lang === "ur" ? 13 : 11,
                        padding: "5px 12px",
                        background:
                          compareMode && activeTypes.length === ALL_RATE_TYPES.length
                            ? "#087F63"
                            : "#E8EFEC",
                        border: `1.5px solid ${compareMode && activeTypes.length === ALL_RATE_TYPES.length
                          ? "#087F63"
                          : "#D5E2DD"
                          }`,
                        color:
                          compareMode && activeTypes.length === ALL_RATE_TYPES.length
                            ? "#FFFFFF"
                            : "#183B34",
                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                      }}
                    >
                      <span>{lang === "ur" ? "سب (All)" : "All"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dedicated Scroll Buffer for Trends Screen */}
              <div className="w-full h-36 flex-shrink-0" />
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className="rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-sm"
                style={{ background: "#FFFFFF", border: "1px solid #D5E2DD" }}
              >
                {/* Top Bar: Granularity Filter for Arrival Trend */}
                <div className="flex items-center justify-between gap-1 pb-2 border-b border-[#E8EFEC]">
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5" style={{ scrollbarWidth: "none" }}>
                    {["1", "5", "15", "30", "1H", "5H", "1D", "1W", "1M"].map((g) => {
                      const isGActive = stockGranularity === g;
                      return (
                        <button
                          key={g}
                          onClick={() => setStockGranularity(g)}
                          className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition-colors flex-shrink-0 ${isGActive
                            ? "bg-[#D97706] text-white shadow-xs"
                            : "text-[#52635F] hover:bg-[#F1F7F4] hover:text-[#143B33]"
                            }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Arrival Header HUD */}
                {(() => {
                  const currentIdx = arrivalHoverIdx !== null ? arrivalHoverIdx : len - 1;
                  const displayArr = arrivalData[currentIdx] || 0;
                  const totalArrival = arrivalData.reduce((a, b) => a + b, 0);
                  const peakArrival = Math.max(...arrivalData);
                  const avgArrival = Math.round(totalArrival / arrivalData.length);

                  return (
                    <div className="flex flex-col gap-2 border-b border-[#E8EFEC] pb-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                          <span
                            className="text-xs font-bold text-[#143B33]"
                            style={{
                              fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                              fontSize: lang === "ur" ? 15 : 12,
                            }}
                          >
                            {lang === "ur" ? "آمد کی مقدار (مارکیٹ رسد)" : "Arrival Volume Trend"}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-[#FDE68A]">
                          {lang === "ur" ? "تھیلے" : "Bags"}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between flex-wrap gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-[#92400E]">
                            {lang === "ur" ? `${toUrduDigits(displayArr.toLocaleString())} تھیلے` : `${displayArr.toLocaleString()} Bags`}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-[#52635F]">
                          {fullDateLabels[currentIdx]?.fullDate}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                        <div className="bg-[#FFFDF5] p-1.5 rounded-lg border border-[#FDE68A] flex flex-col">
                          <span className="text-[#92400E] font-semibold">
                            {lang === "ur" ? "کل آمد" : "Total Period"}
                          </span>
                          <span className="font-bold text-[#78350F] text-xs">
                            {totalArrival.toLocaleString()} Bags
                          </span>
                        </div>
                        <div className="bg-[#FFFDF5] p-1.5 rounded-lg border border-[#FDE68A] flex flex-col">
                          <span className="text-[#92400E] font-semibold">
                            {lang === "ur" ? "سب سے زیادہ" : "Peak Day"}
                          </span>
                          <span className="font-bold text-[#78350F] text-xs">
                            {peakArrival.toLocaleString()} Bags
                          </span>
                        </div>
                        <div className="bg-[#FFFDF5] p-1.5 rounded-lg border border-[#FDE68A] flex flex-col">
                          <span className="text-[#92400E] font-semibold">
                            {lang === "ur" ? "روزانہ اوسط" : "Daily Avg"}
                          </span>
                          <span className="font-bold text-[#92400E] text-xs">
                            {avgArrival.toLocaleString()} Bags
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* SVG Arrival Canvas with both Arrival Line, Area Gradient AND Bottom Volume Bars */}
                <div className="relative w-full select-none">
                  <svg
                    viewBox={`0 0 ${CW} ${CH}`}
                    className="w-full select-none"
                    style={{ height: CH, display: "block", touchAction: "none" }}
                    onMouseDown={(e) => {
                      const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                      const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                      const i = Math.round((relX / chartW) * (len - 1));
                      setArrivalHoverIdx(Math.max(0, Math.min(len - 1, i)));
                    }}
                    onMouseMove={(e) => {
                      if (e.buttons === 1 || arrivalHoverIdx !== null) {
                        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                        const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                        const i = Math.round((relX / chartW) * (len - 1));
                        setArrivalHoverIdx(Math.max(0, Math.min(len - 1, i)));
                      }
                    }}
                    onMouseUp={() => setArrivalHoverIdx(null)}
                    onMouseLeave={() => setArrivalHoverIdx(null)}
                    onTouchStart={(e) => {
                      const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                      const touch = e.touches[0];
                      if (touch) {
                        const relX = ((touch.clientX - rect.left) / rect.width) * CW - PL;
                        const i = Math.round((relX / chartW) * (len - 1));
                        setArrivalHoverIdx(Math.max(0, Math.min(len - 1, i)));
                      }
                    }}
                    onTouchMove={(e) => {
                      const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                      const touch = e.touches[0];
                      if (touch) {
                        const relX = ((touch.clientX - rect.left) / rect.width) * CW - PL;
                        const i = Math.round((relX / chartW) * (len - 1));
                        setArrivalHoverIdx(Math.max(0, Math.min(len - 1, i)));
                      }
                    }}
                    onTouchEnd={() => setArrivalHoverIdx(null)}
                    onTouchCancel={() => setArrivalHoverIdx(null)}
                  >
                    <defs>
                      <linearGradient id="arrivalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D97706" stopOpacity="0.32" />
                        <stop offset="85%" stopColor="#D97706" stopOpacity="0.04" />
                        <stop offset="100%" stopColor="#D97706" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Dashed Gridlines + Y Ticks */}
                    {yArrivalTicks.map((tick, ti) => {
                      const y = yOfArr(tick, aMin, aMax);
                      return (
                        <g key={`yArrTick-${ti}`}>
                          <line
                            x1={PL}
                            y1={y}
                            x2={CW - PR}
                            y2={y}
                            stroke="#E2ECE8"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={PL - 6}
                            y={y + 3.5}
                            textAnchor="end"
                            fontSize="10.5"
                            fontWeight="700"
                            fill="#1E3A34"
                          >
                            {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                          </text>
                          <text
                            x={CW - PR + 8}
                            y={y + 3.5}
                            textAnchor="start"
                            fontSize="10"
                            fontWeight="700"
                            fill="#264E43"
                          >
                            {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-Axis Baseline */}
                    <line
                      x1={PL}
                      y1={CH - PB}
                      x2={CW - PR}
                      y2={CH - PB}
                      stroke="#C8DCD5"
                      strokeWidth="1.4"
                    />

                    {/* X-Axis Dates */}
                    {xLabels.map((lbl, i) =>
                      lbl ? (
                        <text
                          key={`xArrTick-${i}`}
                          x={xOf(i, len)}
                          y={CH - 8}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill="#1E3A34"
                          fontFamily={lang === "ur" ? URDU_FONT : "inherit"}
                        >
                          {lbl}
                        </text>
                      ) : null,
                    )}

                    {/* Arrival Volume Bars along Bottom to Maintain Consistency */}
                    {arrivalData.map((arrVal, i) => {
                      const barX = xOf(i, len);
                      const maxArr = Math.max(...arrivalData, 1);
                      const volMaxH = 34;
                      const volBaseY = CH - PB;
                      const barH = (arrVal / maxArr) * volMaxH;
                      const barW = Math.max(2, Math.min(6, (chartW / len) * 0.55));
                      const isHov = arrivalHoverIdx === i;

                      return (
                        <rect
                          key={`arr-vol-bar-${i}`}
                          x={barX - barW / 2}
                          y={volBaseY - barH}
                          width={barW}
                          height={barH}
                          rx={1}
                          fill="#D97706"
                          opacity={isHov ? 0.9 : 0.55}
                        />
                      );
                    })}

                    {/* Area Fill */}
                    <path
                      d={[
                        ...arrivalData.map(
                          (v, i) =>
                            `${i === 0 ? "M" : "L"}${xOf(i, len).toFixed(1)},${yOf(v, aMin, aMax).toFixed(1)}`,
                        ),
                        `L${xOf(len - 1, len).toFixed(1)},${CH - PB}`,
                        `L${PL},${CH - PB}`,
                        "Z",
                      ].join(" ")}
                      fill="url(#arrivalGrad)"
                    />

                    {/* Main Line */}
                    <path
                      d={arrivalData
                        .map(
                          (v, i) =>
                            `${i === 0 ? "M" : "L"}${xOf(i, len).toFixed(1)},${yOf(v, aMin, aMax).toFixed(1)}`,
                        )
                        .join(" ")}
                      stroke="#D97706"
                      strokeWidth="2.8"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Hover Guide and Marker */}
                    {arrivalHoverIdx !== null && (
                      <g>
                        <line
                          x1={xOf(arrivalHoverIdx, len)}
                          y1={PT}
                          x2={xOf(arrivalHoverIdx, len)}
                          y2={CH - PB}
                          stroke="#92400E"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />
                        <circle
                          cx={xOf(arrivalHoverIdx, len)}
                          cy={yOf(arrivalData[arrivalHoverIdx], aMin, aMax)}
                          r="5.5"
                          fill="#D97706"
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                        />
                      </g>
                    )}
                  </svg>

                  {/* Arrival Hover Tooltip Overlay */}
                  {arrivalHoverIdx !== null && (
                    <div
                      className="pointer-events-none absolute z-20 rounded-xl shadow-lg border p-2 flex flex-col gap-0.5 backdrop-blur-md transition-all duration-75"
                      style={{
                        left: `${Math.min(Math.max((xOf(arrivalHoverIdx, len) / CW) * 100, 18), 82)}%`,
                        top: 8,
                        transform: "translateX(-50%)",
                        background: "rgba(120, 53, 15, 0.94)",
                        borderColor: "rgba(255, 255, 255, 0.18)",
                        minWidth: 120,
                      }}
                    >
                      <span
                        className="text-[10px] font-bold text-[#FDE68A] border-b border-white/10 pb-0.5"
                        style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                      >
                        {fullDateLabels[arrivalHoverIdx]?.fullDate}
                      </span>
                      <div className="flex items-center justify-between gap-2 pt-0.5 text-xs text-white">
                        <span className="font-semibold opacity-90" style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}>
                          {lang === "ur" ? "آمد" : "Arrival"}
                        </span>
                        <span className="font-black">
                          {lang === "ur"
                            ? `${toUrduDigits((arrivalData[arrivalHoverIdx] || 0).toLocaleString())} تھیلے`
                            : `${(arrivalData[arrivalHoverIdx] || 0).toLocaleString()} Bags`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. Timeframe Filter for Arrival: 1 Month, 3 Months, 6 Months, 1 Year */}
              <div className="pt-0.5">
                <div className="grid grid-cols-4 gap-1.5 border border-[#D5E2DD] rounded-xl p-1 bg-[#F9FBFA]">
                  {[
                    { id: "1M", labelEn: "1 Month", labelUr: "۱ مہینہ", r: "month" as const },
                    { id: "3M", labelEn: "3 Months", labelUr: "۳ مہینے", r: "quarter" as const },
                    { id: "6M", labelEn: "6 Months", labelUr: "۶ مہینے", r: "quarter" as const },
                    { id: "1Y", labelEn: "1 Year", labelUr: "۱ سال", r: "quarter" as const },
                  ].map((tf) => {
                    const isTfActive = stockTimeframe === tf.id;
                    return (
                      <button
                        key={tf.id}
                        onClick={() => {
                          setStockTimeframe(tf.id as any);
                          setRange(tf.r);
                        }}
                        className={`flex items-center justify-center py-2 px-1 rounded-lg transition-all font-bold ${isTfActive
                          ? "bg-[#D97706] text-white shadow-sm ring-1 ring-[#D97706]/30 scale-[1.01]"
                          : "bg-white/80 text-[#52635F] hover:bg-white hover:text-[#183B34] border border-[#E8EFEC]"
                          }`}
                        style={{
                          fontSize: lang === "ur" ? 13 : 11,
                          fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                        }}
                      >
                        <span>{lang === "ur" ? tf.labelUr : tf.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dedicated Scroll Buffer for Arrival View */}
              <div className="w-full h-36 flex-shrink-0" />
            </div>
          )}

          {/* <div
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#F1F7F4", border: "1px dashed #C7E8D8" }}
              >
                <div className="flex-1">
                  <p
                    className="font-bold text-sm"
                    style={{
                      fontSize: lang === "ur" ? 17 : 14,
                      fontFamily:
                        lang === "ur"
                          ? URDU_FONT
                          : "inherit",
                    }}
                  >
                    {lang === "ur"
                      ? "پرانا ریکارڈ درکار ہے؟"
                      : "Need older data?"}
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: "#52635F",
                      fontSize: lang === "ur" ? 13 : 12,
                      fontFamily:
                        lang === "ur"
                          ? URDU_FONT
                          : "inherit",
                    }}
                  >
                    {lang === "ur"
                      ? "ہماری ٹیم سے رابطہ کریں۔"
                      : "Ask our team for history beyond what's shown."}
                  </p>
                </div>
                {/* <button
                  onClick={() => setHistOpen(true)}
                  className="tap-target flex-shrink-0 rounded-xl px-3 py-2.5 font-bold text-xs text-white"
                  style={{
                    background: "#087F63",
                    fontSize: lang === "ur" ? 15 : 12,
                    fontFamily:
                      lang === "ur"
                        ? URDU_FONT
                        : "inherit",
                  }}
                >
                  {lang === "ur" ? "درخواست کریں ←" : "Request →"}
                </button>
              </div> */}
        </div>
      )}

      {msgModal && (
        <ZMMessageModal msg={msgModal} onClose={() => setMsgModal(null)} />
      )}
      {histOpen && (
        <HistoricalRequestSheet
          subject={title}
          onClose={() => setHistOpen(false)}
        />
      )}
      {locSheet && (
        <MultiLocSheet
          singleSelect={true}
          selected={
            locScope && locScope.kind !== "pakistan"
              ? [locScope]
              : []
          }
          dataMandiNames={dataMandiNameSet}
          onApply={(locs) => {
            if (locs.length === 0 || locs.some((x) => x.kind === "pakistan")) {
              setLocScope({ kind: "pakistan", label: "All Pakistan" });
              setTableProvinceFilter(null);
              setFocusedMandi(null);
              setLocSheet(false);
              return;
            }
            const picked = locs[0];
            setLocScope(picked);
            if (picked.kind === "province") {
              setTableProvinceFilter(picked.label);
              setFocusedMandi(null);
            } else if (picked.kind === "district" || picked.kind === "mandi") {
              const prov = getProvinceFromLoc(picked);
              setTableProvinceFilter(prov || null);
              setFocusedMandi({ kind: picked.kind, label: picked.label });
            } else {
              setTableProvinceFilter(null);
              setFocusedMandi(null);
            }
            setLocSheet(false);
          }}
          onClose={() => setLocSheet(false)}
        />
      )}
      {dateSheet && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 200 }}
          onClick={() => setDateSheet(false)}
        >
          <div
            className="zm-sheet"
            style={{ background: "#F4FAF7" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-5 pt-4 pb-3"
              style={{ borderBottom: "1px solid #D5E2DD" }}
            >
              <div
                className="w-10 h-1 rounded-full mx-auto mb-3"
                style={{ background: "#C7D6D0" }}
              />
              <p
                className="font-bold text-lg"
                style={{
                  fontSize: lang === "ur" ? 20 : 18,
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                }}
              >
                {lang === "ur" ? "تاریخ منتخب کریں" : "Select Date"}
              </p>
              <p
                className="text-xs"
                style={{
                  color: "#52635F",
                  fontSize: lang === "ur" ? 14 : 12,
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                }}
              >
                {lang === "ur"
                  ? "تاریخ کے مطابق موازنہ کریں"
                  : "Filter comparison by date or range"}
              </p>
            </div>
            <div className="p-4 flex flex-col gap-2 pb-8">
              {[
                {
                  id: "today" as const,
                  label: lang === "ur" ? "آج" : "Today",
                  dateLabel:
                    lang === "ur"
                      ? "۱۷ اگست ۲۰۲۶ · منگل"
                      : "14 Sep 2026 · Monday",
                  sub:
                    lang === "ur"
                      ? "تازہ ترین دستیاب نرخ"
                      : "Latest available rates",
                  icon: "",
                },
                {
                  id: "date" as const,
                  label: lang === "ur" ? "گزشتہ کل" : "Yesterday",
                  dateLabel:
                    lang === "ur"
                      ? "۱۶ اگست ۲۰۲۶ · پیر"
                      : "13 Sep 2026 · Sunday",
                  sub: lang === "ur" ? "پچھلے دن کے نرخ" : "Previous day rates",
                  icon: "",
                },
                {
                  id: "range" as const,
                  label: lang === "ur" ? "اس ہفتے" : "This Week",
                  dateLabel:
                    lang === "ur" ? "۰۸ تا ۱۴ ستمبر ۲۰۲۶" : "08 – 14 Sep 2026",
                  sub:
                    lang === "ur"
                      ? "متعدد دنوں کا موازنہ"
                      : "Compare across multiple days",
                  icon: "",
                },
              ].map(({ id, label, dateLabel, sub, icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setDateMode(id);
                    setDateSheet(false);
                  }}
                  className="tap-target rounded-2xl px-4 flex items-center gap-3"
                  style={{
                    background: dateMode === id ? "#E4F2EC" : "#F1F7F4",
                    border:
                      dateMode === id
                        ? "2px solid #087F63"
                        : "1px solid #D5E2DD",
                    minHeight: 56,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div
                    className={`flex-1 ${lang === "ur" ? "text-right" : "text-left"}`}
                  >
                    <p
                      className="font-bold text-sm"
                      style={{
                        color: dateMode === id ? "#075E4F" : "#183B34",
                        fontSize: lang === "ur" ? 17 : 14,
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "inherit",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-[11px] font-semibold"
                      style={{
                        color: dateMode === id ? "#087F63" : "#2F4A43",
                        fontSize: lang === "ur" ? 13 : 11,
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "inherit",
                      }}
                    >
                      {dateLabel}
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{
                        color: "#80918B",
                        fontSize: lang === "ur" ? 12 : 10,
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "inherit",
                      }}
                    >
                      {sub}
                    </p>
                  </div>
                  {dateMode === id && (
                    <span style={{ color: "#087F63", fontWeight: 800 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
