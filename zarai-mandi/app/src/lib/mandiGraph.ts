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
  timeframe: "72h" | "7d" | "30d";
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

  const fullPrices = fullMins.map((mn, i) => mn > 0 && fullMaxs[i] > 0 ? Math.round((mn + fullMaxs[i]) / 2) : 0);
  const latestMin = fullMins[fullMins.length - 1] ?? 0;
  const latestMax = fullMaxs[fullMaxs.length - 1] ?? 0;
  const latestPrice = fullPrices[fullPrices.length - 1] ?? (latestMin > 0 && latestMax > 0 ? Math.round((latestMin + latestMax) / 2) : 0);
  const latestArrival = fullArrivals.reduce((a, b) => a + b, 0);

  // Determine sliceCount
  const sliceCount = timeframe === "72h" ? 3 : timeframe === "7d" ? 7 : 31;

  const urDays = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];
  const enDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const urMonths = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
  const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // No intraday (24h) option: the source export is one row per market per
  // day, so there is no real sub-daily data to plot -- a fabricated 24h
  // curve would just be interpolated points between two real numbers
  // labelled with clock times nothing was actually reported at.

  const sDates = REAL_DATES_TIMELINE.slice(-sliceCount);
  const sMins = fullMins.slice(-sliceCount);
  const sMaxs = fullMaxs.slice(-sliceCount);
  const sArrivals = fullArrivals.slice(-sliceCount);
  const sPrices = fullPrices.slice(-sliceCount);

  // 72h = the real last up to 3 daily observations, plotted as-is -- no
  // interpolated in-between points and no hardcoded date/time labels.
  const points: number[] = view === "price" ? sPrices : sArrivals;
  const xLabels: string[] = sDates.map((dStr, i) => {
    const p = dStr.split("-");
    const dt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (timeframe === "72h") {
      const day = parseInt(p[2], 10);
      const mIdx = parseInt(p[1], 10) - 1;
      const mName = lang === "ur" ? urMonths[mIdx] : enMonths[mIdx];
      const dStrVal = lang === "ur" ? toUrduDigits(day) : String(day);
      return `${dStrVal} ${mName}`;
    }
    if (timeframe === "7d") return lang === "ur" ? urDays[dt.getDay()] : enDays[dt.getDay()];
    const day = parseInt(p[2], 10);
    const mIdx = parseInt(p[1], 10) - 1;
    const mName = lang === "ur" ? urMonths[mIdx] : enMonths[mIdx];
    const dStrVal = lang === "ur" ? toUrduDigits(day) : String(day);
    if (i === 0 || i === 7 || i === 14 || i === 21 || i === sDates.length - 1) return `${dStrVal} ${mName}`;
    return "";
  });

  if (view === "price") {
    const validMins = sMins.filter((v) => v > 0);
    const validMaxs = sMaxs.filter((v) => v > 0);
    const minVal = validMins.length > 0 ? Math.min(...validMins) : (latestMin > 0 ? latestMin : 4000);
    const maxVal = validMaxs.length > 0 ? Math.max(...validMaxs) : (latestMax > 0 ? latestMax : 4500);
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
    return { points, dates: sDates, xLabels, yLabels, yMinBound, yMaxBound, latestPrice, latestMin, latestMax, trend, trendPct };
  } else {
    const peakArrival = points.length > 0 ? Math.max(...points, 0) : 0;
    const totalArrival = points.reduce((acc, curr) => acc + curr, 0);
    const yMaxBound = peakArrival > 0 ? Math.ceil((peakArrival * 1.25) / 100) * 100 : 100;
    const yMidVal = Math.round(yMaxBound / 2);
    const yLabels = [
      { label: fmtK(yMaxBound), val: yMaxBound },
      { label: fmtK(yMidVal), val: yMidVal },
      { label: "0", val: 0 },
    ];
    return { points, dates: sDates, xLabels, yLabels, yMinBound: 0, yMaxBound, totalArrival, peakArrival, latestArrival: totalArrival };
  }
}
