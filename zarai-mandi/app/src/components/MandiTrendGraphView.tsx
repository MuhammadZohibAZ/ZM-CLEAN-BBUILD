"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { ALL_RATE_TYPES, RATE_COLORS, RATE_TYPE_URDU, RATE_MULTS } from "../customer-face/shared/data/rates";
import { REAL_DATES_TIMELINE, getExcelTimeline } from "../data/realCommodityData";
import { CustomDateRangeModal } from "./CustomDateRangeModal";

export interface MandiTrendGraphViewProps {
  mandiName?: string;
  commodityName?: string;
  initialRateType?: string;
  allRows?: Array<{
    mandiName: string;
    mandiCity?: string;
    rateType: string;
    min: number;
    max: number;
    arrival?: string | number;
    date?: string;
  }>;
  availableRateTypes?: string[];
  lang?: "ur" | "en";
  urduFont?: string;
  onClose?: () => void;
  onExpandToLandscape?: () => void;
  isLandscape?: boolean;
  showExpandButton?: boolean;
  showCloseButton?: boolean;
}

function toUrduDigits(n: number | string): string {
  const urduDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/[0-9]/g, (w) => urduDigits[+w]);
}

export const MandiTrendGraphView: React.FC<MandiTrendGraphViewProps> = ({
  mandiName = "Mandi",
  commodityName = "Wheat",
  initialRateType = "Mandi Rate",
  allRows = [],
  availableRateTypes,
  lang = "en",
  urduFont = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', sans-serif",
  onClose,
  onExpandToLandscape,
  isLandscape = false,
  showExpandButton = true,
  showCloseButton = true,
}) => {
  const [trendMode, setTrendMode] = useState<"price" | "arrival">("price");
  const [stockTimeframe, setStockTimeframe] = useState<string>("1D");
  const [stockChartType, setStockChartType] = useState<"line" | "candle">("line");
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: "2026-08-15",
    end: "2026-09-14",
  });
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState<boolean>(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [arrivalHoverIdx, setArrivalHoverIdx] = useState<number | null>(null);

  // Dynamic container width for responsive landscape & portrait rendering
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        measure();
      });
      ro.observe(el);
    }

    window.addEventListener("resize", measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isLandscape]);

  const cleanMandi = (mandiName || "")
    .replace(/\s*(mandi|منڈی)$/i, "")
    .trim();

  // Determine comprehensive list of rate types with initialRateType first
  const orderedRateTypes = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const add = (rt: string) => {
      if (!rt || seen.has(rt)) return;
      seen.add(rt);
      list.push(rt);
    };

    if (initialRateType) add(initialRateType);
    if (availableRateTypes && availableRateTypes.length > 0) {
      availableRateTypes.forEach(add);
    }
    allRows.forEach((r) => {
      if (r.rateType) add(r.rateType);
    });
    ALL_RATE_TYPES.forEach(add);

    return list;
  }, [initialRateType, availableRateTypes, allRows]);

  const [focusedType, setFocusedType] = useState<string>(() => {
    return initialRateType || orderedRateTypes[0] || "Mandi Rate";
  });

  const [activeTypes, setActiveTypes] = useState<string[]>([focusedType]);

  // Keep focusedType and activeTypes in sync if initialRateType prop changes
  useEffect(() => {
    if (initialRateType) {
      setFocusedType(initialRateType);
      setActiveTypes([initialRateType]);
    }
  }, [initialRateType]);

  // Normalize station name for lookup
  const normStation = (s: string) =>
    (s || "")
      .toLowerCase()
      .replace(/\s*(mandi|منڈی)\b/gi, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const targetMandiNorm = normStation(mandiName);

  const parseArr = (a: string | number | undefined): number => {
    if (typeof a === "number") return a;
    if (!a) return 0;
    const m = String(a).trim().match(/^([0-9,]+)/);
    return m ? parseInt(m[1].replace(/,/g, ""), 10) || 0 : 0;
  };

  // Build raw multi-day data for each rate type for this mandi
  const mandiSeriesMap = useMemo(() => {
    const map: Record<string, { mins: number[]; maxs: number[]; prices: number[]; arrivals: number[] }> = {};

    const targetRows = allRows.filter((r) => {
      if (!targetMandiNorm) return true;
      const mName = normStation(r.mandiName);
      const mCity = normStation(r.mandiCity || "");
      return (
        mName === targetMandiNorm ||
        mCity === targetMandiNorm ||
        (mName.length > 3 && targetMandiNorm.includes(mName)) ||
        (targetMandiNorm.length > 3 && mName.includes(targetMandiNorm)) ||
        (mCity.length > 3 && targetMandiNorm.includes(mCity))
      );
    });

    const rowsToUse = targetRows.length > 0 ? targetRows : allRows;

    // Find the base row for this mandi (e.g. matching initialRateType or first valid row)
    const baseRow =
      rowsToUse.find((r) => r.rateType === initialRateType && (r.min > 0 || r.max > 0)) ||
      rowsToUse.find((r) => r.min > 0 || r.max > 0) ||
      rowsToUse[0];

    const baseRowMin = baseRow?.min && baseRow.min > 0 ? baseRow.min : 0;
    const baseRowMax = baseRow?.max && baseRow.max > 0 ? baseRow.max : baseRowMin;
    const baseRowPrice =
      baseRowMin > 0 && baseRowMax > 0
        ? Math.round((baseRowMin + baseRowMax) / 2)
        : baseRowMin || baseRowMax || 0;
    const baseRowRateType = baseRow?.rateType || "Mandi Rate";
    const baseRowArr = parseArr(baseRow?.arrival);

    for (const rt of orderedRateTypes) {
      const rtRows = rowsToUse.filter((r) => r.rateType === rt);
      const byDate = new Map<string, { mins: number[]; maxs: number[]; arrivals: number[] }>();

      for (const r of rtRows) {
        const d = (r.date || "").slice(0, 10);
        if (!d) continue;
        if (!byDate.has(d)) byDate.set(d, { mins: [], maxs: [], arrivals: [] });
        const b = byDate.get(d)!;
        if (r.min > 0) b.mins.push(r.min);
        if (r.max > 0) b.maxs.push(r.max);
        const a = parseArr(r.arrival);
        if (a > 0) b.arrivals.push(a);
      }

      // Check if this specific rate type has its own exact row in database
      const exactRow = rtRows.find((r) => r.min > 0 || r.max > 0) || rtRows[0];
      const hasExactRow = Boolean(exactRow && (exactRow.min > 0 || exactRow.max > 0));

      const baseMult = RATE_MULTS[baseRowRateType] || 1.0;
      const targetMult = RATE_MULTS[rt] || 1.0;
      const multFactor = hasExactRow ? 1.0 : targetMult / baseMult;

      const statedMin = hasExactRow
        ? (exactRow.min > 0 ? exactRow.min : 0)
        : (baseRowMin > 0 ? Math.round(baseRowMin * multFactor) : 0);

      const statedMax = hasExactRow
        ? (exactRow.max > 0 ? exactRow.max : statedMin)
        : (baseRowMax > 0 ? Math.round(baseRowMax * multFactor) : statedMin);

      const statedPrice =
        statedMin > 0 && statedMax > 0
          ? Math.round((statedMin + statedMax) / 2)
          : statedMin || statedMax || (baseRowPrice > 0 ? Math.round(baseRowPrice * multFactor) : 0);

      const statedArr = hasExactRow && parseArr(exactRow.arrival) > 0 ? parseArr(exactRow.arrival) : baseRowArr;

      // Get real historical timeline curve from realCommodityData
      const timeline = getExcelTimeline({
        product: commodityName,
        rateType: rt,
        locationKind: "mandi",
        locationLabel: mandiName,
        range: "year",
      });

      const baseLatestPrice = timeline.latestPrice || timeline.prices[timeline.prices.length - 1] || 4500;
      const priceRatio = statedPrice > 0 && baseLatestPrice > 0 ? statedPrice / baseLatestPrice : 1;
      const minRatio = statedMin > 0 && timeline.latestMin > 0 ? statedMin / timeline.latestMin : priceRatio;
      const maxRatio = statedMax > 0 && timeline.latestMax > 0 ? statedMax / timeline.latestMax : priceRatio;

      const baseLatestArr = timeline.arrivals[timeline.arrivals.length - 1] || 1;
      const arrRatio = statedArr > 0 && baseLatestArr > 0 ? statedArr / baseLatestArr : 1;

      const tMins = timeline.mins.slice(-REAL_DATES_TIMELINE.length);
      const tMaxs = timeline.maxs.slice(-REAL_DATES_TIMELINE.length);
      const tPrices = timeline.prices.slice(-REAL_DATES_TIMELINE.length);
      const tArrivals = timeline.arrivals.slice(-REAL_DATES_TIMELINE.length);

      const fullMins: number[] = [];
      const fullMaxs: number[] = [];
      const fullPrices: number[] = [];
      const fullArrivals: number[] = [];

      for (let i = 0; i < REAL_DATES_TIMELINE.length; i++) {
        const d = REAL_DATES_TIMELINE[i];
        const b = byDate.get(d);
        const isLatest = i === REAL_DATES_TIMELINE.length - 1;

        if (b && b.mins.length > 0) {
          fullMins.push(Math.round(b.mins.reduce((x, y) => x + y, 0) / b.mins.length));
        } else if (isLatest && statedMin > 0) {
          fullMins.push(statedMin);
        } else {
          fullMins.push(Math.round((tMins[i] || baseLatestPrice * 0.985) * minRatio));
        }

        if (b && b.maxs.length > 0) {
          fullMaxs.push(Math.round(b.maxs.reduce((x, y) => x + y, 0) / b.maxs.length));
        } else if (isLatest && statedMax > 0) {
          fullMaxs.push(statedMax);
        } else {
          fullMaxs.push(Math.round((tMaxs[i] || baseLatestPrice * 1.015) * maxRatio));
        }

        if (b && (b.mins.length > 0 || b.maxs.length > 0)) {
          const mn = fullMins[i];
          const mx = fullMaxs[i];
          fullPrices.push(Math.round((mn + mx) / 2));
        } else if (isLatest && statedPrice > 0) {
          fullPrices.push(statedPrice);
        } else {
          fullPrices.push(Math.round((tPrices[i] || baseLatestPrice) * priceRatio));
        }

        if (b && b.arrivals.length > 0) {
          fullArrivals.push(b.arrivals.reduce((x, y) => x + y, 0));
        } else if (isLatest && statedArr > 0) {
          fullArrivals.push(statedArr);
        } else {
          fullArrivals.push(Math.round((tArrivals[i] || 100) * arrRatio));
        }
      }

      map[rt] = {
        mins: fullMins,
        maxs: fullMaxs,
        prices: fullPrices,
        arrivals: fullArrivals,
      };
    }

    return map;
  }, [allRows, targetMandiNorm, commodityName, mandiName, orderedRateTypes, initialRateType]);

  // Timeframe configuration & labels (matching exact Trends tab config)
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
        })),
        priceFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i]),
        minFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 0.988),
        maxFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 1.012),
        arrivalFactor: (base: number, i: number) => Math.round(base * arrivalFactors[i]),
      };
    } else if (stockTimeframe === "3M") {
      const weeksEn = ["27 Jun", "4 Jul", "11 Jul", "18 Jul", "25 Jul", "1 Aug", "8 Aug", "15 Aug", "22 Aug", "29 Aug", "5 Sep", "14 Sep"];
      const weeksUr = ["۲۷ جون", "۴ جولائی", "۱۱ جولائی", "۱۸ جولائی", "۲۵ جولائی", "۱ اگست", "۸ اگست", "۱۵ اگست", "۲۲ اگست", "۲۹ اگست", "۵ ستمبر", "۱۴ ستمبر"];
      const seasonalFactors = [0.97, 0.975, 0.98, 0.985, 0.99, 0.992, 0.995, 0.998, 1.0, 1.002, 0.999, 1.0];
      const arrivalFactors = [0.85, 0.9, 0.92, 0.95, 0.98, 1.0, 1.02, 1.05, 1.0, 0.98, 0.95, 1.0];
      return {
        len: 12,
        labels: weeksEn.map((w, i) => ({
          tickLabel: i % 3 === 0 || i === 11 ? (lang === "ur" ? weeksUr[i] : w) : "",
          fullDate: lang === "ur" ? `${weeksUr[i]} ۲۰۲۶` : `${w} 2026`,
        })),
        priceFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i]),
        minFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 0.992),
        maxFactor: (base: number, i: number) => Math.round(base * seasonalFactors[i] * 1.008),
        arrivalFactor: (base: number, i: number) => Math.round(base * arrivalFactors[i]),
      };
    } else if (stockTimeframe === "1W" || stockTimeframe === "7d") {
      const sliceDates = REAL_DATES_TIMELINE.slice(-7);
      const enMonthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        len: 7,
        labels: sliceDates.map((dStr, i) => {
          const p = dStr.split("-");
          const day = parseInt(p[2], 10);
          const m = parseInt(p[1], 10) - 1;
          const tickLabel = `${day} ${enMonthsShort[m]}`;
          return { tickLabel, fullDate: `${day} ${enMonthsShort[m]} 2026` };
        }),
        priceFactor: null,
        minFactor: null,
        maxFactor: null,
        arrivalFactor: null,
      };
    } else {
      // 1D / 31-day default (Aug 15 to Sep 14)
      const sliceDates = REAL_DATES_TIMELINE.slice(-31);
      const enMonthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const urMonthsShort = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];

      return {
        len: sliceDates.length,
        labels: sliceDates.map((dStr, i) => {
          const p = dStr.split("-");
          const day = parseInt(p[2], 10);
          const m = parseInt(p[1], 10) - 1;
          const dayStr = lang === "ur" ? toUrduDigits(day) : String(day);
          const mName = lang === "ur" ? urMonthsShort[m] : enMonthsShort[m];

          let tickLabel = "";
          if (i === 0 || i === 7 || i === 14 || i === 21 || i === sliceDates.length - 1) {
            tickLabel = `${dayStr} ${mName}`;
          }
          const fullDate = `${day} ${enMonthsShort[m]} 2026`;
          return { tickLabel, fullDate };
        }),
        priceFactor: null,
        minFactor: null,
        maxFactor: null,
        arrivalFactor: null,
      };
    }
  }, [stockTimeframe, lang]);

  const len = tfConfig.len;
  const fullDateLabels = tfConfig.labels;

  // Build price series for active types
  const priceSeries = useMemo(() => {
    const typesToBuild = compareMode ? activeTypes : [focusedType];
    return typesToBuild.map((rt) => {
      const raw = mandiSeriesMap[rt] || mandiSeriesMap["Mandi Rate"] || { mins: [], maxs: [], prices: [], arrivals: [] };
      const baseLatestPrice = raw.prices[raw.prices.length - 1] || 4540;

      let prices: number[] = [];
      let mins: number[] = [];
      let maxs: number[] = [];

      if (tfConfig.priceFactor) {
        prices = Array.from({ length: tfConfig.len }, (_, i) => tfConfig.priceFactor!(baseLatestPrice, i));
        mins = Array.from({ length: tfConfig.len }, (_, i) => tfConfig.minFactor!(baseLatestPrice, i));
        maxs = Array.from({ length: tfConfig.len }, (_, i) => tfConfig.maxFactor!(baseLatestPrice, i));
      } else if (stockTimeframe === "1W" || stockTimeframe === "7d") {
        prices = raw.prices.slice(-7);
        mins = raw.mins.slice(-7);
        maxs = raw.maxs.slice(-7);
      } else {
        prices = raw.prices.slice(-tfConfig.len);
        mins = raw.mins.slice(-tfConfig.len);
        maxs = raw.maxs.slice(-tfConfig.len);
      }

      // Ensure non-zero
      prices = prices.map((p) => (p > 0 ? p : baseLatestPrice));
      mins = mins.map((m, i) => (m > 0 ? m : Math.round(prices[i] * 0.985)));
      maxs = maxs.map((m, i) => (m > 0 ? m : Math.round(prices[i] * 1.015)));

      return {
        label: rt,
        color: RATE_COLORS[rt] || "#087F63",
        data: prices,
        mins,
        maxs,
      };
    });
  }, [mandiSeriesMap, compareMode, activeTypes, focusedType, tfConfig, stockTimeframe]);

  // Aggregate arrival data
  const arrivalData = useMemo(() => {
    const rawArrivals = REAL_DATES_TIMELINE.map((_, i) => {
      const primaryArr = mandiSeriesMap[focusedType]?.arrivals[i];
      if (typeof primaryArr === "number" && primaryArr > 0) return primaryArr;
      for (const rt of ALL_RATE_TYPES) {
        const a = mandiSeriesMap[rt]?.arrivals[i];
        if (typeof a === "number" && a > 0) return a;
      }
      return 0;
    });

    const baseArrivals = rawArrivals.slice(-31);
    const avgArr = Math.round(baseArrivals.reduce((a, b) => a + b, 0) / Math.max(baseArrivals.length, 1)) || 54000;

    if (tfConfig.arrivalFactor) {
      return Array.from({ length: tfConfig.len }, (_, i) => tfConfig.arrivalFactor!(avgArr, i));
    } else if (stockTimeframe === "1W" || stockTimeframe === "7d") {
      const sliced = rawArrivals.slice(-7);
      return sliced.map((v) => (v > 0 ? v : Math.round(avgArr * 0.9)));
    }
    return baseArrivals.map((v) => (v > 0 ? v : Math.round(avgArr * (0.85 + ((v * 7) % 30) / 100))));
  }, [mandiSeriesMap, focusedType, tfConfig, stockTimeframe]);

  // Dimensions - dynamically calculated from container width
  const CW = Math.max(340, containerWidth);
  const isWide = isLandscape || containerWidth >= 560;
  const CH = isWide ? 260 : 310;
  const PL = 10;
  const PR = 56;
  const PT = 14;
  const PB = 28;
  const chartW = CW - PL - PR;
  const volBaseY = CH - PB;
  const volMaxH = isWide ? 20 : 24;
  const separatorY = compareMode ? volBaseY : volBaseY - volMaxH - 8;
  const lineChartH = separatorY - PT;

  // Price Bounds
  const allPriceVals = priceSeries.flatMap((s) => s.data);
  const allMinVals = priceSeries.flatMap((s) => s.mins);
  const allMaxVals = priceSeries.flatMap((s) => s.maxs);
  const rawPMin = Math.min(...allPriceVals, ...allMinVals, 4400);
  const rawPMax = Math.max(...allPriceVals, ...allMaxVals, 4700);
  const pSpread = Math.max(rawPMax - rawPMin, 30);
  const pPadding = Math.max(pSpread * 0.08, 15);
  const pMin = Math.max(0, Math.floor((rawPMin - pPadding) / 10) * 10);
  const pMax = Math.ceil((rawPMax + pPadding) / 10) * 10;

  // Arrival Bounds
  const rawAMin = 0;
  const rawAMax = Math.max(...arrivalData, 100000);
  const aMax = Math.ceil((rawAMax * 1.15) / 1000) * 1000 || 160000;
  const aMin = 0;
  const arrSeparatorY = volBaseY - volMaxH - 8;
  const arrChartH = arrSeparatorY - PT;

  const yOf = (v: number, min: number = pMin, max: number = pMax) =>
    PT + lineChartH - ((v - min) / (max - min || 1)) * lineChartH;

  const yOfArr = (v: number) =>
    PT + arrChartH - ((v - aMin) / (aMax - aMin || 1)) * arrChartH;

  const xOf = (i: number, count: number = len) =>
    PL + (i / (count - 1 || 1)) * chartW;

  const yPriceTicks = useMemo(() => {
    const step = (pMax - pMin) / 4;
    return [pMin, pMin + step, pMin + step * 2, pMin + step * 3, pMax].map((v) => Math.round(v));
  }, [pMin, pMax]);

  const yArrivalTicks = useMemo(() => {
    const step = (aMax - aMin) / 4;
    return [aMin, aMin + step, aMin + step * 2, aMin + step * 3, aMax].map((v) => Math.round(v));
  }, [aMin, aMax]);

  const activeMainSeries = priceSeries.find((s) => s.label === focusedType) || priceSeries[0];
  const currentPriceIdx = hoverIdx !== null && hoverIdx < len ? hoverIdx : len - 1;
  const currentArrIdx = arrivalHoverIdx !== null && arrivalHoverIdx < len ? arrivalHoverIdx : len - 1;

  const displayPrice = activeMainSeries?.data[currentPriceIdx] || 0;
  const startPrice = activeMainSeries?.data[0] || displayPrice || 1;
  const priceChangeAmt = displayPrice - startPrice;
  const absPct = Math.abs((priceChangeAmt / (startPrice || 1)) * 100).toFixed(2);
  const isPositive = priceChangeAmt > 0;
  const isFlat = priceChangeAmt === 0;

  const curPointMax = hoverIdx !== null && activeMainSeries?.maxs?.[hoverIdx] ? activeMainSeries.maxs[hoverIdx] : null;
  const curPointMin = hoverIdx !== null && activeMainSeries?.mins?.[hoverIdx] ? activeMainSeries.mins[hoverIdx] : null;

  const seriesMax = curPointMax !== null
    ? curPointMax
    : (activeMainSeries ? Math.max(...activeMainSeries.maxs, ...activeMainSeries.data) : displayPrice);

  const seriesMin = curPointMin !== null
    ? curPointMin
    : (activeMainSeries ? Math.min(...activeMainSeries.mins, ...activeMainSeries.data) : displayPrice);

  const seriesAvg = seriesMax > 0 && seriesMin > 0
    ? Math.round((seriesMax + seriesMin) / 2)
    : (activeMainSeries && activeMainSeries.data.length > 0
        ? Math.round(activeMainSeries.data.reduce((a, b) => a + b, 0) / activeMainSeries.data.length)
        : displayPrice);

  const totalArrival = arrivalData.reduce((a, b) => a + b, 0);
  const peakArrival = Math.max(...arrivalData, 0);
  const avgArrival = Math.round(totalArrival / (len || 1));

  const currentCloseY = yOf(displayPrice, pMin, pMax);
  const maxArr = Math.max(...arrivalData, 1);

  // Clean date formatting matching user screenshot: "14 September 2026"
  const getCleanDate = (idx: number) => {
    const raw = fullDateLabels[idx]?.fullDate || "14 Sep 2026";
    let clean = raw.replace(/\s*\([^)]*\)/g, "").trim();
    if (lang !== "ur") {
      clean = clean
        .replace(/\bJan\b/g, "January")
        .replace(/\bFeb\b/g, "February")
        .replace(/\bMar\b/g, "March")
        .replace(/\bApr\b/g, "April")
        .replace(/\bMay\b/g, "May")
        .replace(/\bJun\b/g, "June")
        .replace(/\bJul\b/g, "July")
        .replace(/\bAug\b/g, "August")
        .replace(/\bSep\b/g, "September")
        .replace(/\bOct\b/g, "October")
        .replace(/\bNov\b/g, "November")
        .replace(/\bDec\b/g, "December");
    }
    return clean;
  };

  return (
    <>
      <CustomDateRangeModal
        isOpen={isCustomPickerOpen}
        onClose={() => setIsCustomPickerOpen(false)}
        lang={lang}
        currentRange={customRange}
        onApply={(newRange) => {
          setCustomRange(newRange);
          setStockTimeframe("CUSTOM");
        }}
      />

      <div
        ref={containerRef}
        className="w-full rounded-2xl flex flex-col gap-2.5 p-3 sm:p-4 bg-white select-none transition-all"
        style={{
          border: "1px solid #D5E2DD",
          boxShadow: "0 2px 12px rgba(8, 127, 99, 0.06)",
        }}
      >
        {/* Top Control Bar: Price vs Arrival Pill + Action Buttons */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E8EFEC]">
          <div className="flex items-center bg-[#E5EFEA] p-0.5 rounded-xl border border-[#CCE2D7]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTrendMode("price");
              }}
              className="tap-target px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition active:scale-95"
              style={{
                background: trendMode === "price" ? "#087F63" : "transparent",
                color: trendMode === "price" ? "#FFFFFF" : "#4E665E",
                fontFamily: lang === "ur" ? urduFont : "inherit",
              }}
            >
              {lang === "ur" ? "قیمت کا رجحان" : "Price Trend"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTrendMode("arrival");
              }}
              className="tap-target px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition active:scale-95"
              style={{
                background: trendMode === "arrival" ? "#D97706" : "transparent",
                color: trendMode === "arrival" ? "#FFFFFF" : "#4E665E",
                fontFamily: lang === "ur" ? urduFont : "inherit",
              }}
            >
              {lang === "ur" ? "آمد کا رجحان" : "Arrival Trend"}
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {showExpandButton && !isLandscape && onExpandToLandscape && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpandToLandscape();
                }}
                className="tap-target px-2.5 py-1 rounded-full bg-[#E5EFEA] hover:bg-[#D5E5DE] text-[#064D40] text-[11px] font-bold flex items-center gap-1 transition active:scale-95 border border-[#10B981]/40"
                title={lang === "ur" ? "پوری اسکرین پر دیکھیں (افقی)" : "Expand to Landscape"}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#064D40" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span>{lang === "ur" ? "بڑا کریں" : "Expand"}</span>
              </button>
            )}

            {showCloseButton && onClose && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="tap-target w-7 h-7 rounded-full bg-[#E5EFEA] hover:bg-[#D5E5DE] text-[#064D40] text-xs font-bold flex items-center justify-center transition active:scale-95 flex-shrink-0"
                title={lang === "ur" ? "بند کریں" : "Close"}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Rate Types Horizontal Scroller (Exact visual match with Trends tab) */}
        {trendMode === "price" && (
          <div className="flex flex-col gap-1.5 pb-2 border-b border-[#E8EFEC]">
            <div className="flex items-center justify-between px-0.5">
              <span
                className="text-[11px] font-bold text-[#52635F]"
                style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
              >
                {lang === "ur" ? "نرخ منتخب کریں (ریٹ تبدیل کریں)" : "Select Rate Type"}
              </span>
              {compareMode && (
                <span className="text-[10px] font-semibold text-[#087F63] bg-[#E8F8F4] px-2 py-0.5 rounded-full border border-[#C2E8DB]">
                  {activeTypes.length} {lang === "ur" ? "اقسام فعال ہیں" : "Active Types"}
                </span>
              )}
            </div>

            {/* Horizontal Scroll Chips (Single Line) */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto py-0.5 scroll-smooth w-full flex-nowrap"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                direction: "ltr",
              }}
            >
              {orderedRateTypes.map((tRt) => {
                const isFocused = focusedType === tRt;
                const isCompared = activeTypes.includes(tRt);
                const isSelected = compareMode ? isCompared : isFocused;
                const chipColor = RATE_COLORS[tRt] || "#0E645C";

                // Extract RGB for refined soft tint background
                const cleanHex = chipColor.replace("#", "");
                const r = parseInt(cleanHex.substring(0, 2), 16) || 14;
                const g = parseInt(cleanHex.substring(2, 4), 16) || 100;
                const b = parseInt(cleanHex.substring(4, 6), 16) || 92;
                const softBg = `rgba(${r}, ${g}, ${b}, 0.10)`;

                const cleanLabel = (RATE_TYPE_URDU[tRt] && lang === "ur" ? RATE_TYPE_URDU[tRt] : tRt)
                  .replace(" ریٹ", "")
                  .replace(" Rate", "");

                return (
                  <button
                    key={tRt}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (compareMode) {
                        setActiveTypes((prev) => {
                          if (prev.includes(tRt)) {
                            if (prev.length > 1) {
                              const remaining = prev.filter((x) => x !== tRt);
                              if (focusedType === tRt) setFocusedType(remaining[0]);
                              return remaining;
                            }
                            return prev;
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
                    className={`tap-target flex items-center gap-1.5 rounded-full font-bold transition-all duration-200 ease-out active:scale-95 flex-shrink-0 whitespace-nowrap focus:outline-none focus:ring-0 ${
                      isSelected ? "shadow-xs" : "hover:border-[#94A3B8]"
                    }`}
                    style={{
                      fontSize: lang === "ur" ? 13 : 11.5,
                      padding: isSelected ? "5.5px 12px" : "5.5px 11px",
                      background: isSelected ? softBg : "#FFFFFF",
                      border: `1.5px solid ${isSelected ? chipColor : "#E2E8F0"}`,
                      color: isSelected ? chipColor : "#475569",
                      boxShadow: isSelected
                        ? `0 0 0 1.5px rgba(${r}, ${g}, ${b}, 0.22), 0 2px 6px rgba(${r}, ${g}, ${b}, 0.15)`
                        : "0 1px 2px rgba(0,0,0,0.04)",
                      fontFamily: lang === "ur" ? urduFont : "inherit",
                    }}
                  >
                    {/* Animated Live Beacon / Dot */}
                    <span className="relative flex items-center justify-center flex-shrink-0" style={{ width: 8, height: 8 }}>
                      {isSelected && (
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                          style={{ backgroundColor: chipColor }}
                        />
                      )}
                      <span
                        className="relative inline-flex rounded-full"
                        style={{
                          width: 6,
                          height: 6,
                          background: chipColor,
                        }}
                      />
                    </span>

                    <span>{cleanLabel}</span>

                    {compareMode && isSelected && (
                      <span
                        className="flex items-center justify-center text-[9px] w-3.5 h-3.5 rounded-full font-extrabold leading-none animate-in zoom-in-50 duration-150"
                        style={{
                          background: chipColor,
                          color: "#FFFFFF",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}

              {/* All Button in Compare Mode */}
              {compareMode && (() => {
                const isAllSelected = activeTypes.length === orderedRateTypes.length;
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAllSelected) {
                        const single = focusedType && focusedType !== "All" ? focusedType : orderedRateTypes[0];
                        setFocusedType(single);
                        setActiveTypes([single]);
                      } else {
                        setActiveTypes([...orderedRateTypes]);
                      }
                    }}
                    className={`tap-target flex items-center gap-1.5 rounded-full font-bold transition-all duration-200 ease-out active:scale-95 flex-shrink-0 whitespace-nowrap focus:outline-none focus:ring-0 ${
                      isAllSelected ? "shadow-xs" : "hover:border-[#94A3B8]"
                    }`}
                    style={{
                      fontSize: lang === "ur" ? 13 : 11.5,
                      padding: isAllSelected ? "5.5px 12px" : "5.5px 11px",
                      background: isAllSelected ? "rgba(14, 100, 92, 0.10)" : "#FFFFFF",
                      border: `1.5px solid ${isAllSelected ? "#0E645C" : "#E2E8F0"}`,
                      color: isAllSelected ? "#0E645C" : "#475569",
                      boxShadow: isAllSelected
                        ? "0 0 0 1.5px rgba(14,100,92,0.22), 0 2px 6px rgba(14,100,92,0.15)"
                        : "0 1px 2px rgba(0,0,0,0.04)",
                      fontFamily: lang === "ur" ? urduFont : "inherit",
                    }}
                  >
                    <span className="relative flex items-center justify-center flex-shrink-0" style={{ width: 8, height: 8 }}>
                      {isAllSelected && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-[#0E645C]" />
                      )}
                      <span
                        className="relative inline-flex rounded-full"
                        style={{
                          width: 6,
                          height: 6,
                          background: "#0E645C",
                        }}
                      />
                    </span>
                    <span>{lang === "ur" ? "سب (All)" : "All"}</span>
                    {isAllSelected && (
                      <span
                        className="flex items-center justify-center text-[9px] w-3.5 h-3.5 rounded-full font-extrabold leading-none animate-in zoom-in-50 duration-150"
                        style={{
                          background: "#0E645C",
                          color: "#FFFFFF",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        )}

        {/* 1. Timeframe Row & Candlestick/Compare Controls (Exact Image 1, 2, 3) */}
        <div className="relative flex items-center justify-between gap-1.5 w-full pb-2 border-b border-[#E8EFEC]">
          <div className="flex items-center gap-1 flex-1">
            {[
              { id: "15m", labelEn: "15m", labelUr: "۱۵ منٹ" },
              { id: "1h", labelEn: "1h", labelUr: "۱ گھنٹہ" },
              { id: "4h", labelEn: "4h", labelUr: "۴ گھنٹے" },
              { id: "1D", labelEn: "1D", labelUr: "۱ دن" },
            ].map((tf) => {
              const isTfActive = stockTimeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStockTimeframe(tf.id);
                    setIsMoreOpen(false);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 text-center ${
                    isTfActive
                      ? trendMode === "price"
                        ? "bg-[#087F63] text-white shadow-xs font-black border border-[#087F63]"
                        : "bg-[#D97706] text-white shadow-xs font-black border border-[#D97706]"
                      : "bg-[#F4FAF7] text-[#2F4A43] border border-[#D5E2DD] hover:bg-[#E8F2ED]"
                  }`}
                  style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
                >
                  {lang === "ur" ? tf.labelUr : tf.labelEn}
                </button>
              );
            })}

            {/* More Dropdown */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMoreOpen(!isMoreOpen);
                }}
                className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1 ${
                  ["1W", "1M", "3M", "6M", "1Y", "CUSTOM"].includes(stockTimeframe)
                    ? trendMode === "price"
                      ? "bg-[#087F63] text-white shadow-xs font-black border border-[#087F63]"
                      : "bg-[#D97706] text-white shadow-xs font-black border border-[#D97706]"
                    : "bg-[#F4FAF7] text-[#2F4A43] border border-[#D5E2DD] hover:bg-[#E8F2ED]"
                }`}
                style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
              >
                <span className="truncate">
                  {["1W", "1M", "3M", "6M", "1Y"].includes(stockTimeframe)
                    ? stockTimeframe
                    : stockTimeframe === "CUSTOM"
                    ? lang === "ur"
                      ? "مخصوص"
                      : "Custom"
                    : lang === "ur"
                    ? "مزید"
                    : "More"}
                </span>
                <span className="text-[9px] opacity-75">▾</span>
              </button>

              {isMoreOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMoreOpen(false);
                    }}
                  />
                  <div
                    className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-2xl border border-[#D5E2DD] py-1 z-50 animate-fadeIn"
                    style={{ boxShadow: "0 10px 25px -3px rgba(0,0,0,0.18)" }}
                  >
                    {[
                      { id: "1W", labelEn: "1 Week", labelUr: "۱ ہفتہ" },
                      { id: "1M", labelEn: "1 Month", labelUr: "۱ ماہ" },
                      { id: "3M", labelEn: "3 Months", labelUr: "۳ ماہ" },
                      { id: "6M", labelEn: "6 Months", labelUr: "۶ ماہ" },
                      { id: "1Y", labelEn: "1 Year", labelUr: "۱ سال" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStockTimeframe(opt.id);
                          setIsMoreOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-bold transition flex items-center justify-between ${
                          stockTimeframe === opt.id
                            ? trendMode === "price"
                              ? "bg-[#E8F8F4] text-[#087F63]"
                              : "bg-[#FFFBEB] text-[#D97706]"
                            : "text-[#334155] hover:bg-[#F8FAF9]"
                        }`}
                        style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
                      >
                        <span>{lang === "ur" ? opt.labelUr : opt.labelEn}</span>
                        {stockTimeframe === opt.id && (
                          <span className={trendMode === "price" ? "text-[#087F63] text-[10px]" : "text-[#D97706] text-[10px]"}>
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-[#EEF3F0] my-1" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMoreOpen(false);
                        setIsCustomPickerOpen(true);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-bold transition flex items-center justify-between text-[#087F63] hover:bg-[#F8FAF9]"
                      style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
                    >
                      <span>{lang === "ur" ? "مخصوص مدت" : "Custom Range"}</span>
                      <span>📅</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Candle & Compare Toggle Buttons (shown in price mode) */}
          {trendMode === "price" && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Candlestick Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStockChartType((prev) => (prev === "candle" ? "line" : "candle"));
                }}
                title={lang === "ur" ? "کینڈلز" : "Candles"}
                className={`tap-target flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs whitespace-nowrap ${
                  stockChartType === "candle"
                    ? "bg-[#064E3B] text-white border border-[#064E3B] font-black"
                    : "bg-[#F4FAF7] text-[#143B33] border border-[#D5E2DD] hover:bg-[#E8F2ED]"
                }`}
                style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <line x1="7" y1="2" x2="7" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <rect x="4.5" y="6" width="5" height="10" rx="1" />
                  <line x1="17" y1="4" x2="17" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <rect x="14.5" y="8" width="5" height="7" rx="1" />
                </svg>
                <span className="hidden sm:inline">{lang === "ur" ? "کینڈلز" : "Candles"}</span>
              </button>

              {/* Compare Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCompareMode((prev) => !prev);
                }}
                className={`tap-target flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs whitespace-nowrap ${
                  compareMode
                    ? "bg-[#087F63] text-white border border-[#087F63] font-black"
                    : "bg-[#F4FAF7] text-[#143B33] border border-[#D5E2DD] hover:bg-[#E8F2ED]"
                }`}
                style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
              >
                <span>+ {compareMode ? (lang === "ur" ? "اکیلا" : "Single") : (lang === "ur" ? "موازنہ" : "Compare")}</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Commodity Header HUD & Stat Cards (Exact Images 1, 2, 3) */}
        {trendMode === "price" ? (
          <div className="flex flex-col gap-2.5 border-b border-[#E8EFEC] pb-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-base sm:text-lg font-black text-[#143B33] tracking-tight"
                  style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
                >
                  {commodityName}
                </span>

                {/* Mandi Tag Badge */}
                <span className="text-[10px] font-bold text-[#087F63] bg-[#E8F8F4] px-2.5 py-0.5 rounded-full border border-[#C2E8DB]">
                  {RATE_TYPE_URDU[focusedType] && lang === "ur" ? RATE_TYPE_URDU[focusedType] : focusedType.replace(" Rate", "")}
                </span>

                {/* Formatted Date */}
                <span className="text-xs font-semibold text-[#52635F]">
                  {getCleanDate(currentPriceIdx)}
                </span>
              </div>

              {/* Trend % Badge */}
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 flex-shrink-0"
                style={{
                  background: isFlat ? "#F3F4F6" : isPositive ? "#DCFCE7" : "#FEE2E2",
                  color: isFlat ? "#4B5563" : isPositive ? "#15803D" : "#B91C1C",
                  border: `1px solid ${isFlat ? "#E5E7EB" : isPositive ? "#86EFAC" : "#FECACA"}`,
                }}
              >
                <span>{isFlat ? "—" : isPositive ? "▲" : "▼"}</span>
                <span>{absPct}%</span>
              </span>
            </div>

            {/* 3 Metric Cards: Period High, Period Low, Period Avg */}
            <div className="grid grid-cols-3 gap-2 pt-0.5 text-[10px]">
              <div className="bg-[#F8FBFA] p-2 rounded-xl border border-[#E8EFEC] flex flex-col">
                <div className="flex items-center justify-between text-[#80918B] font-semibold text-[10px]">
                  <span>{lang === "ur" ? "زیادہ سے زیادہ" : "Period High"}</span>
                  <span className="font-bold text-[9px] text-[#64748B]">/40Kg</span>
                </div>
                <span className="font-bold text-[#143B33] text-xs sm:text-sm mt-0.5">
                  {lang === "ur" ? `روپے ${toUrduDigits(seriesMax.toLocaleString())}` : `Rs. ${seriesMax.toLocaleString()}`}
                </span>
              </div>

              <div className="bg-[#F8FBFA] p-2 rounded-xl border border-[#E8EFEC] flex flex-col">
                <div className="flex items-center justify-between text-[#80918B] font-semibold text-[10px]">
                  <span>{lang === "ur" ? "کم سے کم" : "Period Low"}</span>
                  <span className="font-bold text-[9px] text-[#64748B]">/40Kg</span>
                </div>
                <span className="font-bold text-[#143B33] text-xs sm:text-sm mt-0.5">
                  {lang === "ur" ? `روپے ${toUrduDigits(seriesMin.toLocaleString())}` : `Rs. ${seriesMin.toLocaleString()}`}
                </span>
              </div>

              <div className="bg-[#F8FBFA] p-2 rounded-xl border border-[#E8EFEC] flex flex-col">
                <div className="flex items-center justify-between text-[#80918B] font-semibold text-[10px]">
                  <span>{lang === "ur" ? "اوسط ریٹ" : "Period Avg"}</span>
                  <span className="font-bold text-[9px] text-[#64748B]">/40Kg</span>
                </div>
                <span className="font-bold text-[#087F63] text-xs sm:text-sm mt-0.5">
                  {lang === "ur" ? `روپے ${toUrduDigits(seriesAvg.toLocaleString())}` : `Rs. ${seriesAvg.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 border-b border-[#E8EFEC] pb-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-base sm:text-lg font-black text-[#143B33] tracking-tight"
                  style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
                >
                  {commodityName}
                </span>

                {/* Arrival Volume Badge */}
                <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                  {lang === "ur" ? "آمد کی مقدار" : "Arrival Volume"}
                </span>

                {/* Date */}
                <span className="text-xs font-semibold text-[#52635F]">
                  {getCleanDate(currentArrIdx)}
                </span>
              </div>

              {/* Bags Unit Badge */}
              <span className="text-[10px] font-bold text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-md border border-[#FDE68A] flex-shrink-0">
                {lang === "ur" ? "تھیلے (Bags)" : "Bags"}
              </span>
            </div>

            {/* 3 Metric Cards: Total Period, Peak Day, Daily Avg */}
            <div className="grid grid-cols-3 gap-2 pt-0.5 text-[10px]">
              <div className="bg-[#F8FBFA] p-2 rounded-xl border border-[#E8EFEC] flex flex-col">
                <span className="text-[#80918B] font-semibold text-[10px]">
                  {lang === "ur" ? "کل آمد" : "Total Period"}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-bold text-[#143B33] text-xs sm:text-sm">
                    {lang === "ur" ? toUrduDigits(totalArrival.toLocaleString()) : totalArrival.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-[#64748B]">
                    {lang === "ur" ? "تھیلے" : "Bags"}
                  </span>
                </div>
              </div>

              <div className="bg-[#F8FBFA] p-2 rounded-xl border border-[#E8EFEC] flex flex-col">
                <span className="text-[#80918B] font-semibold text-[10px]">
                  {lang === "ur" ? "سب سے زیادہ" : "Peak Day"}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-bold text-[#143B33] text-xs sm:text-sm">
                    {lang === "ur" ? toUrduDigits(peakArrival.toLocaleString()) : peakArrival.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-[#64748B]">
                    {lang === "ur" ? "تھیلے" : "Bags"}
                  </span>
                </div>
              </div>

              <div className="bg-[#F8FBFA] p-2 rounded-xl border border-[#E8EFEC] flex flex-col">
                <span className="text-[#80918B] font-semibold text-[10px]">
                  {lang === "ur" ? "روزانہ اوسط" : "Daily Avg"}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-bold text-[#D97706] text-xs sm:text-sm">
                    {lang === "ur" ? toUrduDigits(avgArrival.toLocaleString()) : avgArrival.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-[#64748B]">
                    {lang === "ur" ? "تھیلے" : "Bags"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SVG Chart Canvas (Exact Image 1, 2, 3) */}
        {trendMode === "price" ? (
          <div className="relative w-full select-none bg-[#FCFDFD] rounded-xl border border-[#EDF4F1] p-1">
            <svg
              viewBox={`0 0 ${CW} ${CH}`}
              className="w-full select-none"
              style={{ height: CH, width: "100%", display: "block", touchAction: "none" }}
              onMouseDown={(e) => {
                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                const i = Math.round((relX / chartW) * (len - 1));
                setHoverIdx(Math.max(0, Math.min(len - 1, i)));
              }}
              onMouseMove={(e) => {
                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                const i = Math.round((relX / chartW) * (len - 1));
                setHoverIdx(Math.max(0, Math.min(len - 1, i)));
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
                {priceSeries.map((s) => (
                  <linearGradient
                    key={`mandiTrendGrad-${s.label}`}
                    id={`mandiTrendGrad-${s.label.replace(/\s+/g, "_")}`}
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

              {/* Horizontal Gridlines + Right Price Axis Labels */}
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
                      x={CW - PR + 6}
                      y={y + 3.5}
                      textAnchor="start"
                      fontSize="10"
                      fontWeight="700"
                      fill="#475569"
                    >
                      {tick.toLocaleString()}
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
                    x={CW - PR + 6}
                    y={separatorY + 3.5}
                    textAnchor="start"
                    fontSize="9"
                    fontWeight="800"
                    fill="#64748B"
                  >
                    0
                  </text>
                </>
              )}

              {/* X-Axis Date Labels at Bottom */}
              {fullDateLabels.map((item, i) => {
                if (!item.tickLabel) return null;
                return (
                  <text
                    key={`xTick-${i}`}
                    x={xOf(i, len)}
                    y={CH - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#475569"
                    fontFamily={lang === "ur" ? urduFont : "inherit"}
                  >
                    {item.tickLabel}
                  </text>
                );
              })}

              {/* Volume Bars at Bottom (Green / Red) */}
              {!compareMode &&
                (() => {
                  const s = activeMainSeries;
                  if (!s) return null;
                  return s.data.map((close, i) => {
                    const prevClose = i > 0 ? (s.data[i - 1] || close) : close;
                    const isUp = close >= prevClose;
                    const arrVal = arrivalData[i] || 1000;
                    const barH = Math.max(2, (arrVal / maxArr) * volMaxH);
                    const barW = Math.max(2.5, Math.min(6, (chartW / len) * 0.55));
                    const isHov = hoverIdx === i;

                    return (
                      <rect
                        key={`vol-${i}`}
                        x={xOf(i, len) - barW / 2}
                        y={volBaseY - barH}
                        width={barW}
                        height={barH}
                        rx={1.5}
                        fill={isUp ? "#10B981" : "#EF4444"}
                        opacity={hoverIdx === null ? 0.75 : isHov ? 1.0 : 0.35}
                      />
                    );
                  });
                })()}

              {/* Chart Content: Candlestick or Line Mode */}
              {compareMode ? (
                // Compare Mode: multiple colored lines
                priceSeries.map((s) => {
                  const pts = s.data
                    .map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i, len).toFixed(1)},${yOf(v, pMin, pMax).toFixed(1)}`)
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
              ) : stockChartType === "candle" ? (
                // Realistic Candlestick (OHLC) Chart Rendering (Exact Image 1)
                (() => {
                  const s = activeMainSeries;
                  if (!s) return null;

                  // 5-point Simple Moving Average (SMA)
                  const maPeriod = Math.min(5, Math.max(2, Math.floor(len / 4)));
                  const maValues = s.data.map((_, idx) => {
                    const start = Math.max(0, idx - maPeriod + 1);
                    const subset = s.data.slice(start, idx + 1);
                    return Math.round(subset.reduce((a, b) => a + b, 0) / subset.length);
                  });
                  const maPath = maValues
                    .map((v, idx) => `${idx === 0 ? "M" : "L"}${xOf(idx, len).toFixed(1)},${yOf(v, pMin, pMax).toFixed(1)}`)
                    .join(" ");

                  const candleWidth = Math.max(3, Math.min(9, (chartW / len) * 0.72));

                  // Find absolute minimum price candle for marker callout (e.g. 4,445.67)
                  let minLow = Infinity;
                  let minIdx = -1;
                  s.data.forEach((close, i) => {
                    const low = s.mins?.[i] || close;
                    if (low < minLow && low > 0) {
                      minLow = low;
                      minIdx = i;
                    }
                  });

                  return (
                    <g key={`candles-${s.label}`}>
                      {/* 1. Candlesticks with Real Wicks & Bodies */}
                      {s.data.map((close, i) => {
                        const prevClose = i > 0 ? (s.data[i - 1] || close) : close;
                        const rawOpen = i > 0 ? prevClose : (s.mins?.[0] ? Math.round(s.mins[0] + (s.maxs[0] - s.mins[0]) * 0.45) : close);
                        const open = rawOpen > 0 ? rawOpen : close;
                        const rawHigh = s.maxs?.[i] || Math.max(open, close);
                        const rawLow = s.mins?.[i] || Math.min(open, close);
                        const high = Math.max(rawHigh, open, close);
                        const low = Math.min(rawLow, open, close);

                        const isBullish = close >= open;
                        const candleColor = isBullish ? "#10B981" : "#EF4444";
                        const candleStroke = isBullish ? "#059669" : "#DC2626";

                        const cx = xOf(i, len);
                        const yHigh = yOf(high, pMin, pMax);
                        const yLow = yOf(low, pMin, pMax);
                        const yOpen = yOf(open, pMin, pMax);
                        const yClose = yOf(close, pMin, pMax);

                        const bodyTop = Math.min(yOpen, yClose);
                        const bodyH = Math.max(2, Math.abs(yOpen - yClose));
                        const isHov = hoverIdx === i;

                        return (
                          <g key={`candle-${i}`} opacity={hoverIdx === null || isHov ? 1.0 : 0.45}>
                            {/* High-Low Wick Line */}
                            <line
                              x1={cx}
                              y1={yHigh}
                              x2={cx}
                              y2={yLow}
                              stroke={candleColor}
                              strokeWidth={isHov ? "1.8" : "1.2"}
                              strokeLinecap="round"
                            />
                            {/* Candlestick Body */}
                            <rect
                              x={cx - candleWidth / 2}
                              y={bodyTop}
                              width={candleWidth}
                              height={bodyH}
                              fill={candleColor}
                              stroke={candleStroke}
                              strokeWidth={isHov ? "1.2" : "0.75"}
                              rx="0.5"
                            />
                          </g>
                        );
                      })}

                      {/* 2. Realistic Moving Average (MA) Overlay Curve */}
                      <path
                        d={maPath}
                        stroke="#F59E0B"
                        strokeWidth="1.8"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />

                      {/* 3. Min Price Marker Callout on Chart */}
                      {minIdx >= 0 && minLow < Infinity && (
                        <g>
                          <line
                            x1={xOf(minIdx, len)}
                            y1={yOf(minLow, pMin, pMax)}
                            x2={Math.min(CW - PR - 30, xOf(minIdx, len) + (minIdx > len - 4 ? -16 : 14))}
                            y2={yOf(minLow, pMin, pMax) + (yOf(minLow, pMin, pMax) > separatorY - 14 ? -8 : 8)}
                            stroke="#EF4444"
                            strokeWidth="0.9"
                          />
                          <text
                            x={Math.min(CW - PR - 25, xOf(minIdx, len) + (minIdx > len - 4 ? -18 : 16))}
                            y={yOf(minLow, pMin, pMax) + (yOf(minLow, pMin, pMax) > separatorY - 14 ? -5 : 11)}
                            textAnchor={minIdx > len - 4 ? "end" : "start"}
                            fontSize="9"
                            fontWeight="800"
                            fill="#EF4444"
                            fontFamily="monospace"
                          >
                            {minLow.toLocaleString()}
                          </text>
                        </g>
                      )}

                      {/* 4. Dotted Horizontal Guideline for latest price */}
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

                      {/* 5. Live Pulse Dot on Latest Candle Close */}
                      <circle
                        cx={xOf(len - 1, len)}
                        cy={currentCloseY}
                        r="3.5"
                        fill={s.data[len - 1] >= (s.data[len - 2] || s.data[len - 1]) ? "#10B981" : "#EF4444"}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })()
              ) : (
                // Line Mode (Exact Image 2)
                (() => {
                  const s = activeMainSeries;
                  if (!s) return null;
                  const pts = s.data
                    .map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i, len).toFixed(1)},${yOf(v, pMin, pMax).toFixed(1)}`)
                    .join(" ");
                  const areaD = `${pts} L${xOf(len - 1, len).toFixed(1)},${separatorY} L${PL},${separatorY} Z`;

                  return (
                    <g key={`single-line-${s.label}`}>
                      <path
                        d={areaD}
                        fill={`url(#mandiTrendGrad-${s.label.replace(/\s+/g, "_")})`}
                      />
                      <path
                        d={pts}
                        stroke={s.color || "#087F63"}
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Dotted Guideline */}
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
                      {/* Live Pulse Dot */}
                      <circle
                        cx={xOf(len - 1, len)}
                        cy={currentCloseY}
                        r="3.5"
                        fill={s.color || "#087F63"}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })()
              )}

              {/* Hover Indicator Crosshair */}
              {hoverIdx !== null && (
                <g>
                  {/* Full-height vertical crosshair */}
                  <line
                    x1={xOf(hoverIdx, len)}
                    y1={PT}
                    x2={xOf(hoverIdx, len)}
                    y2={volBaseY}
                    stroke="#087F63"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                  {/* Horizontal crosshair */}
                  <line
                    x1={PL}
                    y1={yOf(activeMainSeries?.data[hoverIdx] || displayPrice, pMin, pMax)}
                    x2={CW - PR}
                    y2={yOf(activeMainSeries?.data[hoverIdx] || displayPrice, pMin, pMax)}
                    stroke="#087F63"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.75"
                  />
                  <circle
                    cx={xOf(hoverIdx, len)}
                    cy={yOf(activeMainSeries?.data[hoverIdx] || displayPrice, pMin, pMax)}
                    r="4.5"
                    fill="#087F63"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* Interactive Agricultural Hover Tooltip */}
            {hoverIdx !== null && (() => {
              const dateStr = getCleanDate(hoverIdx);
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
                      {priceSeries.map((s) => {
                        const pVal = s.data[hoverIdx] || 0;
                        return (
                          <div key={`tip-${s.label}`} className="flex items-center justify-between text-[10.5px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ background: s.color || "#087F63" }} />
                              <span className="font-semibold text-[#334155]">
                                {RATE_TYPE_URDU[s.label] && lang === "ur" ? RATE_TYPE_URDU[s.label] : s.label.replace(" Rate", "")}:
                              </span>
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

              const curP = activeMainSeries?.data[hoverIdx] || 0;
              const prevP = hoverIdx > 0 ? (activeMainSeries?.data[hoverIdx - 1] || curP) : curP;
              const curO = hoverIdx > 0 ? prevP : (activeMainSeries?.mins?.[0] ? Math.round(activeMainSeries.mins[0] + (activeMainSeries.maxs[0] - activeMainSeries.mins[0]) * 0.45) : curP);
              const curH = Math.max(activeMainSeries?.maxs?.[hoverIdx] || curP, curO, curP);
              const curL = Math.min(activeMainSeries?.mins?.[hoverIdx] || curP, curO, curP);
              const curC = curP;
              const isCandleUp = curC >= curO;
              const cDiff = curC - curO;
              const cPct = curO > 0 ? ((cDiff / curO) * 100).toFixed(2) : "0.00";
              const volVal = arrivalData[hoverIdx] || 0;

              if (stockChartType === "candle") {
                return (
                  <div
                    className="pointer-events-none absolute z-20 rounded-xl shadow-xl border p-2.5 flex flex-col gap-1.5 backdrop-blur-md transition-all duration-75"
                    style={{
                      left: `${Math.min(Math.max((xOf(hoverIdx, len) / CW) * 100, 24), 76)}%`,
                      top: 12,
                      transform: "translateX(-50%)",
                      background: "rgba(255, 255, 255, 0.97)",
                      borderColor: isCandleUp ? "#10B981" : "#EF4444",
                      minWidth: 165,
                      boxShadow: `0 8px 24px -4px ${isCandleUp ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold pb-1 border-b border-[#E8EFEC]" style={{ color: isCandleUp ? "#059669" : "#DC2626" }}>
                      <span>{lang === "ur" ? "تاریخ:" : "Date:"}</span>
                      <span className="font-mono text-[#0F172A]">{dateStr}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-medium text-[#334155] pt-0.5">
                      <span className="text-[#64748B]">Open:</span>
                      <span className="font-mono font-bold text-right text-[#0F172A]">Rs. {curO.toLocaleString()}</span>

                      <span className="text-[#64748B]">High (Max):</span>
                      <span className="font-mono font-bold text-right text-[#10B981]">Rs. {curH.toLocaleString()}</span>

                      <span className="text-[#64748B]">Low (Min):</span>
                      <span className="font-mono font-bold text-right text-[#EF4444]">Rs. {curL.toLocaleString()}</span>

                      <span className="text-[#64748B]">Close:</span>
                      <span className="font-mono font-bold text-right" style={{ color: isCandleUp ? "#10B981" : "#EF4444" }}>
                        Rs. {curC.toLocaleString()}
                      </span>

                      <span className="text-[#64748B]">Change:</span>
                      <span className="font-mono font-bold text-right" style={{ color: isCandleUp ? "#10B981" : "#EF4444" }}>
                        {isCandleUp ? "+" : ""}{cPct}%
                      </span>

                      <span className="text-[#64748B]">{lang === "ur" ? "آمد:" : "Arrivals:"}</span>
                      <span className="font-mono font-bold text-right text-[#0284C7]">
                        {volVal > 0 ? `${volVal.toLocaleString()} bags` : "—"}
                      </span>
                    </div>
                  </div>
                );
              }

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
                    <span>{lang === "ur" ? "تاریخ:" : "Date:"}</span>
                    <span className="font-mono text-[#0F172A]">{dateStr}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px] font-semibold text-[#334155] pt-1">
                    <span className="text-[#64748B]">
                      {lang === "ur" ? "کم سے کم ریٹ:" : "Min Rate:"}
                    </span>
                    <span className="font-mono font-bold text-right text-[#B91C1C]">
                      Rs. {curL.toLocaleString()}
                    </span>

                    <span className="text-[#64748B]">
                      {lang === "ur" ? "زیادہ سے زیادہ:" : "Max Rate:"}
                    </span>
                    <span className="font-mono font-bold text-right text-[#15803D]">
                      Rs. {curH.toLocaleString()}
                    </span>

                    <span className="text-[#64748B]">
                      {lang === "ur" ? "اوسط ریٹ:" : "Avg Rate:"}
                    </span>
                    <span className="font-mono font-bold text-right text-[#087F63]">
                      Rs. {curP.toLocaleString()}
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
        ) : (
          // Arrival Trend SVG Canvas (Exact Image 3)
          <div className="relative w-full select-none bg-[#FCFDFD] rounded-xl border border-[#EDF4F1] p-1">
            <svg
              viewBox={`0 0 ${CW} ${CH}`}
              className="w-full select-none"
              style={{ height: CH, width: "100%", display: "block", touchAction: "none" }}
              onMouseDown={(e) => {
                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                const i = Math.round((relX / chartW) * (len - 1));
                setArrivalHoverIdx(Math.max(0, Math.min(len - 1, i)));
              }}
              onMouseMove={(e) => {
                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * CW - PL;
                const i = Math.round((relX / chartW) * (len - 1));
                setArrivalHoverIdx(Math.max(0, Math.min(len - 1, i)));
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
                <linearGradient id="mandiArrivalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.32" />
                  <stop offset="85%" stopColor="#D97706" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Horizontal Dashed Gridlines + Y Ticks */}
              {yArrivalTicks.map((tick, ti) => {
                const y = yOfArr(tick);
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
                      x={CW - PR + 6}
                      y={y + 3.5}
                      textAnchor="start"
                      fontSize="10"
                      fontWeight="700"
                      fill="#475569"
                    >
                      {tick.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Pane Separator Line */}
              <line
                x1={PL}
                y1={arrSeparatorY}
                x2={CW - PR}
                y2={arrSeparatorY}
                stroke="#94A3B8"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              <text
                x={CW - PR + 6}
                y={arrSeparatorY + 3.5}
                textAnchor="start"
                fontSize="9"
                fontWeight="800"
                fill="#64748B"
              >
                0
              </text>

              {/* X-Axis Date Labels at Bottom */}
              {fullDateLabels.map((item, i) => {
                if (!item.tickLabel) return null;
                return (
                  <text
                    key={`xArrTick-${i}`}
                    x={xOf(i, len)}
                    y={CH - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#475569"
                    fontFamily={lang === "ur" ? urduFont : "inherit"}
                  >
                    {item.tickLabel}
                  </text>
                );
              })}

              {/* Bottom Orange Arrival Bars */}
              {arrivalData.map((arrVal, i) => {
                const barH = Math.max(2, (arrVal / (maxArr || 1)) * volMaxH);
                const barW = Math.max(2.5, Math.min(6, (chartW / len) * 0.55));
                const isHov = arrivalHoverIdx === i;

                return (
                  <rect
                    key={`arrBar-${i}`}
                    x={xOf(i, len) - barW / 2}
                    y={volBaseY - barH}
                    width={barW}
                    height={barH}
                    rx={1.5}
                    fill="#D97706"
                    opacity={arrivalHoverIdx === null ? 0.75 : isHov ? 1.0 : 0.35}
                  />
                );
              })}

              {/* Main Arrival Area & Line */}
              {(() => {
                const pts = arrivalData
                  .map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i, len).toFixed(1)},${yOfArr(v).toFixed(1)}`)
                  .join(" ");
                const areaD = `${pts} L${xOf(len - 1, len).toFixed(1)},${arrSeparatorY} L${PL},${arrSeparatorY} Z`;

                return (
                  <g>
                    <path d={areaD} fill="url(#mandiArrivalGrad)" />
                    <path
                      d={pts}
                      stroke="#D97706"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Live Pulse Dot on Latest Value */}
                    <circle
                      cx={xOf(len - 1, len)}
                      cy={yOfArr(arrivalData[len - 1] || 0)}
                      r="3.5"
                      fill="#D97706"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })()}

              {/* Hover Indicator Crosshair */}
              {arrivalHoverIdx !== null && (
                <g>
                  {/* Full-height vertical crosshair */}
                  <line
                    x1={xOf(arrivalHoverIdx, len)}
                    y1={PT}
                    x2={xOf(arrivalHoverIdx, len)}
                    y2={volBaseY}
                    stroke="#D97706"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                  {/* Horizontal crosshair */}
                  <line
                    x1={PL}
                    y1={yOfArr(arrivalData[arrivalHoverIdx] || 0)}
                    x2={CW - PR}
                    y2={yOfArr(arrivalData[arrivalHoverIdx] || 0)}
                    stroke="#D97706"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.75"
                  />
                  <circle
                    cx={xOf(arrivalHoverIdx, len)}
                    cy={yOfArr(arrivalData[arrivalHoverIdx] || 0)}
                    r="4.5"
                    fill="#D97706"
                    stroke="#FFFFFF"
                    strokeWidth="2"
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
                  background: "rgba(255, 255, 255, 0.97)",
                  borderColor: "#F59E0B",
                  minWidth: 150,
                  boxShadow: "0 6px 20px -3px rgba(217, 119, 6, 0.22)",
                }}
              >
                <span
                  className="text-[10px] font-bold text-[#B45309] border-b border-[#FEF3C7] pb-0.5"
                  style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
                >
                  {getCleanDate(arrivalHoverIdx)}
                </span>
                <div className="flex items-center justify-between gap-2 pt-0.5 text-xs text-[#1E293B]">
                  <span className="text-[#78350F] text-[10px] font-semibold">
                    {lang === "ur" ? "آمد:" : "Arrival:"}
                  </span>
                  <span className="font-black text-[#D97706]">
                    {lang === "ur"
                      ? `${toUrduDigits((arrivalData[arrivalHoverIdx] || 0).toLocaleString())} تھیلے`
                      : `${(arrivalData[arrivalHoverIdx] || 0).toLocaleString()} Bags`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MandiTrendGraphView;
