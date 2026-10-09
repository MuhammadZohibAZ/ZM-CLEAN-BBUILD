/**
 * Road routing for the mandi map's "How far is this mandi from me?".
 *
 * Asks an OSRM-compatible routing server (road graph + Contraction
 * Hierarchies, the approach Uber historically used) for the fastest driving
 * route, and returns its road distance, drive time and line. The server is
 * VITE_ROUTING_URL; it defaults to the public OSRM demo server, which is for
 * light/demo use only — point VITE_ROUTING_URL at a self-hosted OSRM (built
 * from the Pakistan OpenStreetMap extract) before release.
 */

const ROUTING_URL =
  (import.meta.env.VITE_ROUTING_URL as string | undefined)?.replace(/\/$/, "") || "https://router.project-osrm.org";

export type LngLat = [number, number];
export type Point = { lat: number; lon: number };

export type RoadRoute = {
  /** Road distance along the route, km. */
  km: number;
  /** Typical drive time, minutes (no live traffic). */
  minutes: number;
  /** Route line, [lon, lat] pairs. */
  coordinates: LngLat[];
};

const cache = new Map<string, RoadRoute>();
// ~100 m: small GPS jitter reuses the same route.
const keyOf = (from: Point, to: Point) =>
  [from.lat, from.lon, to.lat, to.lon].map((v) => v.toFixed(3)).join(",");

/** Fastest driving route from `from` to `to`, or null when no road route is found. */
export async function fetchRoadRoute(from: Point, to: Point, signal?: AbortSignal): Promise<RoadRoute | null> {
  const key = keyOf(from, to);
  const hit = cache.get(key);
  if (hit) return hit;
  const url =
    `${ROUTING_URL}/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}` +
    `?overview=full&geometries=geojson&alternatives=false&steps=false`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Routing failed (${res.status})`);
  const data = (await res.json()) as {
    code: string;
    routes?: { distance: number; duration: number; geometry: { coordinates: LngLat[] } }[];
  };
  const r = data.code === "Ok" ? data.routes?.[0] : undefined;
  if (!r) return null;
  const route = { km: r.distance / 1000, minutes: r.duration / 60, coordinates: r.geometry.coordinates };
  cache.set(key, route);
  return route;
}

/** Straight-line distance in km (haversine) — the fallback when no road route is available. */
export function straightKm(a: Point, b: Point) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
