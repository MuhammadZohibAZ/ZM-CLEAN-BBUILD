"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import maplibregl, { type LngLatBoundsLike, type Map as MLMap, type Marker } from "maplibre-gl";
import type { FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";

import { MandiDetailSheet } from "../customer-face/screens/product-rates/MandiDetailSheet";
import { makeFmt } from "../customer-face/screens/product-rates/format";
import type { MarketRow } from "../customer-face/screens/product-rates/types";
import { TIMELINE } from "../customer-face/screens/product-rates/useMarketData";
import outlineGeo from "../customer-face/shared/data/geo/pakistanOutline.json";
import provincesGeo from "../customer-face/shared/data/geo/pakistanProvinces.json";
import stationCoords from "../customer-face/shared/data/geo/stationCoords.json";
import { useLang } from "../customer-face/shared/i18n/LangProvider";
import { speakText } from "../customer-face/shared/voice";
import MapLoader from "./MapLoader";
import type { MapByProductRecord } from "./ZaraiMandiMap";

/**
 * Real, zoomable map of Pakistan's mandis (MapLibre GL + OpenFreeMap tiles).
 *
 *  - Pakistan only: the rest of the world is masked and the camera is kept
 *    within Pakistan; province borders come from geoBoundaries.
 *  - A pin per mandi that reported on `day`, placed from GeoNames coordinates
 *    (shared/data/geo). With `colorKey`, each pin is a small pie of that
 *    mandi's values for the attribute (e.g. New / Old), with a legend.
 *  - Search flies to a mandi; the bottom cards list the reporting mandis;
 *    "Details" opens the same mandi detail sheet as the rest of the screen.
 */

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const PK_BOUNDS: LngLatBoundsLike = [
  [60.8, 23.6],
  [77.9, 37.1],
];
// Generous in latitude: on a tall phone the camera must be able to show all
// of Pakistan's width without maxBounds forcing a closer zoom.
const MAX_BOUNDS: LngLatBoundsLike = [
  [52.0, 6.0],
  [87.0, 52.0],
];
const PROVINCE_LABELS: Record<string, [number, number]> = {
  Punjab: [72.6, 30.9],
  Sindh: [68.8, 26.1],
  "Khyber Pakhtunkhwa": [71.9, 34.4],
  Balochistan: [65.9, 28.3],
  "Gilgit-Baltistan": [75.0, 35.9],
  "Azad Kashmir": [73.75, 33.95],
};
const PALETTE = ["#0B5E4A", "#D97706", "#2563EB", "#9333EA", "#DC2626", "#0891B2", "#65A30D", "#DB2777"];
const BRAND = "#0B5E4A";

type Coord = { lat: number; lon: number; station: string; district: string; province: string };
const COORDS = stationCoords as unknown as Record<string, Coord>;

const normKey = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/\b(city|mandi|cantt|cantonment|tehsil|district)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");

/** Straight-line distance in km (haversine). */
function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Pin labels only change at these zooms, so zooming doesn't re-render React every frame. */
const zoomBucket = (z: number) => (z >= 7 ? 2 : z >= 6 ? 1 : 0);

type Pin = {
  key: string;
  name: string;
  district: string;
  province: string;
  lat: number;
  lon: number;
  min: number;
  max: number;
  mid: number;
  arrival: number;
  values: { value: string; count: number }[];
};

export type MandiMapGLProps = {
  onClose?: () => void;
  /** Rows to pin (already filtered by the screen). */
  records: MapByProductRecord[];
  /** Pins show mandis reporting on this day (default: latest day in records). */
  day?: string;
  /** Colour pins by this attribute's values (the "all values" view). */
  colorKey?: keyof MapByProductRecord;
  commodity?: string;
  focusMandiName?: string;
  focusProvinceName?: string;
  /** Extra controls shown under the search bar (e.g. selection / all switch). */
  header?: ReactNode;
};

export default function MandiMapGL({
  onClose,
  records,
  day,
  colorKey,
  commodity = "",
  focusMandiName,
  focusProvinceName,
  header,
}: MandiMapGLProps) {
  const { lang, tc, tm, tr } = useLang();
  const isUr = lang === "ur";
  const f = useMemo(() => makeFmt(lang), [lang]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; el: HTMLButtonElement }>>(new Map());
  const cardsRef = useRef<HTMLDivElement>(null);
  // `ready`: the map exists (pins are DOM markers and need nothing else).
  // Our boundary layers wait for the style separately.
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(0); // label bucket, see zoomBucket()
  // Loading screen: until the map's first render (or 8 s / an error).
  const [loaded, setLoaded] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  // "How far?" — asked only when the user taps it.
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [locState, setLocState] = useState<"idle" | "asking" | "denied">("idle");
  const [distanceFor, setDistanceFor] = useState<string | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detailFor, setDetailFor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [offline, setOffline] = useState(false);

  // ── Data: the day's pins ─────────────────────────────────────────
  const latestDay = useMemo(() => records.reduce((m, r) => (r.date && r.date > m ? r.date : m), ""), [records]);
  const dayKey = day && records.some((r) => r.date === day) ? day : latestDay;
  const dayRecords = useMemo(() => records.filter((r) => r.date === dayKey), [records, dayKey]);

  const { pins, unknown, legend } = useMemo(() => {
    const byKey = new Map<string, MapByProductRecord[]>();
    for (const r of dayRecords) {
      const k = normKey(r.mandiName);
      const list = byKey.get(k) ?? [];
      list.push(r);
      byKey.set(k, list);
    }
    const valueCounts = new Map<string, number>();
    const pins: Pin[] = [];
    const unknown: string[] = [];
    for (const [k, rs] of byKey) {
      const c = COORDS[k];
      const name = (rs[0].mandiName || "").replace(/\s*mandi$/i, "").trim();
      if (!c) {
        unknown.push(name);
        continue;
      }
      const mins = rs.map((r) => r.min).filter((v) => v > 0);
      const maxs = rs.map((r) => r.max).filter((v) => v > 0);
      const values = new Map<string, number>();
      if (colorKey) {
        for (const r of rs) {
          const v = String(r[colorKey] ?? "").trim() || "—";
          values.set(v, (values.get(v) ?? 0) + 1);
          valueCounts.set(v, (valueCounts.get(v) ?? 0) + 1);
        }
      }
      const min = mins.length ? Math.min(...mins) : 0;
      const max = maxs.length ? Math.max(...maxs) : 0;
      pins.push({
        key: k,
        name,
        district: rs[0].district || c.district,
        province: rs[0].province || c.province,
        lat: c.lat,
        lon: c.lon,
        min,
        max,
        mid: rs.reduce((a, r) => a + (r.min + r.max) / 2, 0) / rs.length,
        arrival: rs.reduce((a, r) => a + (Number(r.arrival) || 0), 0),
        values: [...values].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
      });
    }
    pins.sort((a, b) => b.mid - a.mid);
    const legend = [...valueCounts]
      .sort((a, b) => b[1] - a[1])
      .map(([value], i) => ({ value, color: PALETTE[i % PALETTE.length] }));
    return { pins, unknown, legend };
  }, [dayRecords, colorKey]);

  const colorOf = (v: string) => legend.find((l) => l.value === v)?.color ?? BRAND;
  const pieOf = (p: Pin) => {
    if (!colorKey || p.values.length === 0) return BRAND;
    const total = p.values.reduce((a, v) => a + v.count, 0);
    let acc = 0;
    const stops = p.values.map((v) => {
      const from = (acc / total) * 360;
      acc += v.count;
      return `${colorOf(v.value)} ${from}deg ${(acc / total) * 360}deg`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  };

  // ── Map setup ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      bounds: PK_BOUNDS,
      fitBoundsOptions: { padding: { top: 150, bottom: 175, left: 16, right: 56 } },
      maxBounds: MAX_BOUNDS,
      minZoom: 3.2,
      maxZoom: 13,
      // Light on low-end phones: cap the pixel density, no tile fade-in,
      // no repeated worlds, fewer cached tiles.
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      fadeDuration: 0,
      renderWorldCopies: false,
      refreshExpiredTiles: false,
      maxTileCacheSize: 60,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: { compact: true, customAttribution: "Locations © GeoNames · Borders © geoBoundaries" },
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    setReady(true);

    map.on("error", (e) => {
      // Basemap tiles unreachable (offline): keep our own layers on a plain background.
      if (String(e?.error?.message || "").match(/fetch|network|Failed/i)) {
        setOffline(true);
        setLoaded(true);
      }
    });
    map.once("load", () => setLoaded(true));
    const loaderTimeout = window.setTimeout(() => setLoaded(true), 8000);
    map.on("zoom", () => {
      const b = zoomBucket(map.getZoom());
      setZoom((prev) => (prev === b ? prev : b));
    });
    // "style.load" (not "load"): our layers and pins only need the style,
    // not the first tiles, so they appear immediately on slow connections.
    map.once("style.load", () => {
      for (const id of ["boundary_2", "boundary_3", "boundary_disputed", "label_country_1", "label_country_2", "label_country_3", "label_state"]) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
      }
      // Lighter rendering: no shaded relief or buildings.
      for (const l of map.getStyle().layers) {
        if (l.id === "building" || ("source" in l && l.source === "ne2_shaded")) map.setLayoutProperty(l.id, "visibility", "none");
      }
      const geo = provincesGeo as unknown as FeatureCollection<Polygon | MultiPolygon>;
      // Mask: the world with Pakistan's outline cut out (one clean ring).
      const outline = (outlineGeo as unknown as { geometry: Polygon }).geometry.coordinates[0];
      map.addSource("pk-mask", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [[[-179, -84], [179, -84], [179, 84], [-179, 84], [-179, -84]], outline] },
        },
      });
      map.addSource("pk-outline", { type: "geojson", data: outlineGeo as unknown as FeatureCollection });
      map.addSource("pk-provinces", { type: "geojson", data: geo });
      map.addSource("pk-labels", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: Object.entries(PROVINCE_LABELS).map(([name, c]) => ({
            type: "Feature",
            properties: { name: name === "Khyber Pakhtunkhwa" ? "Khyber Pakhtunkhwa" : name },
            geometry: { type: "Point", coordinates: c },
          })),
        },
      });
      const firstLabel = map.getStyle().layers.find((l) => l.type === "symbol")?.id;
      map.addLayer({ id: "pk-fill", type: "fill", source: "pk-provinces", paint: { "fill-color": "#0B5E4A", "fill-opacity": 0.035 } }, firstLabel);
      // Above every basemap layer, so foreign labels are covered too.
      map.addLayer({ id: "pk-mask", type: "fill", source: "pk-mask", paint: { "fill-color": "#E6EEEA", "fill-opacity": 0.96 } });
      map.addLayer({
        id: "pk-border",
        type: "line",
        source: "pk-provinces",
        paint: { "line-color": "#7FA897", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.6, 9, 1.6], "line-dasharray": [3, 2] },
      });
      map.addLayer({
        id: "pk-outline",
        type: "line",
        source: "pk-outline",
        paint: { "line-color": "#3E7A66", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.4, 9, 2.6] },
      });
      map.addLayer({
        id: "pk-province-label",
        type: "symbol",
        source: "pk-labels",
        maxzoom: 7.2,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 10, 7, 13],
          "text-letter-spacing": 0.08,
          "text-transform": "uppercase",
        },
        paint: { "text-color": "#5E8F7E", "text-halo-color": "#FFFFFF", "text-halo-width": 1.4, "text-opacity": 0.85 },
      });
    });
    return () => {
      window.clearTimeout(loaderTimeout);
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      setReady(false);
    };
  }, []);

  // ── Pins (HTML markers) ──────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const existing = markersRef.current;
    for (const { marker } of existing.values()) marker.remove();
    existing.clear();
    for (const p of pins) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "zm-map-pin";
      el.setAttribute("aria-label", `${p.name}: ${Math.round(p.min)}–${Math.round(p.max)}`);
      el.innerHTML = `<span class="zm-map-pin-dot"></span><span class="zm-map-pin-label"></span>`;
      (el.querySelector(".zm-map-pin-dot") as HTMLElement).style.background = pieOf(p);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        // Tapping the selected pin again clears the selection.
        setSelected((cur) => (cur === p.key ? null : p.key));
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([p.lon, p.lat]).addTo(map);
      existing.set(p.key, { marker, el });
    }
  }, [pins, ready, legend]);

  // Labels follow zoom and selection.
  useEffect(() => {
    for (const p of pins) {
      const m = markersRef.current.get(p.key);
      if (!m) continue;
      const isSel = p.key === selected;
      m.el.dataset.selected = isSel ? "1" : "0";
      const label = m.el.querySelector(".zm-map-pin-label") as HTMLElement;
      const showPrice = zoom >= 1 || isSel;
      label.textContent = showPrice ? `${isSel || zoom >= 2 ? `${tm(p.name)} · ` : ""}${f.num(p.min)}–${f.num(p.max)}` : "";
      m.el.dataset.show = showPrice ? "1" : "0";
      m.marker.getElement().style.zIndex = isSel ? "10" : "1";
    }
  }, [pins, zoom, selected, f, tm, ready, legend]);

  // ── Focus: on open, and again whenever the Location filter changes ─
  const lastFocus = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const key = `${focusMandiName ?? ""}|${focusProvinceName ?? ""}`;
    if (key === lastFocus.current) return;
    const first = lastFocus.current === null;
    lastFocus.current = key;
    const duration = first ? 0 : 900;
    if (!focusMandiName && !focusProvinceName) {
      if (!first) map.fitBounds(PK_BOUNDS, { padding: { top: 150, bottom: 175, left: 16, right: 56 }, duration });
      return;
    }
    if (focusMandiName) {
      const c = COORDS[normKey(focusMandiName)];
      if (c) {
        map.easeTo({ center: [c.lon, c.lat], zoom: 8.5, duration });
        setSelected(normKey(focusMandiName));
        return;
      }
    }
    if (focusProvinceName) {
      const ft = (provincesGeo as unknown as FeatureCollection).features.find(
        (x) => (x.properties as { dbName?: string; name?: string }).dbName === focusProvinceName || (x.properties as { name?: string }).name === focusProvinceName,
      );
      if (ft) {
        const pts: number[][] = [];
        const g = ft.geometry as Polygon | MultiPolygon;
        (g.type === "Polygon" ? [g.coordinates] : g.coordinates).forEach((poly) => poly[0].forEach((pt) => pts.push(pt)));
        const lons = pts.map((p) => p[0]);
        const lats = pts.map((p) => p[1]);
        map.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: { top: 150, bottom: 175, left: 16, right: 56 }, duration },
        );
      }
    }
  }, [ready, focusMandiName, focusProvinceName]);

  // Fade the loading screen out, then unmount it (its animations stop).
  useEffect(() => {
    if (!loaded) return;
    const t = window.setTimeout(() => setShowLoader(false), 400);
    return () => window.clearTimeout(t);
  }, [loaded]);

  // ── "How far?" ───────────────────────────────────────────────────
  const showDistance = (key: string) => {
    setDistanceFor(key);
    if (userLoc) return;
    if (!navigator.geolocation) {
      setLocState("denied");
      return;
    }
    setLocState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocState("idle");
      },
      () => setLocState("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };
  // Your position and a dashed line to the mandi, framed together.
  useEffect(() => {
    const map = mapRef.current;
    const pin = pins.find((p) => p.key === distanceFor);
    if (!map || !userLoc) return;
    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "zm-map-me";
      userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([userLoc.lon, userLoc.lat]).addTo(map);
    }
    if (!pin) return;
    const line = {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: [[userLoc.lon, userLoc.lat], [pin.lon, pin.lat]] },
    };
    // The line needs the style; on a slow connection add it once the style is ready.
    const drawLine = () => {
      const src = map.getSource("zm-distance") as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(line);
      else {
        map.addSource("zm-distance", { type: "geojson", data: line });
        map.addLayer({ id: "zm-distance", type: "line", source: "zm-distance", paint: { "line-color": "#2563EB", "line-width": 2.5, "line-dasharray": [2, 1.5] } });
      }
    };
    if (map.isStyleLoaded()) drawLine();
    else map.once("idle", drawLine);
    map.fitBounds(
      [
        [Math.min(userLoc.lon, pin.lon), Math.min(userLoc.lat, pin.lat)],
        [Math.max(userLoc.lon, pin.lon), Math.max(userLoc.lat, pin.lat)],
      ],
      { padding: { top: 170, bottom: 200, left: 50, right: 70 }, maxZoom: 9, duration: 900 },
    );
  }, [userLoc, distanceFor, pins]);

  // Selecting a pin flies there and brings its card into view.
  const flyTo = (key: string) => {
    const p = pins.find((x) => x.key === key);
    const map = mapRef.current;
    if (!p || !map) return;
    map.flyTo({ center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 8), padding: { top: 140, bottom: 190, left: 0, right: 0 }, speed: 1.4 });
  };
  useEffect(() => {
    if (!selected) return;
    const card = cardsRef.current?.querySelector<HTMLElement>(`[data-pin="${selected}"]`);
    if (card && cardsRef.current) {
      const row = cardsRef.current;
      row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.clientWidth) / 2, behavior: "smooth" });
    }
  }, [selected]);

  const fitPakistan = () => mapRef.current?.fitBounds(PK_BOUNDS, { padding: { top: 150, bottom: 175, left: 16, right: 56 } });
  const locateMe = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 8 });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  // ── Search ───────────────────────────────────────────────────────
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pins.filter((p) => p.name.toLowerCase().includes(q) || tm(p.name).includes(query.trim()) || p.district.toLowerCase().includes(q)).slice(0, 6);
  }, [query, pins, tm]);

  // ── Detail sheet rows (same shape the rates screen uses) ─────────
  const detailRows: MarketRow[] = useMemo(
    () =>
      records.map((r, i) => ({
        id: r.id || `${r.mandiName}-${r.rateType}-${r.date || i}`,
        mandiName: r.mandiName,
        rateType: r.rateType,
        min: r.min,
        max: r.max,
        arrival: typeof r.arrival === "number" ? r.arrival : parseInt(String(r.arrival || "").replace(/,/g, ""), 10) || 0,
        date: r.date || TIMELINE[TIMELINE.length - 1],
        district: r.district || "",
        province: r.province || "",
        quality: r.quality || "",
        newOld: r.newOld || "",
        variety: r.variety || "",
        color: r.color || "",
        origin: r.origin || "",
        moisture: r.moisture || "",
        spec: r.spec || "",
        arrivalUnit: r.arrivalUnit || "",
      })),
    [records],
  );
  const detailPin = pins.find((p) => p.key === detailFor);
  const font = isUr ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', sans-serif" : "inherit";

  const roundBtn = (label: string, onClick: () => void, icon: ReactNode) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex items-center justify-center transition active:scale-90"
      style={{ width: 40, height: 40, background: "#FFFFFF", color: "#183B34" }}
    >
      {icon}
    </button>
  );

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#E8EFEB", fontFamily: font }}>
      <style>{PIN_CSS}</style>
      {showLoader && (
        <div style={{ position: "absolute", inset: 0, zIndex: 30, opacity: loaded ? 0 : 1, transition: "opacity 0.35s ease", pointerEvents: loaded ? "none" : "auto" }}>
          <MapLoader lang={lang === "ur" ? "ur" : "en"} title={isUr ? `${tc(commodity)} کا نقشہ لوڈ ہو رہا ہے` : `Loading ${commodity} map`} />
        </div>
      )}
      {/* Inline position: maplibre-gl.css sets .maplibregl-map { position: relative }. */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* ── Top: close + search, then header (switch), legend, day ── */}
      <div className="absolute inset-x-0 top-0 flex flex-col gap-2 px-3 pt-3" style={{ zIndex: 5, pointerEvents: "none" }}>
        <div className="flex items-center gap-2" style={{ pointerEvents: "auto" }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={isUr ? "واپس" : "Back"}
              className="flex-shrink-0 flex items-center justify-center rounded-full transition active:scale-90"
              style={{ width: 44, height: 44, background: "#FFFFFF", boxShadow: SHADOW }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#183B34" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={isUr ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
              </svg>
            </button>
          )}
          <div className="relative flex-1 min-w-0">
            <label className="flex items-center gap-2 rounded-full px-4" style={{ height: 44, background: "#FFFFFF", boxShadow: SHADOW }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l5 5" />
              </svg>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                placeholder={isUr ? `${tc(commodity)} کی منڈی تلاش کریں` : `Search ${commodity} mandis`}
                className="flex-1 min-w-0 bg-transparent outline-none"
                style={{ fontSize: 14.5, fontWeight: 600, color: "#183B34", fontFamily: font }}
              />
            </label>
            {searchOpen && query.trim() && (
              <div className="absolute inset-x-0 mt-2 overflow-hidden rounded-2xl" style={{ background: "#FFFFFF", boxShadow: SHADOW, top: "100%" }}>
                {results.length === 0 ? (
                  <p style={{ padding: "12px 16px", fontSize: 13, color: "#6B7C76", fontWeight: 600 }}>{isUr ? "کوئی منڈی نہیں ملی" : "No mandi found"}</p>
                ) : (
                  results.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQuery("");
                        setSearchOpen(false);
                        setSelected(p.key);
                        flyTo(p.key);
                      }}
                      className="w-full flex items-center justify-between gap-2 text-start"
                      style={{ padding: "10px 16px", borderBottom: "1px solid #EEF3F0" }}
                    >
                      <span className="min-w-0">
                        <span className="block truncate" style={{ fontSize: 14, fontWeight: 700, color: "#183B34" }}>{tm(p.name)}</span>
                        <span className="block truncate" style={{ fontSize: 11.5, fontWeight: 600, color: "#6B7C76" }}>
                          {tm(p.district)} · {tm(p.province)}
                        </span>
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: "#087F63", direction: "ltr" }}>
                        {f.num(p.min)}–{f.num(p.max)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {header && <div style={{ pointerEvents: "auto" }}>{header}</div>}

        <div className="flex flex-wrap items-center gap-1.5" style={{ pointerEvents: "auto" }}>
          <span className="rounded-full px-3 py-1" style={{ background: "rgba(255,255,255,0.94)", boxShadow: SHADOW, fontSize: 12, fontWeight: 700, color: "#183B34" }}>
            {f.day(dayKey)} · {f.digits(pins.length)} {isUr ? "منڈیاں" : pins.length === 1 ? "mandi" : "mandis"}
          </span>
          {colorKey &&
            legend.length > 1 &&
            legend.map((l) => (
              <span
                key={l.value}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ background: "rgba(255,255,255,0.94)", boxShadow: SHADOW, fontSize: 12, fontWeight: 700, color: "#183B34" }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 5, background: l.color }} />
                {tr(l.value)}
              </span>
            ))}
        </div>
      </div>

      {/* ── Right: zoom / fit / locate ── */}
      <div
        className="absolute flex flex-col overflow-hidden rounded-2xl"
        // Bottom-right, above the cards: keeps eastern Punjab's pins uncovered.
        style={{ right: 12, bottom: 178, zIndex: 5, boxShadow: SHADOW, background: "#FFFFFF" }}
      >
        {roundBtn(isUr ? "زوم ان" : "Zoom in", () => mapRef.current?.zoomIn(), <span style={{ fontSize: 20, fontWeight: 700 }}>+</span>)}
        <div style={{ height: 1, background: "#EEF3F0" }} />
        {roundBtn(isUr ? "زوم آؤٹ" : "Zoom out", () => mapRef.current?.zoomOut(), <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 0.6 }}>−</span>)}
        <div style={{ height: 1, background: "#EEF3F0" }} />
        {roundBtn(isUr ? "پورا پاکستان" : "Whole Pakistan", fitPakistan, (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#183B34" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        ))}
        <div style={{ height: 1, background: "#EEF3F0" }} />
        {roundBtn(isUr ? "میرا مقام" : "My location", locateMe, (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#183B34" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        ))}
      </div>

      {offline && (
        <div className="absolute inset-x-0 text-center" style={{ top: "50%", zIndex: 4 }}>
          <span className="rounded-full px-3 py-1" style={{ background: "#FFFFFF", fontSize: 12, fontWeight: 700, color: "#6B7C76", boxShadow: SHADOW }}>
            {isUr ? "نقشہ لوڈ نہیں ہو سکا — انٹرنیٹ چیک کریں" : "Map tiles couldn't load — check the connection"}
          </span>
        </div>
      )}

      {/* ── Bottom: reporting mandis ── */}
      <div className="absolute inset-x-0 bottom-0" style={{ zIndex: 5, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {unknown.length > 0 && (
          <p className="px-4 pb-1.5" style={{ fontSize: 11, fontWeight: 600, color: "#52635F", textShadow: "0 1px 2px #fff" }}>
            {isUr ? `${f.digits(unknown.length)} منڈیوں کا مقام نامعلوم` : `${unknown.length} mandi${unknown.length > 1 ? "s" : ""} without a map location: ${unknown.slice(0, 3).join(", ")}${unknown.length > 3 ? "…" : ""}`}
          </p>
        )}
        <div ref={cardsRef} className="flex gap-2.5 overflow-x-auto px-3 pb-1" style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}>
          {pins.length === 0 && (
            <div className="rounded-2xl px-4 py-3" style={{ background: "#FFFFFF", boxShadow: SHADOW, fontSize: 13, fontWeight: 600, color: "#6B7C76" }}>
              {isUr ? "اس دن کوئی رپورٹ نہیں" : "No mandi reported on this day"}
            </div>
          )}
          {pins.map((p) => {
            const on = p.key === selected;
            return (
              <div
                key={p.key}
                data-pin={p.key}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (selected === p.key) {
                    setSelected(null);
                    return;
                  }
                  setSelected(p.key);
                  flyTo(p.key);
                }}
                className="flex-shrink-0 rounded-2xl text-start transition"
                style={{
                  width: 236,
                  padding: "10px 12px",
                  background: "#FFFFFF",
                  border: on ? `2px solid ${BRAND}` : "2px solid transparent",
                  boxShadow: SHADOW,
                  scrollSnapAlign: "center",
                  cursor: "pointer",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate" style={{ fontSize: 15, fontWeight: 800, color: "#143B33" }}>{tm(p.name)}</div>
                    <div className="truncate" style={{ fontSize: 11.5, fontWeight: 600, color: "#6B7C76" }}>
                      {tm(p.district)} · {tm(p.province)}
                    </div>
                  </div>
                  <span className="flex-shrink-0 rounded-full" style={{ width: 14, height: 14, marginTop: 3, background: pieOf(p), boxShadow: "0 0 0 2px #fff, 0 0 0 3px #DCE9E3" }} />
                </div>
                <div className="flex items-end justify-between gap-2" style={{ marginTop: 6 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#087F63", direction: "ltr" }}>
                      {f.num(p.min)}–{f.num(p.max)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7C76" }}>
                      {p.arrival > 0 ? `${f.num(p.arrival)} ${isUr ? "بوریاں" : "bags"}` : isUr ? "آمد رپورٹ نہیں" : "arrival not reported"}
                      {colorKey && p.values.length > 0 && ` · ${p.values.map((v) => tr(v.value)).join(", ")}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailFor(p.key);
                    }}
                    className="flex-shrink-0 rounded-full px-3 py-1.5 transition active:scale-95"
                    style={{ background: on ? BRAND : "#EEF6F2", color: on ? "#FFFFFF" : BRAND, fontSize: 12, fontWeight: 800 }}
                  >
                    {isUr ? "تفصیل" : "Details"}
                  </button>
                </div>
                {on && (
                  <div className="flex items-center gap-1.5" style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #EEF3F0" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="3.5" />
                      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    </svg>
                    {distanceFor === p.key && userLoc ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1E3A8A" }}>
                        {isUr
                          ? `آپ سے تقریباً ${f.num(Math.round(distanceKm(userLoc, p)))} کلومیٹر (سیدھی لکیر)`
                          : `≈ ${f.num(Math.round(distanceKm(userLoc, p)))} km from you (straight line)`}
                      </span>
                    ) : distanceFor === p.key && locState === "asking" ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7C76" }}>{isUr ? "آپ کا مقام معلوم ہو رہا ہے…" : "Finding your location…"}</span>
                    ) : distanceFor === p.key && locState === "denied" ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#B45309" }}>{isUr ? "مقام کی اجازت نہیں ملی" : "Location permission not given"}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDistance(p.key);
                        }}
                        style={{ fontSize: 12, fontWeight: 800, color: "#2563EB" }}
                      >
                        {isUr ? "یہ منڈی مجھ سے کتنی دور ہے؟" : "How far is this mandi from me?"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {detailPin && (
        <MandiDetailSheet
          f={f}
          t={(s) => s}
          tm={tm}
          tr={tr}
          mandiName={`${detailPin.name} Mandi`}
          initialRate={dayRecords.find((r) => normKey(r.mandiName) === detailPin.key)?.rateType || "Mandi Rate"}
          allRows={detailRows}
          dates={TIMELINE}
          date={dayKey}
          onClose={() => setDetailFor(null)}
          onListen={(text) => speakText(text)}
          onSetLocation={() => setDetailFor(null)}
        />
      )}
    </div>
  );
}

const SHADOW = "0 4px 14px rgba(6, 45, 36, 0.16)";

const PIN_CSS = `
/* The marker is exactly the dot, so the dot sits on the mandi's coordinates; the label hangs beside it. */
/* Keep MapLibre's position:absolute on the marker (it is placed by transform);
   overriding it stacks markers in page flow and shifts every later pin. */
.zm-map-pin { position: absolute; width: 16px; height: 16px; background: none; border: none; padding: 0; cursor: pointer; }
.zm-map-pin-dot { position: absolute; inset: 0; border-radius: 50%; border: 2.5px solid #fff; box-shadow: 0 2px 6px rgba(6, 45, 36, 0.35); transition: transform 0.15s ease; }
.zm-map-pin-label { position: absolute; left: 21px; top: 50%; transform: translateY(-50%); display: none; }
.zm-map-pin[data-show="1"] .zm-map-pin-label { display: block; }
.zm-map-pin[data-selected="1"] .zm-map-pin-dot { transform: scale(1.5); box-shadow: 0 0 0 4px rgba(11, 94, 74, 0.25), 0 3px 8px rgba(6, 45, 36, 0.4); }
.zm-map-pin-label { white-space: nowrap; background: #fff; color: #143B33; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 999px; box-shadow: 0 2px 6px rgba(6, 45, 36, 0.18); direction: ltr; }
.zm-map-pin[data-selected="1"] .zm-map-pin-label { background: #0B5E4A; color: #fff; }
.maplibregl-ctrl-attrib { font-size: 10px; }
.zm-map-me { width: 16px; height: 16px; border-radius: 50%; background: #2563EB; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.2), 0 2px 6px rgba(0,0,0,0.3); }
`;
