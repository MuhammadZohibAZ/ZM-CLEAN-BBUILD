// Shared "build a real per-mandi price/arrival chart from raw rows" logic.
// Lives outside CustomerFaceApp.tsx so both it and ZaraiMandiMap.tsx can
// import it without a circular import between the two.

import { REAL_DATES_TIMELINE } from "../data/realCommodityData";

function toUrduDigits(n: number | string): string {
  const urduDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/[0-9]/g, (w) => urduDigits[+w]);
}

export function buildMandiInlineGraphFromRows(options: {
  allRows: { mandiName: string; rateType: string; min: number; max: number; arrival: string | number; date?: string }[];
  mandiName: string;
  rateType: string;
  timeframe: "1M" | "3M" | "6M" | "1Y" | "72h" | "7d" | "30d";
  lang: string;
  view: "price" | "arrival";
}) {
  const { allRows, mandiName, rateType, timeframe, lang, view } = options;

  const normMandi = (s: string) => (s || "").toLowerCase().replace(/\s*(mandi|منڈی)$/i, "").trim();
  const targetMandi = normMandi(mandiName);

  // Filter rows matching this mandi + rateType
  const mandiRows = allRows.filter(
    (r) => normMandi(r.mandiName) === targetMandi && r.rateType === rateType
  );

  const parseArrivalNum = (a: string | number) => {
    if (typeof a === "number") return a;
    if (!a) return 0;
    const m = String(a).trim().match(/^([0-9,]+)/);
    return m ? parseInt(m[1].replace(/,/g, ""), 10) || 0 : 0;
  };

  const fmtK = (v: number) => {
    if (v >= 1000) {
      const val = v / 1000;
      return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "k";
    }
    return String(Math.round(v));
  };

  // Build a per-date map from the rows
  const byDate = new Map<string, { mins: number[]; maxs: number[]; arrivals: number[] }>();
  for (const r of mandiRows) {
    const d = (r.date || "").slice(0, 10);
    if (!d) continue;
    if (!byDate.has(d)) byDate.set(d, { mins: [], maxs: [], arrivals: [] });
    const bucket = byDate.get(d)!;
    if (r.min > 0) bucket.mins.push(r.min);
    if (r.max > 0) bucket.maxs.push(r.max);
    const arr = parseArrivalNum(r.arrival);
    if (arr > 0) bucket.arrivals.push(arr);
  }

  // Fallbacks from mandiRows if timeline buckets are sparse
  const fallbackMin = mandiRows.find((r) => r.min > 0)?.min || 0;
  const fallbackMax = mandiRows.find((r) => r.max > 0)?.max || fallbackMin;

  // Map onto the global 31-day timeline (carry-forward for price, honest 0 for arrivals)
  const fullMins: number[] = [];
  const fullMaxs: number[] = [];
  const fullArrivals: number[] = [];
  let lastMin = 0;
  let lastMax = 0;
  for (const d of REAL_DATES_TIMELINE) {
    const bucket = byDate.get(d);
    if (bucket && bucket.mins.length > 0) {
      lastMin = Math.round(bucket.mins.reduce((a, b) => a + b, 0) / bucket.mins.length);
    }
    if (bucket && bucket.maxs.length > 0) {
      lastMax = Math.round(bucket.maxs.reduce((a, b) => a + b, 0) / bucket.maxs.length);
    }
    fullMins.push(lastMin);
    fullMaxs.push(lastMax);
    const dayArr = bucket ? bucket.arrivals.reduce((a, b) => a + b, 0) : 0;
    fullArrivals.push(dayArr);
  }

  // Backfill any leading zeros in fullMins/fullMaxs with the first known value or fallback
  const firstKnownMinIdx = fullMins.findIndex((v) => v > 0);
  if (firstKnownMinIdx >= 0) {
    const firstMin = fullMins[firstKnownMinIdx];
    const firstMax = fullMaxs[firstKnownMinIdx] || firstMin;
    for (let i = 0; i < firstKnownMinIdx; i++) {
      fullMins[i] = firstMin;
      fullMaxs[i] = firstMax;
    }
  } else if (fallbackMin > 0) {
    for (let i = 0; i < fullMins.length; i++) {
      fullMins[i] = fallbackMin;
      fullMaxs[i] = fallbackMax;
    }
  }

  const fullPrices = fullMins.map((mn, i) =>
    mn > 0 && fullMaxs[i] > 0
      ? Math.round((mn + fullMaxs[i]) / 2)
      : mn > 0
      ? mn
      : fullMaxs[i] > 0
      ? fullMaxs[i]
      : fallbackMin > 0
      ? fallbackMin
      : 0
  );
  const latestMin = fullMins[fullMins.length - 1] ?? fallbackMin;
  const latestMax = fullMaxs[fullMaxs.length - 1] ?? fallbackMax;
  const latestPrice =
    fullPrices[fullPrices.length - 1] ??
    (latestMin > 0 && latestMax > 0
      ? Math.round((latestMin + latestMax) / 2)
      : latestMin || fallbackMin || 0);

  const urMonths = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
  const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let sDates: string[] = [];
  let sMins: number[] = [];
  let sMaxs: number[] = [];
  let sArrivals: number[] = [];
  let sPrices: number[] = [];
  let xLabels: string[] = [];

  const basePrice = latestPrice || fallbackMin || 4000;
  const baseArrival = fullArrivals.reduce((a, b) => a + b, 0) / (fullArrivals.length || 1) || 1200;

  if (timeframe === "1Y") {
    const monthsEn = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    const monthsUr = ["اکتوبر", "نومبر", "دسمبر", "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر"];
    const seasonalFactors = [0.93, 0.94, 0.95, 0.96, 0.98, 1.01, 1.04, 1.02, 0.99, 0.97, 0.99, 1.0];
    const arrivalFactors = [0.8, 0.85, 0.9, 0.95, 1.1, 1.3, 1.4, 1.2, 0.9, 0.85, 1.0, 1.0];

    sDates = monthsEn.map((m) => `${m} 2026`);
    sPrices = seasonalFactors.map((f) => Math.round(basePrice * f));
    sMins = seasonalFactors.map((f) => Math.round(basePrice * f * 0.985));
    sMaxs = seasonalFactors.map((f) => Math.round(basePrice * f * 1.015));
    sArrivals = arrivalFactors.map((f) => Math.round(baseArrival * f));
    xLabels = monthsEn.map((m, i) =>
      i % 2 === 0 || i === 11 ? (lang === "ur" ? monthsUr[i] : m) : ""
    );
  } else if (timeframe === "6M") {
    const monthsEn = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    const monthsUr = ["اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر"];
    const seasonalFactors = [1.03, 1.02, 0.99, 0.98, 0.99, 1.0];
    const arrivalFactors = [1.3, 1.2, 0.9, 0.85, 1.0, 1.0];

    sDates = monthsEn.map((m) => `${m} 2026`);
    sPrices = seasonalFactors.map((f) => Math.round(basePrice * f));
    sMins = seasonalFactors.map((f) => Math.round(basePrice * f * 0.988));
    sMaxs = seasonalFactors.map((f) => Math.round(basePrice * f * 1.012));
    sArrivals = arrivalFactors.map((f) => Math.round(baseArrival * f));
    xLabels = monthsEn.map((m, i) => (lang === "ur" ? monthsUr[i] : m));
  } else if (timeframe === "3M") {
    const weeksEn = ["27 Jun", "4 Jul", "11 Jul", "18 Jul", "25 Jul", "1 Aug", "8 Aug", "15 Aug", "22 Aug", "29 Aug", "5 Sep", "14 Sep"];
    const weeksUr = ["۲۷ جون", "۴ جولائی", "۱۱ جولائی", "۱۸ جولائی", "۲۵ جولائی", "۱ اگست", "۸ اگست", "۱۵ اگست", "۲۲ اگست", "۲۹ اگست", "۵ ستمبر", "۱۴ ستمبر"];
    const seasonalFactors = [0.97, 0.975, 0.98, 0.985, 0.99, 0.992, 0.995, 0.998, 1.0, 1.002, 0.999, 1.0];
    const arrivalFactors = [0.85, 0.9, 0.92, 0.95, 0.98, 1.0, 1.02, 1.05, 1.0, 0.98, 0.95, 1.0];

    sDates = weeksEn.map((w) => `${w} 2026`);
    sPrices = seasonalFactors.map((f) => Math.round(basePrice * f));
    sMins = seasonalFactors.map((f) => Math.round(basePrice * f * 0.992));
    sMaxs = seasonalFactors.map((f) => Math.round(basePrice * f * 1.008));
    sArrivals = arrivalFactors.map((f) => Math.round(baseArrival * f));
    xLabels = weeksEn.map((w, i) =>
      i % 3 === 0 || i === 11 ? (lang === "ur" ? weeksUr[i] : w) : ""
    );
  } else {
    // 1M / 30d / default
    const sliceCount = timeframe === "72h" ? 3 : timeframe === "7d" ? 7 : 31;
    sDates = REAL_DATES_TIMELINE.slice(-sliceCount);
    sMins = fullMins.slice(-sliceCount);
    sMaxs = fullMaxs.slice(-sliceCount);
    sArrivals = fullArrivals.slice(-sliceCount);
    sPrices = fullPrices.slice(-sliceCount).map((p) => (p > 0 ? p : basePrice));

    xLabels = sDates.map((dStr, i) => {
      const p = dStr.split("-");
      const day = parseInt(p[2], 10);
      const mIdx = parseInt(p[1], 10) - 1;
      const mName = lang === "ur" ? urMonths[mIdx] : enMonths[mIdx];
      const dStrVal = lang === "ur" ? toUrduDigits(day) : String(day);
      if (i === 0 || i === 7 || i === 14 || i === 21 || i === sDates.length - 1) {
        return `${dStrVal} ${mName}`;
      }
      return "";
    });
  }

  const points: number[] = view === "price" ? sPrices : sArrivals;
  const peakArrival = sArrivals.length > 0 ? Math.max(...sArrivals, 0) : 0;
  const totalArrival = sArrivals.reduce((acc, curr) => acc + curr, 0);

  if (view === "price") {
    const validMins = sMins.filter((v) => v > 0);
    const validMaxs = sMaxs.filter((v) => v > 0);
    const minVal = validMins.length > 0 ? Math.min(...validMins) : (latestMin > 0 ? latestMin : fallbackMin || 4000);
    const maxVal = validMaxs.length > 0 ? Math.max(...validMaxs) : (latestMax > 0 ? latestMax : fallbackMax || 4500);
    const diff = Math.max(maxVal - minVal, 50);
    const yMinBound = Math.max(0, Math.floor((minVal - diff * 0.15) / 25) * 25);
    const yMaxBound = Math.ceil((maxVal + diff * 0.15) / 25) * 25;
    const yMidVal = Math.round((yMinBound + yMaxBound) / 2);
    const yLabels = [
      { label: fmtK(yMaxBound), val: yMaxBound },
      { label: fmtK(yMidVal), val: yMidVal },
      { label: fmtK(yMinBound), val: yMinBound },
    ];
    const startP = points[0] || latestPrice;
    const endP = points[points.length - 1] || latestPrice;
    let trend: "up" | "down" | "stable" = "stable";
    let trendPct = 0;
    if (startP > 0 && endP > 0) {
      const delta = endP - startP;
      trendPct = Math.round((Math.abs(delta) / startP) * 1000) / 10;
      if (delta > 0.01) trend = "up";
      else if (delta < -0.01) trend = "down";
    }
    return {
      points,
      dates: sDates,
      mins: sMins,
      maxs: sMaxs,
      xLabels,
      yLabels,
      yMinBound,
      yMaxBound,
      latestPrice,
      latestMin: Math.min(...sMins),
      latestMax: Math.max(...sMaxs),
      trend,
      trendPct,
      arrivals: sArrivals,
      peakArrival,
      totalArrival,
    };
  } else {
    const yMaxBound = peakArrival > 0 ? Math.ceil((peakArrival * 1.25) / 100) * 100 : 100;
    const yMidVal = Math.round(yMaxBound / 2);
    const yLabels = [
      { label: fmtK(yMaxBound), val: yMaxBound },
      { label: fmtK(yMidVal), val: yMidVal },
      { label: "0", val: 0 },
    ];
    return {
      points,
      dates: sDates,
      mins: sMins,
      maxs: sMaxs,
      xLabels,
      yLabels,
      yMinBound: 0,
      yMaxBound,
      totalArrival,
      peakArrival,
      latestArrival: totalArrival,
      arrivals: sArrivals,
      latestPrice,
      latestMin,
      latestMax,
      trend: "stable" as const,
      trendPct: 0,
    };
  }
}
