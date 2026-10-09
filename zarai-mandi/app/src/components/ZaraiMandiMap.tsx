import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Search,
  MapPin,
  Plus,
  Minus,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  Wheat,
  Layers,
  ArrowLeft,
  Locate,
  BookOpen,
  Info,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { MandiDetailSheet } from "../customer-face/screens/product-rates/MandiDetailSheet";
import { makeFmt } from "../customer-face/screens/product-rates/format";
import { TIMELINE } from "../customer-face/screens/product-rates/useMarketData";
import { speakText } from "../customer-face/shared/voice";
import type { MarketRow } from "../customer-face/screens/product-rates/types";

import {
  type Mandi,
  type ProvinceName,
  type ProvinceInfo,
  MANDI_DATA,
  PROVINCES,
} from "../customer-face/shared/data/mandiLocation";

export { type Mandi, type ProvinceName, type ProvinceInfo, MANDI_DATA, PROVINCES };

const MAJOR_HUBS = new Set([
  "Lahore",
  "Faisalabad",
  "Multan",
  "Karachi",
  "Hyderabad",
  "Sukkur",
  "Peshawar",
  "Quetta",
  "Sargodha",
  "Bahawalpur",
  "Sahiwal",
  "Sialkot",
  "Rahim Yar Khan",
  "Pakpattan",
  "Okara",
  "Jhang",
  "Khanewal",
]);

function labelPriority(m: Mandi): number {
  return MAJOR_HUBS.has(m.city) ? 0 : 1;
}

function labelBudgetForSpan(lonSpan: number): number {
  if (lonSpan > 13) return 0;
  if (lonSpan > 8) return 8;
  if (lonSpan > 4) return 14;
  if (lonSpan > 2) return 22;
  return 36;
}

const FULL_BOUNDS = { latMin: 23.3, latMax: 37.2, lonMin: 60.5, lonMax: 77.9 };
const VIEW_W = 400;
const VIEW_H = 460;

interface ViewBox {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

function boundsFromOutline(outlines: [number, number][][], padFraction = 0.35): ViewBox {
  const allPoints = outlines.flat();
  const lats = allPoints.map((p) => p[0]);
  const lons = allPoints.map((p) => p[1]);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const lonMin = Math.min(...lons);
  const lonMax = Math.max(...lons);
  const latPad = (latMax - latMin) * padFraction || 0.5;
  const lonPad = (lonMax - lonMin) * padFraction || 0.5;
  return fitAspect({
    latMin: latMin - latPad,
    latMax: latMax + latPad,
    lonMin: lonMin - lonPad,
    lonMax: lonMax + lonPad,
  });
}

function fitAspect(vb: ViewBox): ViewBox {
  const targetRatio = VIEW_W / VIEW_H;
  const latSpan = vb.latMax - vb.latMin;
  const lonSpan = vb.lonMax - vb.lonMin;
  const centerLat = (vb.latMin + vb.latMax) / 2;
  const centerLon = (vb.lonMin + vb.lonMax) / 2;
  const kmPerDegLat = 111;
  const kmPerDegLon = 111 * Math.cos((centerLat * Math.PI) / 180);
  const currentRatio = (lonSpan * kmPerDegLon) / (latSpan * kmPerDegLat);
  if (currentRatio > targetRatio) {
    const neededLatSpan = (lonSpan * kmPerDegLon) / (targetRatio * kmPerDegLat);
    return {
      latMin: centerLat - neededLatSpan / 2,
      latMax: centerLat + neededLatSpan / 2,
      lonMin: vb.lonMin,
      lonMax: vb.lonMax,
    };
  } else {
    const neededLonSpan = (targetRatio * latSpan * kmPerDegLat) / kmPerDegLon;
    return {
      latMin: vb.latMin,
      latMax: vb.latMax,
      lonMin: centerLon - neededLonSpan / 2,
      lonMax: centerLon + neededLonSpan / 2,
    };
  }
}

function project(lat: number, lon: number, vb: ViewBox): { x: number; y: number } {
  const x = ((lon - vb.lonMin) / (vb.lonMax - vb.lonMin)) * VIEW_W;
  const y = ((vb.latMax - lat) / (vb.latMax - vb.latMin)) * VIEW_H;
  return { x, y };
}

function polygonPoints(outline: [number, number][], vb: ViewBox): string {
  return outline.map(([lat, lon]) => {
    const { x, y } = project(lat, lon, vb);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

interface MarkerPoint {
  mandi: Mandi;
  x: number;
  y: number;
}

interface Cluster {
  id: string;
  x: number;
  y: number;
  mandis: Mandi[];
  province: string;
}

function clusterMarkers(points: MarkerPoint[], thresholdPx: number): Cluster[] {
  const remaining = [...points];
  const clusters: Cluster[] = [];
  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const group: MarkerPoint[] = [seed];
    for (let i = remaining.length - 1; i >= 0; i--) {
      const p = remaining[i];
      const dist = Math.hypot(p.x - seed.x, p.y - seed.y);
      if (dist < thresholdPx) {
        group.push(p);
        remaining.splice(i, 1);
      }
    }
    const avgX = group.reduce((s, g) => s + g.x, 0) / group.length;
    const avgY = group.reduce((s, g) => s + g.y, 0) / group.length;
    clusters.push({
      id: `cluster-${group.map((g) => g.mandi.id).join("-")}`,
      x: avgX,
      y: avgY,
      mandis: group.map((g) => g.mandi),
      province: group[0].mandi.province,
    });
  }
  return clusters;
}

type ViewLevel = "country" | "province" | "mandi";

interface AppView {
  level: ViewLevel;
  province: ProvinceInfo | null;
  mandi: Mandi | null;
}

const GREEN_DARK = "#166534";
const GREEN_MED = "#16A34A";

// Real per-mandi price/arrival chart data, built from actual rows -- see
// app/src/lib/mandiGraph.ts. No fabricated intraday curves or hardcoded
// date labels here; see that module's own comments for why 24h isn't offered.

// One real row (from the API-backed price_records dataset) for the
// currently-viewed by-product. This is the ONLY source of truth this map
// uses for which mandis get a pin, and for every number shown once a pin
// is tapped -- no per-mandi placeholder numbers, no static commodity list.
export interface MapByProductRecord {
  id?: string;
  mandiName: string; // "X Mandi"
  district: string;
  province: string;
  rateType: string;
  min: number;
  max: number;
  arrival: string | number;
  arrivalUnit?: string;
  date?: string;
  newOld?: string;
  variety?: string;
  color?: string;
  origin?: string;
  quality?: string;
  moisture?: string;
  spec?: string;
}

function mostCommon(values: (string | undefined)[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  let best: string | undefined;
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

export interface ZaraiMandiMapProps {
  onClose?: () => void;
  initialMandiName?: string;
  initialProvinceName?: string;
  activeCommodity?: string;
  records?: MapByProductRecord[];
  lang?: "ur" | "en";
  urduFont?: string;
  onSelectMandi?: (name: string) => void;
}

export default function ZaraiMandiMap({
  onClose,
  // No default mandi/province: without an explicit initialMandiName, the
  // map should stay at its already-correct all-Pakistan initial `view`
  // (see useState below) instead of auto-focusing on one hardcoded mandi.
  initialMandiName,
  initialProvinceName,
  activeCommodity = "Wheat",
  records = [],
  lang = "en",
  urduFont,
}: ZaraiMandiMapProps) {
  const [view, setView] = useState<AppView>({
    level: "country",
    province: null,
    mandi: null,
  });
  const [viewBox, setViewBox] = useState<ViewBox>(() => fitAspect(FULL_BOUNDS));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [graphMode, setGraphMode] = useState<"price" | "arrival">("price");
  const [timeframe, setTimeframe] = useState<string>("1D");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>(() => ({ start: TIMELINE[Math.max(0, TIMELINE.length - 31)], end: TIMELINE[TIMELINE.length - 1] }));
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const [granularity, setGranularity] = useState<string>("15");
  const [graphHoverIdx, setGraphHoverIdx] = useState<number | null>(null);
  const [showWiki, setShowWiki] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Urdu text uses English digits (see LangProvider's toUrduDigits).
  const toUrduDigits = (n: number | string): string => String(n);

  const normStation = (s: string) =>
    (s || "").toLowerCase().replace(/\s*(mandi|منڈی)$/i, "").trim();

  // Real mandis reporting this by-product this month, from the live
  // API-backed dataset -- not the static per-mandi commodity list. A mandi
  // only gets a pin if it actually has a valid price row for this
  // by-product; there is no fallback list.
  const realStationNames = useMemo(
    () => new Set(records.map((r) => normStation(r.mandiName))),
    [records]
  );
  const visibleCropMandis = useMemo(() => {
    return MANDI_DATA.filter(
      (m) => realStationNames.has(normStation(m.name)) || realStationNames.has(normStation(m.city))
    );
  }, [realStationNames]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarFilter, setSidebarFilter] = useState("");

  const activeMandiList = useMemo(() => {
    return visibleCropMandis
      .map((m) => {
        const mandiKey = normStation(m.name);
        const mandiCityKey = normStation(m.city);
        const mRecs = records.filter(
          (r) => normStation(r.mandiName) === mandiKey || normStation(r.mandiName) === mandiCityKey
        );
        let minRate = 0;
        let maxRate = 0;
        let arrBags = 0;
        if (mRecs.length > 0) {
          const mins = mRecs.map((r) => r.min).filter((v) => typeof v === "number" && v > 0);
          const maxs = mRecs.map((r) => r.max).filter((v) => typeof v === "number" && v > 0);
          if (mins.length) minRate = Math.min(...mins);
          if (maxs.length) maxRate = Math.max(...maxs);
          arrBags = mRecs.reduce((sum, r) => {
            if (typeof r.arrival === "number") return sum + r.arrival;
            const match = String(r.arrival || "").match(/^([0-9,]+)/);
            return sum + (match ? parseInt(match[1].replace(/,/g, ""), 10) || 0 : 0);
          }, 0);
        }
        return {
          mandi: m,
          minRate,
          maxRate,
          arrBags,
          recsCount: mRecs.length,
        };
      })
      .filter((item) => {
        if (!sidebarFilter.trim()) return true;
        const q = sidebarFilter.toLowerCase();
        return (
          item.mandi.name.toLowerCase().includes(q) ||
          item.mandi.city.toLowerCase().includes(q) ||
          item.mandi.province.toLowerCase().includes(q)
        );
      });
  }, [visibleCropMandis, records, sidebarFilter]);

  const selectedMandi = view.mandi;

  const visibleMandis = useMemo(() => {
    if (selectedMandi) return visibleCropMandis;
    if (view.level === "province" && view.province) {
      return visibleCropMandis.filter((m) => m.province === view.province!.name);
    }
    return visibleCropMandis;
  }, [visibleCropMandis, view.level, view.province, selectedMandi]);

  /* ---------------- animated map transitions ---------------- */

  const viewBoxRef = useRef(viewBox);
  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  const animRef = useRef<number | null>(null);

  const animateToViewBox = useCallback((target: ViewBox, duration = 480) => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    const start = viewBoxRef.current;
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const e = ease(p);
      setViewBox({
        latMin: start.latMin + (target.latMin - start.latMin) * e,
        latMax: start.latMax + (target.latMax - start.latMax) * e,
        lonMin: start.lonMin + (target.lonMin - start.lonMin) * e,
        lonMax: start.lonMax + (target.lonMax - start.lonMax) * e,
      });
      if (p < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  const goCountry = useCallback(() => {
    setView({ level: "country", province: null, mandi: null });
    animateToViewBox(fitAspect(FULL_BOUNDS));
    setShowWiki(false);
  }, [animateToViewBox]);

  const goProvince = useCallback(
    (province: ProvinceInfo) => {
      setView({ level: "province", province, mandi: null });
      animateToViewBox(boundsFromOutline(province.outlines));
      setShowWiki(false);
    },
    [animateToViewBox]
  );

  const goMandi = useCallback(
    (mandi: Mandi) => {
      const province = PROVINCES.find((p) => p.name === mandi.province) ?? null;
      setView({ level: "mandi", province, mandi });

      const vb = viewBoxRef.current;
      let latSpan = vb.latMax - vb.latMin;
      let lonSpan = vb.lonMax - vb.lonMin;
      const targetSpan = 3.5;
      if (latSpan > targetSpan) {
        latSpan = targetSpan;
        lonSpan = targetSpan * 1.2;
      }

      animateToViewBox({
        latMin: mandi.latitude - latSpan / 2,
        latMax: mandi.latitude + latSpan / 2,
        lonMin: mandi.longitude - lonSpan / 2,
        lonMax: mandi.longitude + lonSpan / 2,
      });

      setShowWiki(false);
      setSearchQuery("");
      setSearchFocused(false);
    },
    [animateToViewBox]
  );

  // Mirror whatever location the screen this map is embedded in currently
  // has selected: a specific mandi/district zooms straight there, a
  // province zooms to that province, and neither prop set (the "All
  // Pakistan" case) leaves the map at its default country-level view.
  useEffect(() => {
    if (initialMandiName) {
      const found = visibleCropMandis.find(
        (m) =>
          m.name.toLowerCase().includes(initialMandiName.toLowerCase()) ||
          m.city.toLowerCase().includes(initialMandiName.toLowerCase()) ||
          initialMandiName.toLowerCase().includes(m.city.toLowerCase())
      );
      if (found) {
        goMandi(found);
        return;
      }
    }
    if (initialProvinceName) {
      const found = PROVINCES.find(
        (p) =>
          p.name.toLowerCase() === initialProvinceName.toLowerCase() ||
          p.short.toLowerCase() === initialProvinceName.toLowerCase()
      );
      if (found) {
        goProvince(found);
      }
    }
  }, [initialMandiName, initialProvinceName, visibleCropMandis, goMandi, goProvince]);

  /* ---------------- gestures ---------------- */

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<{ id: number; lastX: number; lastY: number } | null>(null);
  const movedRef = useRef(false);

  const getScale = useCallback(() => {
    const el = svgRef.current;
    if (!el) return 1;
    const r = el.getBoundingClientRect();
    return Math.min(r.width / VIEW_W, r.height / VIEW_H) || 1;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = false;
    if (pointersRef.current.size === 1) {
      dragRef.current = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY };
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const d = dragRef.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedRef.current = true;
      d.lastX = e.clientX;
      d.lastY = e.clientY;

      const s = getScale();
      const vb = viewBoxRef.current;
      const lonPerPx = (vb.lonMax - vb.lonMin) / VIEW_W / s;
      const latPerPx = (vb.latMax - vb.latMin) / VIEW_H / s;
      setViewBox((prev) => ({
        latMin: prev.latMin + dy * latPerPx,
        latMax: prev.latMax + dy * latPerPx,
        lonMin: prev.lonMin - dx * lonPerPx,
        lonMax: prev.lonMax - dx * lonPerPx,
      }));
    },
    [getScale]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(e.pointerId);
    dragRef.current = null;
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const vb = viewBoxRef.current;
      const centerLat = (vb.latMin + vb.latMax) / 2;
      const centerLon = (vb.lonMin + vb.lonMax) / 2;
      const latSpan = (vb.latMax - vb.latMin) * factor;
      const lonSpan = (vb.lonMax - vb.lonMin) * factor;
      animateToViewBox({
        latMin: centerLat - latSpan / 2,
        latMax: centerLat + latSpan / 2,
        lonMin: centerLon - lonSpan / 2,
        lonMax: centerLon + lonSpan / 2,
      });
    },
    [animateToViewBox]
  );

  const points: MarkerPoint[] = useMemo(
    () =>
      visibleMandis.map((m) => {
        const { x, y } = project(m.latitude, m.longitude, viewBox);
        return { mandi: m, x, y };
      }),
    [visibleMandis, viewBox]
  );

  const lonSpan = viewBox.lonMax - viewBox.lonMin;

  const clusters = useMemo(() => {
    if (selectedMandi) {
      return points.map((p) => ({
        id: `single-${p.mandi.id}`,
        x: p.x,
        y: p.y,
        mandis: [p.mandi],
        province: p.mandi.province,
      }));
    }
    const threshold = lonSpan > 12 ? 16 : lonSpan > 6 ? 10 : 6;
    return clusterMarkers(points, threshold);
  }, [points, lonSpan, selectedMandi]);

  const labels = useMemo(() => {
    const singles = clusters.filter((c) => c.mandis.length === 1);
    const budget = labelBudgetForSpan(lonSpan);
    if (budget === 0 && !selectedMandi) return [];

    const candidates = [...singles]
      .sort((a, b) => {
        if (selectedMandi) {
          if (a.mandis[0].id === selectedMandi.id) return -1;
          if (b.mandis[0].id === selectedMandi.id) return 1;
        }
        return labelPriority(a.mandis[0]) - labelPriority(b.mandis[0]);
      })
      .slice(0, selectedMandi ? 10 : budget);

    return candidates.map((c) => {
      const m = c.mandis[0];
      const isSel = selectedMandi?.id === m.id;
      return {
        key: m.id,
        x: c.x + (isSel ? 9 : 6),
        y: c.y - (isSel ? 10 : 6),
        text: isSel ? `${m.name}` : m.city,
        selected: isSel,
      };
    });
  }, [clusters, lonSpan, selectedMandi]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return visibleCropMandis.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery, visibleCropMandis]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#F4FAF7] select-none font-sans rounded-[26px]">
      {/* ── Compact Top Controls & Floating Search ── */}
      <div className="relative z-30 px-3.5 pt-3 pb-1.5 flex items-center justify-between gap-2.5 bg-white/90 backdrop-blur-md border-b border-emerald-100/80">
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F0FDF4] border border-emerald-200">
            <Search size={15} color="#166534" className="flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={lang === "ur" ? `پاکستان میں ${activeCommodity} کی منڈیاں تلاش کریں` : `Search ${activeCommodity} mandis in Pakistan...`}
              className="w-full bg-transparent text-[13px] text-emerald-950 font-medium outline-none placeholder:text-emerald-700/50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchFocused(false);
                }}
                className="text-emerald-700/60 hover:text-emerald-900"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-emerald-100 overflow-hidden z-40 max-h-48 overflow-y-auto">
              {searchResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    goMandi(m);
                    setSearchQuery("");
                    setSearchFocused(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-left hover:bg-[#F0FDF4] transition-colors border-b border-emerald-50 last:border-none"
                >
                  <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-[12.5px] font-bold text-emerald-950">{m.name}</p>
                    <p className="text-[10px] text-emerald-700">{m.city}, {m.province}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prominent Cross / Close button to dismiss full-screen map */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === "ur" ? "نقشہ بند کریں" : "Close map"}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title={lang === "ur" ? "نقشہ بند کریں" : "Close map"}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Vector Map Area ── */}
      <div className="relative flex-1 min-h-0 bg-[#E8F5EE]/40 overflow-hidden">
        {/* Floating Nearby Mandis Collapsible Sidebar on the Left Area */}
        <div
          className={`absolute left-2.5 top-2.5 ${sidebarOpen ? "bottom-2.5 z-20 flex flex-col w-[180px] sm:w-[225px]" : "z-20 w-auto"
            } transition-all duration-300 pointer-events-auto`}
        >
          {sidebarOpen ? (
            <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-200/90 shadow-xl flex flex-col overflow-hidden">
              {/* Header with Title and explicit Collapse button */}
              <div className="p-2.5 pb-2 border-b border-emerald-100 flex items-center justify-between bg-[#F0FAF5] flex-shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
                  <p
                    className="text-[11px] sm:text-xs font-black text-emerald-950 truncate"
                    style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
                  >
                    {lang === "ur" ? "قریبی منڈیاں" : "Nearby Mandis"}
                  </p>
                  <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-700 text-white flex-shrink-0">
                    {visibleCropMandis.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold transition shadow-xs flex-shrink-0"
                  title={lang === "ur" ? "لسٹ چھپائیں" : "Collapse list"}
                >
                  <ChevronLeft size={13} strokeWidth={2.5} />
                  <span>{lang === "ur" ? "چھپائیں" : "Hide"}</span>
                </button>
              </div>

              {/* Mini Quick Filter */}
              {visibleCropMandis.length > 4 && (
                <div className="px-2 py-1.5 border-b border-emerald-50 bg-white flex-shrink-0">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F4FAF7] border border-emerald-100">
                    <Search size={11} className="text-emerald-700 flex-shrink-0" />
                    <input
                      value={sidebarFilter}
                      onChange={(e) => setSidebarFilter(e.target.value)}
                      placeholder={lang === "ur" ? "تلاش کریں..." : "Filter mandis..."}
                      className="w-full bg-transparent text-[10.5px] text-emerald-950 outline-none placeholder:text-emerald-700/50"
                    />
                    {sidebarFilter && (
                      <button onClick={() => setSidebarFilter("")} className="text-emerald-700">
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Scrollable Mandi List */}
              <div
                className="flex-1 overflow-y-auto p-1.5 space-y-1.5 zm-table-scroll-container"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#087F63 #E4F2EC" }}
              >
                {activeMandiList.length === 0 ? (
                  <p
                    className="text-[10.5px] text-slate-400 text-center py-4"
                    style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
                  >
                    {lang === "ur" ? "کوئی منڈی نہیں ملی" : "No mandis found"}
                  </p>
                ) : (
                  activeMandiList.map((item) => {
                    const isSelected = selectedMandi?.id === item.mandi.id;
                    return (
                      <button
                        key={item.mandi.id}
                        onClick={() => goMandi(item.mandi)}
                        className={`w-full text-left p-2 rounded-xl transition-all border ${isSelected
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-md scale-[1.01]"
                          : "bg-[#FAFCFB] hover:bg-emerald-50 text-slate-800 border-emerald-100/80 shadow-sm"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-[11px] sm:text-[11.5px] font-black leading-tight truncate ${isSelected ? "text-white" : "text-emerald-950"}`}>
                            {item.mandi.name}
                          </p>
                          <span className={`text-[8.5px] font-bold px-1 rounded flex-shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                            {item.mandi.province.slice(0, 3)}
                          </span>
                        </div>

                        {/* Rate and arrival tags */}
                        <div className="mt-1 flex items-center justify-between text-[9.5px]">
                          <span className={`font-bold ${isSelected ? "text-emerald-100" : "text-emerald-700"}`}>
                            {item.minRate > 0
                              ? `Rs ${item.minRate.toLocaleString()}${item.maxRate > item.minRate ? ` - ${item.maxRate.toLocaleString()}` : ""}`
                              : "—"}
                          </span>
                          {item.arrBags > 0 && (
                            <span className={`text-[8.5px] font-semibold opacity-90 ${isSelected ? "text-white" : "text-slate-500"}`}>
                              {item.arrBags.toLocaleString()} bags
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-emerald-300 shadow-xl text-emerald-900 hover:bg-emerald-50 transition active:scale-95 whitespace-nowrap group"
              title={lang === "ur" ? "قریبی منڈیاں دیکھیں" : "Expand Nearby Mandis list"}
            >
              <ChevronRight size={15} strokeWidth={2.5} className="text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
              <span className="text-xs font-black text-emerald-950" style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}>
                {lang === "ur" ? "قریبی منڈیاں" : "Nearby Mandis"}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">
                {visibleCropMandis.length}
              </span>
            </button>
          )}
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => {
            if (!movedRef.current) {
              setSidebarOpen(false);
            }
          }}
        >
          <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#F0FAF5" />

          {/* Provinces */}
          {PROVINCES.map((p) => {
            const isActive = view.province?.name === p.name;
            return (
              <g key={p.name}>
                {p.outlines.map((ring, ringIdx) => (
                  <polygon
                    key={`${p.name}-${ringIdx}`}
                    points={polygonPoints(ring, viewBox)}
                    fill={isActive ? p.fillActive : p.fill}
                    stroke="#5B7A70"
                    strokeWidth={1.1}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!movedRef.current && view.level === "country") {
                        goProvince(p);
                      }
                    }}
                    style={{ cursor: view.level === "country" ? "pointer" : "default" }}
                  />
                ))}
              </g>
            );
          })}

          {/* Mandi Pins / Nodes */}
          {clusters.map((c) => {
            const isCluster = c.mandis.length > 1;
            if (isCluster) {
              const r = 9 + Math.min(c.mandis.length, 16) * 0.4;
              return (
                <g
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!movedRef.current) {
                      const lats = c.mandis.map((m) => m.latitude);
                      const lons = c.mandis.map((m) => m.longitude);
                      animateToViewBox(
                        fitAspect({
                          latMin: Math.min(...lats) - 0.4,
                          latMax: Math.max(...lats) + 0.4,
                          lonMin: Math.min(...lons) - 0.4,
                          lonMax: Math.max(...lons) + 0.4,
                        })
                      );
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <circle cx={c.x} cy={c.y} r={r} fill="#16A34A" fillOpacity={0.88} stroke="white" strokeWidth={2} />
                  <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="white">
                    {c.mandis.length}
                  </text>
                </g>
              );
            }

            const m = c.mandis[0];
            const isSel = selectedMandi?.id === m.id;

            return (
              <g
                key={c.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!movedRef.current) {
                    goMandi(m);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {isSel ? (
                  <>
                    {/* Subtle continuous ripple-wave animation around selected pin (small radius) */}
                    <g pointerEvents="none">
                      {/* Ground contact shadow */}
                      <ellipse cx={c.x} cy={c.y + 0.5} rx={4.5} ry={1.6} fill="#052B20" fillOpacity={0.28} />

                      {/* Small radius ripple wave 1 */}
                      <circle cx={c.x} cy={c.y} r={3} fill="none" stroke="#087F63" strokeWidth={1.2}>
                        <animate attributeName="r" values="2.5;7.5" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" values="0.75;0" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="stroke-width" values="1.2;0.3" dur="1.8s" repeatCount="indefinite" />
                      </circle>

                      {/* Small radius ripple wave 2 */}
                      <circle cx={c.x} cy={c.y} r={2} fill="#087F63">
                        <animate attributeName="r" values="2;5.5" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
                        <animate attributeName="fill-opacity" values="0.35;0" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
                      </circle>
                    </g>

                    {/* Distinct Selected Zarai Mandi Pin Marker */}
                    <g transform={`translate(${c.x}, ${c.y})`}>
                      <defs>
                        <filter id={`pinGlow-${m.id}`} x="-40%" y="-40%" width="180%" height="180%">
                          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#044D3C" floodOpacity="0.45" />
                        </filter>
                      </defs>
                      <path
                        d="M 0 0 C -2.2 -2.8 -6.5 -7.2 -6.5 -11.5 C -6.5 -15.2 -3.6 -18 0 -18 C 3.6 -18 6.5 -15.2 6.5 -11.5 C 6.5 -7.2 2.2 -2.8 0 0 Z"
                        fill="#087F63"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                        filter={`url(#pinGlow-${m.id})`}
                      />
                      <circle cx={0} cy={-11.5} r={2.6} fill="#FFFFFF" />
                      <circle cx={0} cy={-11.5} r={1.3} fill="#087F63" />
                    </g>
                  </>
                ) : (
                  <>
                    {/* Normal Unselected Zarai Mandi Location Pin */}
                    <ellipse cx={c.x} cy={c.y + 0.4} rx={2.8} ry={1} fill="#052B20" fillOpacity={0.16} />
                    <g transform={`translate(${c.x}, ${c.y})`}>
                      <path
                        d="M 0 0 C -1.4 -1.8 -4.2 -4.8 -4.2 -7.5 C -4.2 -9.8 -2.3 -11.5 0 -11.5 C 2.3 -11.5 4.2 -9.8 4.2 -7.5 C 4.2 -4.8 1.4 -1.8 0 0 Z"
                        fill="#16A34A"
                        stroke="#FFFFFF"
                        strokeWidth={0.9}
                      />
                      <circle cx={0} cy={-7.5} r={1.4} fill="#FFFFFF" />
                    </g>
                  </>
                )}
              </g>
            );
          })}

          {/* Collision-free Mandi Labels */}
          {labels.map((l) => (
            <g key={l.key} pointerEvents="none">
              {l.selected ? (
                <>
                  <rect
                    x={l.x - 2}
                    y={l.y - 8}
                    width={l.text.length * 6 + 14}
                    height={16}
                    rx={8}
                    fill="#087F63"
                    stroke="#FFFFFF"
                    strokeWidth={1}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                  />
                  <text
                    x={l.x + 5}
                    y={l.y + 3.5}
                    fontSize={9}
                    fontWeight={800}
                    fill="#FFFFFF"
                  >
                    {l.text}
                  </text>
                </>
              ) : (
                <text
                  x={l.x}
                  y={l.y + 2}
                  fontSize={8}
                  fontWeight={700}
                  fill="#183B34"
                  stroke="#FFFFFF"
                  strokeWidth={2.2}
                  paintOrder="stroke"
                >
                  {l.text}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Floating Zoom / Reset FABs */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
          <button
            onClick={goCountry}
            aria-label="Overview"
            className="w-8 h-8 rounded-full bg-white shadow-md border border-emerald-100 flex items-center justify-center text-emerald-800 hover:bg-emerald-50 active:scale-90 transition-transform"
            title="Overview"
          >
            <Layers size={14} />
          </button>
          <button
            onClick={() => zoomBy(0.65)}
            aria-label="Zoom in"
            className="w-8 h-8 rounded-full bg-white shadow-md border border-emerald-100 flex items-center justify-center text-emerald-800 hover:bg-emerald-50 active:scale-90 transition-transform"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => zoomBy(1.5)}
            aria-label="Zoom out"
            className="w-8 h-8 rounded-full bg-white shadow-md border border-emerald-100 flex items-center justify-center text-emerald-800 hover:bg-emerald-50 active:scale-90 transition-transform"
          >
            <Minus size={14} />
          </button>
        </div>
      </div>

      {/* ── MandiDetailSheet matching user screenshot exactly ── */}
      {selectedMandi && (() => {
        const f = makeFmt(lang);
        const mandiKey = (selectedMandi.name || "").toLowerCase().replace(/\s*(mandi|منڈی)$/i, "").trim();
        const mandiCityKey = (selectedMandi.city || "").toLowerCase().replace(/\s*(mandi|منڈی)$/i, "").trim();
        const mandiRecords = records.filter(
          (r) =>
            (r.mandiName || "").toLowerCase().replace(/\s*(mandi|منڈی)$/i, "").trim() === mandiKey ||
            (r.mandiName || "").toLowerCase().replace(/\s*(mandi|منڈی)$/i, "").trim() === mandiCityKey
        );
        const dominantRate = mandiRecords[0]?.rateType || "Mandi Rate";
        const allMarketRows: MarketRow[] = records.map((r, i) => ({
          id: r.id || `${r.mandiName}-${r.rateType}-${r.date || i}`,
          mandiName: r.mandiName,
          rateType: r.rateType,
          min: r.min,
          max: r.max,
          arrival: typeof r.arrival === "number" ? r.arrival : parseInt(String(r.arrival || "").replace(/,/g, ""), 10) || 0,
          date: r.date || TIMELINE[TIMELINE.length - 1],
          district: r.district || selectedMandi.district || "",
          province: r.province || selectedMandi.province || "",
          quality: r.quality || "",
          newOld: r.newOld || "",
          variety: r.variety || "",
          color: r.color || "",
          origin: r.origin || "",
          moisture: r.moisture || "",
          spec: r.spec || "",
          arrivalUnit: r.arrivalUnit || "",
        }));
        const datesWithData = mandiRecords.map((r) => r.date).filter(Boolean).sort();
        const latestDate = datesWithData[datesWithData.length - 1] || TIMELINE[TIMELINE.length - 1];

        return (
          <MandiDetailSheet
            f={f}
            t={(s) => s}
            tm={(s) => s}
            tr={(s) => s}
            byproductName={activeCommodity}
            byproductIcon={activeCommodity}
            mandiName={selectedMandi.name}
            initialRate={dominantRate}
            allRows={allMarketRows}
            dates={TIMELINE}
            date={latestDate}
            onClose={() => setView({ level: "country", province: null, mandi: null })}
            onListen={(text) => speakText(text)}
            onSetLocation={() => setView({ level: "country", province: null, mandi: null })}
          />
        );
      })()}
    </div>
  );
}