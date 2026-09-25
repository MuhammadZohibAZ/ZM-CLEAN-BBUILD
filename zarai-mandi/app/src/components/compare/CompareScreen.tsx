import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ZaraiMandiCompare, {
  PRICE_TYPES,
  type AttributeDefinition,
  type Category,
  type LocationPickerProps,
  type MarketLocation,
  type MarketRow,
  type PriceType,
} from "./ZaraiMandiCompare";
import { fetchCompareCatalog, fetchCompareRecords, type CompareCatalog, type CompareRecords } from "../../lib/api";

/**
 * Live-data adapter for the Compare tab: loads the catalogue once, then each
 * selected product's raw observations on demand, and maps both into the
 * compare module's props.
 */

// The app refers to icons as "/src/icons/..." paths (see getproductIconSrc in
// CustomerFaceApp). Resolve them through Vite so they also work in production.
// Lazy: only the ~20 division icons actually shown are loaded, not all 149.
const iconLoaders = import.meta.glob("/src/icons/**/*.png", { query: "?url", import: "default" }) as Record<
  string,
  () => Promise<string>
>;
async function resolveIcons(paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const urls = await Promise.all(unique.map((p) => (iconLoaders[p] ? iconLoaders[p]().catch(() => p) : Promise.resolve(p))));
  return Object.fromEntries(unique.map((p, i) => [p, urls[i]]));
}

/** Matches the app's subscription names ("Sugar") to catalogue divisions ("Sugarcane/Sugar"). */
function ownsDivision(division: string, owned: string[]) {
  const names = division.toLowerCase().split("/").map((n) => n.trim());
  return owned.some((o) => {
    const name = o.toLowerCase().trim();
    return names.includes(name) || division.toLowerCase() === name || names.some((n) => n.replace(/s$/, "") === name.replace(/s$/, ""));
  });
}

const DIVISION_ORDER = ["Wheat", "Rice", "Paddy", "Maize", "Cotton", "Sugarcane/Sugar", "Mustard", "Sesame", "Millet", "Pulses", "Edible Oil"];

const ATTRIBUTE_LABELS: Record<string, string> = {
  origin: "Origin", variety: "Variety", color: "Color", new_old: "New / Old",
  specification: "Specification", quality: "Quality", moisture: "Moisture",
};
const QUALITY_FIELDS = ["origin", "variety", "color", "new_old", "specification", "quality", "moisture"];

const productId = (division: string) => `div:${division}`;
const locationId = (province: string, district: string, station: string) => `${province}|${district}|${station}`;

function toPriceType(raw: string): PriceType | null {
  const name = raw.replace(/\s+Rate$/i, "").trim();
  return (PRICE_TYPES as readonly string[]).includes(name) ? (name as PriceType) : null;
}

function buildCatalog(catalog: CompareCatalog, iconFor: (division: string) => string | undefined): { categories: Category[]; locations: MarketLocation[] } {
  const rank = (name: string) => {
    const i = DIVISION_ORDER.indexOf(name);
    return i < 0 ? DIVISION_ORDER.length : i;
  };
  const categories: Category[] = [...catalog.divisions]
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name))
    .map((division) => {
      return {
        id: productId(division.name),
        name: division.name,
        kind: "product",
        products: [
          {
            id: productId(division.name),
            name: division.name,
            imageUrl: iconFor(division.name),
            byproducts: division.byProducts.map((b) => ({
              id: String(b.id),
              name: b.name,
              attributes: b.attributes
                .filter((a) => ATTRIBUTE_LABELS[a.key])
                .map((a): AttributeDefinition => ({
                  key: a.key,
                  label: ATTRIBUTE_LABELS[a.key],
                  kind: a.key === "moisture" ? "number" : "category",
                  unit: a.key === "moisture" ? "%" : undefined,
                })),
              special: b.special && ATTRIBUTE_LABELS[b.special.key]
                ? {
                    key: b.special.key,
                    label: ATTRIBUTE_LABELS[b.special.key],
                    kind: b.special.key === "moisture" ? ("number" as const) : ("category" as const),
                    unit: b.special.key === "moisture" ? "%" : undefined,
                  }
                : undefined,
            })),
          },
        ],
      };
    });
  const locations = catalog.locations.map((l) => ({
    id: locationId(l.province, l.district, l.station),
    name: l.station,
    province: l.province,
    district: l.district,
  }));
  return { categories, locations };
}

/** Maps raw records to MarketRows, with change vs. the same series' previous report day. */
function buildRows(records: CompareRecords, divisionOf: Map<string, string>): MarketRow[] {
  const col = Object.fromEntries(records.fields.map((f, i) => [f, i]));
  const rows: MarketRow[] = [];
  for (const r of records.rows) {
    const priceType = toPriceType(String(r[col.priceType] ?? ""));
    const byproductId = String(r[col.byProductId]);
    const division = divisionOf.get(byproductId);
    if (!priceType || !division) continue;
    const quality: Record<string, string> = {};
    for (const key of QUALITY_FIELDS) {
      const value = r[col[key]];
      if (value !== null && value !== undefined && String(value).trim()) quality[key] = String(value).trim();
    }
    const kg = r[col.arrivalKg];
    rows.push({
      id: String(r[col.id]),
      productId: productId(division),
      byproductId,
      locationId: locationId(String(r[col.province]), String(r[col.district]), String(r[col.station])),
      priceType,
      minPrice: r[col.min] as number,
      maxPrice: r[col.max] as number,
      unit: "40 kg",
      arrivalMt: typeof kg === "number" ? kg / 1000 : null,
      arrivalScope: "channel",
      quality,
      trendPct: null,
      trendPeriod: "prev. report",
      trendBasis: "max price",
      updatedAt: `${r[col.date]}T12:00:00+05:00`,
    });
  }

  // Series = same byproduct, mandi, channel and quality. Change compares each
  // report's max price with that series' mean max on its previous report day.
  const series = new Map<string, Map<string, MarketRow[]>>();
  for (const row of rows) {
    const key = JSON.stringify([row.byproductId, row.locationId, row.priceType, Object.entries(row.quality ?? {}).sort()]);
    const days = series.get(key) ?? new Map<string, MarketRow[]>();
    const day = row.updatedAt.slice(0, 10);
    days.set(day, [...(days.get(day) ?? []), row]);
    series.set(key, days);
  }
  for (const days of series.values()) {
    const ordered = [...days.keys()].sort();
    for (let i = 1; i < ordered.length; i++) {
      const previous = days.get(ordered[i - 1])!;
      const prevMax = previous.reduce((sum, r) => sum + Number(r.maxPrice), 0) / previous.length;
      if (!prevMax) continue;
      for (const row of days.get(ordered[i])!) {
        row.trendPct = Math.round(((Number(row.maxPrice) - prevMax) / prevMax) * 10000) / 100;
      }
    }
  }
  return rows;
}

const formatDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function CompareScreen({
  productIcon,
  ownedProducts,
  renderLocationPicker,
}: {
  productIcon?: (division: string) => string;
  /** Products the user has paid for (app names, e.g. "Wheat", "Sugar"); only these are offered.
   *  Omit during the free trial: every product is offered. */
  ownedProducts?: string[];
  /** The app's location filter sheet, so Compare picks locations exactly like the product screens. */
  renderLocationPicker?: (props: LocationPickerProps) => ReactNode;
}) {
  const [catalog, setCatalog] = useState<CompareCatalog | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setCatalogError("");
    fetchCompareCatalog()
      .then((c) => active && setCatalog(c))
      .catch(() => active && setCatalogError("The market data service is not reachable."));
    return () => {
      active = false;
    };
  }, [attempt]);

  // Division icon paths → built URLs, resolved once the catalogue is known.
  const [icons, setIcons] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!catalog || !productIcon) return;
    let active = true;
    resolveIcons(catalog.divisions.map((d) => productIcon(d.name))).then((map) => active && setIcons(map));
    return () => {
      active = false;
    };
  }, [catalog]); // eslint-disable-line react-hooks/exhaustive-deps

  const { categories, locations } = useMemo(
    () => (catalog ? buildCatalog(catalog, (division) => (productIcon ? icons[productIcon(division)] : undefined)) : { categories: [], locations: [] }),
    [catalog, icons], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const ownedCategoryIds = useMemo(
    () => (ownedProducts && catalog ? catalog.divisions.filter((d) => ownsDivision(d.name, ownedProducts)).map((d) => productId(d.name)) : undefined),
    [ownedProducts, catalog],
  );
  const divisionOf = useMemo(() => {
    const map = new Map<string, string>();
    catalog?.divisions.forEach((d) => d.byProducts.forEach((b) => map.set(String(b.id), d.name)));
    return map;
  }, [catalog]);

  // Rows are loaded per selected product and kept for the session.
  const loaded = useRef(new Map<string, MarketRow[]>());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [rowsError, setRowsError] = useState("");
  const [version, setVersion] = useState(0);

  const onProductIdsChange = useCallback((ids: string[]) => setSelectedIds(ids), []);

  useEffect(() => {
    if (!catalog) return;
    const missing = selectedIds.filter((id) => !loaded.current.has(id));
    if (!missing.length) return;
    let active = true;
    setPending((p) => [...new Set([...p, ...missing])]);
    setRowsError("");
    for (const id of missing) {
      const division = catalog.divisions.find((d) => productId(d.name) === id);
      if (!division) continue;
      fetchCompareRecords(division.byProducts.map((b) => b.id))
        .then((records) => {
          loaded.current.set(id, buildRows(records, divisionOf));
          if (active) setVersion((v) => v + 1);
        })
        .catch(() => active && setRowsError("Market reports could not be loaded. Check the connection and try again."))
        .finally(() => active && setPending((p) => p.filter((x) => x !== id)));
    }
    return () => {
      active = false;
    };
  }, [catalog, selectedIds, divisionOf]);

  const rows = useMemo(
    () => selectedIds.flatMap((id) => loaded.current.get(id) ?? []),
    [selectedIds, version], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!catalog) {
    return (
      <div className="flex h-full flex-col" style={{ background: "#F1F7F4" }}>
        <header className="flex-shrink-0 px-4 pb-3 pt-10" style={{ background: "#F4FAF7", borderBottom: "1px solid #D5E2DD" }}>
          <h1 className="text-xl font-extrabold text-[#183B34]">Compare</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          {catalogError ? (
            <>
              <p className="text-[15px] font-bold text-[#183B34]">Couldn’t load products</p>
              <p className="text-[13px] text-[#52635F]">{catalogError}</p>
              <button
                type="button"
                onClick={() => setAttempt((a) => a + 1)}
                className="mt-1 rounded-2xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "#087F63" }}
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <span className="size-7 animate-spin rounded-full border-[3px] border-[#D5E2DD] border-t-[#087F63]" aria-hidden />
              <p role="status" className="text-[13px] text-[#52635F]">Loading products…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <ZaraiMandiCompare
      categories={categories}
      locations={locations}
      ownedCategoryIds={ownedCategoryIds}
      accessNote={ownedProducts ? "Showing the products you subscribe to." : "Free trial — compare any product."}
      renderLocationPicker={renderLocationPicker}
      rows={rows}
      onProductIdsChange={onProductIdsChange}
      rowsLoading={!rowsError && selectedIds.some((id) => pending.includes(id) || !loaded.current.has(id))}
      rowsError={rowsError}
      dataLabel={catalog.dateRange ? `Market data · ${formatDay(catalog.dateRange.first)} – ${formatDay(catalog.dateRange.last)}` : undefined}
      storageKey="zarai-mandi-compare-v2"
    />
  );
}
