// Client for the Zarai Mandi market-data API (Postgres-backed, see
// zarai-mandi/api/). Replaces the old build-time bundled dataset in
// src/data/realCommodityData.ts with live, on-demand queries.

const API_BASE = (import.meta.env.VITE_MARKET_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8090";

export interface CardSpecialAttr {
  type: "moisture" | "newOld" | "color" | "variety" | "spec" | "origin";
  value: string;
  isDeclaredRule?: boolean;
}

export interface CardStats {
  catalogId: number;
  hasData: boolean;
  product: string; // division, e.g. "Wheat"
  byproduct: string;
  mostOccurringRateType: string;
  otherRateTypesCount: number;
  allRateTypes: string[];
  avgMin: number;
  avgMax: number;
  totalArrival: number;
  markets: number;
  specialAttr: CardSpecialAttr | null;
}

export interface ByProductCatalogRow {
  id: number;
  division: string;
  by_product: string;
  product: string | null;
  matched_by_product: string | null;
  display_name: string;
  record_count: number;
  day_count: number;
  small_sample: boolean;
  has_data: boolean;
  moisture_rule_band: string | null;
}

export interface MarketRecord {
  id: string;
  record_date: string;
  price_type: string;
  province: string;
  district: string;
  station: string;
  origin: string | null;
  variety: string | null;
  color: string | null;
  minimum: string;
  maximum: string;
  arrivals: string | null;
  arrivals_unit: string | null;
  arrival_weight_kg: string | null;
  moisture_raw: string | null;
  new_old: string | null;
  specification: string | null;
  quality: string | null;
}

export interface TrendPoint {
  date: string;
  avgMin: number;
  avgMax: number;
  marketCount: number;
}

export interface RecordFilters {
  priceType?: string;
  color?: string;
  newOld?: string;
  origin?: string;
  variety?: string;
  specification?: string;
  quality?: string;
}

export interface LocationFilter {
  date?: string;
  locationKind?: "pakistan" | "province" | "district" | "mandi";
  locationLabel?: string;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Market API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// Small in-memory cache: the dataset is a fixed one-month snapshot, so
// repeat visits to the same screen within a session should be instant,
// not re-fetched.
const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    const p = loader().catch((err) => {
      cache.delete(key); // don't poison the cache with a failed request
      throw err;
    });
    cache.set(key, p);
  }
  return cache.get(key) as Promise<T>;
}

export function fetchVerticalCardStats(division: string, opts: LocationFilter = {}): Promise<CardStats[]> {
  const query = qs({ date: opts.date, locationKind: opts.locationKind, locationLabel: opts.locationLabel });
  return cached(`card-stats:${division}:${query}`, () =>
    getJson<CardStats[]>(`/api/verticals/${encodeURIComponent(division)}/card-stats${query}`)
  );
}

export function fetchByProducts(division?: string): Promise<ByProductCatalogRow[]> {
  const query = qs({ division });
  return cached(`by-products:${query}`, () => getJson<ByProductCatalogRow[]>(`/api/by-products${query}`));
}

export function fetchAllRecords(
  byProductId: number,
  filters: RecordFilters = {}
): Promise<{ rows: MarketRecord[]; total: number }> {
  const query = qs(filters);
  return cached(`all-records:${byProductId}:${query}`, () =>
    getJson(`/api/by-products/${byProductId}/all-records${query}`)
  );
}

export function fetchRecords(
  byProductId: number,
  filters: RecordFilters = {},
  page = 1,
  pageSize = 50
): Promise<{ rows: MarketRecord[]; total: number; page: number; pageSize: number }> {
  const query = qs({ ...filters, page, pageSize });
  // not cached: paginated and filter-heavy, and the table screen wants fresh reads
  return getJson(`/api/by-products/${byProductId}/records${query}`);
}

export function fetchTrend(
  byProductId: number,
  filters: RecordFilters = {}
): Promise<{ byProductId: number; priceType: string | null; points: TrendPoint[] }> {
  const query = qs(filters);
  return cached(`trend:${byProductId}:${query}`, () =>
    getJson(`/api/by-products/${byProductId}/trend${query}`)
  );
}

export interface TrendAllPoint extends TrendPoint {
  totalArrival: number;
}

export function fetchTrendAll(
  byProductId: number,
  filters: RecordFilters & LocationFilter = {}
): Promise<{ byProductId: number; byRateType: Record<string, TrendAllPoint[]> }> {
  const query = qs({ ...filters, date: undefined });
  return cached(`trend-all:${byProductId}:${query}`, () =>
    getJson(`/api/by-products/${byProductId}/trend-all${query}`)
  );
}
