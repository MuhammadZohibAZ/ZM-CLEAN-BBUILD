import { type ByProductCatalogRow, type CardStats } from "../../../lib/api";

import {
  apiCardStatsToUi,
  emptyByproductStats,
  getCardUpdatedMinutes,
} from "../../components/ByProductNationalCard";
import { getDeclaredMoistureBand } from "./byproductStats";
import { PRODUCT_DIVISIONS, VERTICALS } from "./catalog";
import { FLAT_ALL_MANDI_ROWS } from "./mandis";
import {
  type ByproductNationalStats,
  type LocationScope,
  type ProductSel,
  type Screen,
} from "../types";

// By-product card data shared by the Home carousel and ByProductCombinedScreen:
// which catalog by-products belong to a product, their card stats, their order,
// and where tapping a card navigates.

export function productByproducts(vertical: string, product: string): string[] {
  // 1. Direct match in PRODUCT_DIVISIONS
  const div = PRODUCT_DIVISIONS.find((d) => d.name === vertical || d.name === product);
  if (div) {
    if (div.type === "product" && div.byproducts && div.byproducts.length > 0) return div.byproducts;
    if (div.products?.[product] && div.products[product].length > 0) return div.products[product];
  }

  // 2. Direct match in VERTICALS[vertical]
  if (VERTICALS[vertical]?.products?.[product]?.length) {
    return VERTICALS[vertical].products[product];
  }

  // 3. Scan all VERTICALS for this product
  for (const vKey of Object.keys(VERTICALS)) {
    if (VERTICALS[vKey]?.products?.[product]?.length) {
      return VERTICALS[vKey].products[product];
    }
  }

  // 4. Scan all PRODUCT_DIVISIONS for this product in their sub-products
  for (const d of PRODUCT_DIVISIONS) {
    if (d.products?.[product]?.length) {
      return d.products[product];
    }
  }

  // 5. Scan FLAT_ALL_MANDI_ROWS for any rows matching this product
  const fromRows = Array.from(
    new Set(
      FLAT_ALL_MANDI_ROWS
        .filter((r) => r.product.toLowerCase() === product.toLowerCase())
        .map((r) => r.byproduct)
        .filter(Boolean)
    )
  );
  if (fromRows.length > 0) {
    return fromRows;
  }

  // 6. Fallback to product itself
  return [product];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// Main by-products of a product, shown first (in this order) on its by-product
// screen. Products not listed fall back to mainByproductRank's naming rule.
const MAIN_BYPRODUCTS: Record<string, string[]> = {
  cotton: ['Phutti Grade A', 'Phutti Grade B', 'Phutti Grade C'],
  mustard: ['Sarson Seed', 'Sarson Oil', 'Sarson Khal'],
  canola: ['Canola Seed', 'Canola Oil', 'Canola Meal'],
  sunflower: ['Sunflower Seed', 'Sunflower Oil', 'Sunflower Meal'],
  soybean: ['Soyabean Seed', 'Soyabean Oil', 'Soyabean Meal'],
  sugar: ['Sugar Cane', 'Cheeni'],
  paddy: ['Paddy 1509', 'Paddy Irri 6', 'Paddy Irri 9'],
  rice: ['1121 Steam', 'Sella 1121-1', '1121 Basmati-1'],
};

/**
 * Sort rank of a by-product within its product: listed main by-products first,
 * otherwise the by-product named like the product (Wheat -> Wheat), then its
 * grades in order (Maize - Grade A, B, C, ...). Everything else ranks last.
 */
export function mainByproductRank(product: string | undefined, byproduct: string): number {
  const p = norm(product || '');
  const b = norm(byproduct);
  const listed = MAIN_BYPRODUCTS[p];
  if (listed) {
    const i = listed.findIndex((x) => norm(x) === b);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  }
  if (!p) return Number.MAX_SAFE_INTEGER;
  if (b === p) return 0;
  const grade = b.match(new RegExp(`^${p}grade([a-d])$`));
  return grade ? 1 + grade[1].charCodeAt(0) - 97 : Number.MAX_SAFE_INTEGER;
}

/** Catalog by-products that belong to one sub-product of a vertical (e.g. Fruits -> Mango). */
function filterCatalogForSubProduct(rawCatalog: ByProductCatalogRow[], sel: ProductSel | undefined): string[] {
  const subProd = sel?.product || '';
  const subBps = productByproducts(sel?.vertical || '', subProd);
  const normSub = norm(subProd);

  return rawCatalog.filter((c) => {
    const normBp = norm(c.by_product);
    if (subBps.some((b) => norm(b) === normBp || norm(b).includes(normBp) || normBp.includes(norm(b)))) return true;
    if (normBp.includes(normSub)) return true;
    // Handle Herbs / Herbals aliases
    if (normSub.includes('blackseed') && (normBp.includes('kalonji') || normBp.includes('blackseed'))) return true;
    if (normSub.includes('psyllium') && (normBp.includes('ispaghol') || normBp.includes('psyllium'))) return true;
    if (normSub.includes('asafoetida') && (normBp.includes('hing') || normBp.includes('asafoetida'))) return true;
    if (normSub.includes('carom') && (normBp.includes('ajwain') || normBp.includes('carom'))) return true;
    if (normSub.includes('basil') && (normBp.includes('tukhmalanga') || normBp.includes('basil'))) return true;
    if (normSub.includes('saffron') && (normBp.includes('zafran') || normBp.includes('saffron'))) return true;
    if (normSub.includes('fennel') && (normBp.includes('saunf') || normBp.includes('fennel'))) return true;
    // Handle Soybean / Soyabean
    if (normSub.includes('soy') && normBp.includes('soy')) return true;
    return false;
  }).map((c) => c.by_product);
}

/**
 * By-product names for one product selection.
 * Product level (Wheat, Maize, ...): every catalog item of the division.
 * Vertical level (Edible Oil -> Canola, Fruits -> Apple): the matching subset.
 */
export function byproductsForSelection(
  rawCatalog: ByProductCatalogRow[],
  sel: ProductSel | undefined,
  isVerticalLevel: boolean,
): string[] {
  if (!isVerticalLevel) {
    return rawCatalog.map((c) => c.by_product);
  }
  const filtered = filterCatalogForSubProduct(rawCatalog, sel);
  if (filtered.length > 0) {
    return filtered;
  }
  // Fallback if catalog not loaded yet or no filter matches
  const subBps = productByproducts(sel?.vertical || '', sel?.product || '');
  return subBps.length > 0 ? subBps : rawCatalog.map((c) => c.by_product);
}

export type ByproductCardData = {
  /** The product this card belongs to (for a vertical: its sub-product). */
  sel: ProductSel;
  bp: string;
  stats: ByproductNationalStats;
};

/**
 * 1 summary card per by-product, with the API's date/location-specific rates and
 * arrivals, sorted main by-products first, then with data, then most recently updated.
 */
export function buildByproductCards(
  byproducts: string[],
  sel: ProductSel | undefined,
  dbDivision: string,
  statsForDivision: CardStats[],
  locationScope: LocationScope,
  date: Date,
): ByproductCardData[] {
  const cardSel: ProductSel = { vertical: sel?.vertical || 'Grains', product: sel?.product || 'Wheat' };
  const list = byproducts.map((bp) => {
    const normBp = norm(bp);
    const raw = statsForDivision.find((s) => norm(s.byproduct) === normBp || s.byproduct.toLowerCase() === bp.toLowerCase());
    // The API computes each card from every record for the selected date and
    // location (the whole year of data), with the shared special-attribute map.
    const stats = raw ? apiCardStatsToUi(raw) : emptyByproductStats(dbDivision, bp);

    return { sel: cardSel, bp, stats };
  });

  // Main by-products first (Wheat, Phutti Grade A/B/C, ...), then by updated
  // time: 1m ago (most recent) first, followed by 4m, 7m, 10m, etc.
  return list.sort((a, b) => {
    const rankA = mainByproductRank(a.sel.product, a.bp);
    const rankB = mainByproductRank(b.sel.product, b.bp);
    if (rankA !== rankB) return rankA - rankB;
    // Prioritize cards with data first
    if (a.stats.hasData !== b.stats.hasData) {
      return a.stats.hasData ? -1 : 1;
    }
    const minsA = getCardUpdatedMinutes(a.stats.catalogId || a.stats.byproduct);
    const minsB = getCardUpdatedMinutes(b.stats.catalogId || b.stats.byproduct);
    return minsA - minsB;
  });
}

export type ByproductGroup = {
  sel: ProductSel;
  /** Index of the group's first card in the flat card list. */
  start: number;
  count: number;
};

/**
 * Every by-product of a vertical (Fruits, Vegetable, ...) as one list, grouped
 * by sub-product in catalog order so the Home carousel can jump between them.
 * Catalog items that match no sub-product go into a trailing group named after
 * the division.
 */
export function buildVerticalCards(
  rawCatalog: ByProductCatalogRow[],
  selections: ProductSel[],
  dbDivision: string,
  statsForDivision: CardStats[],
  locationScope: LocationScope,
  date: Date,
): { cards: ByproductCardData[]; groups: ByproductGroup[] } {
  const cards: ByproductCardData[] = [];
  const groups: ByproductGroup[] = [];
  const assigned = new Set<string>();

  const addGroup = (sel: ProductSel, bps: string[]) => {
    const fresh = bps.filter((bp) => !assigned.has(norm(bp)));
    fresh.forEach((bp) => assigned.add(norm(bp)));
    if (fresh.length === 0) return;
    groups.push({ sel, start: cards.length, count: fresh.length });
    cards.push(...buildByproductCards(fresh, sel, dbDivision, statsForDivision, locationScope, date));
  };

  for (const sel of selections) {
    const matched = filterCatalogForSubProduct(rawCatalog, sel);
    addGroup(sel, matched.length > 0 ? matched : productByproducts(sel.vertical, sel.product));
  }

  const leftovers = rawCatalog.map((c) => c.by_product);
  if (selections.length > 0) {
    addGroup({ vertical: selections[0].vertical, product: dbDivision }, leftovers);
  }

  return { cards, groups };
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Where tapping a by-product card goes: its rates screen, pre-filtered to the card's special attribute. */
export function productRatesScreenFor(card: ByproductCardData, dateStr: string): Screen {
  const { sel, bp, stats } = card;
  const sa = stats.specialAttr;
  let initMoisture: string | undefined;
  let initColor: string | undefined;
  let initVariety: string | undefined;
  let initNewOld: string | undefined;
  let initSpec: string | undefined;

  // Several values chosen in the attribute filter ("New / Old"): open unfiltered on attribute.
  if (sa && !sa.valueEn.includes(' / ')) {
    // A maize grade's moisture band describes the grade; it isn't a row value to filter on.
    if (sa.type === 'moisture') initMoisture = getDeclaredMoistureBand(bp) ? undefined : sa.valueEn.replace('%', '').trim();
    else if (sa.type === 'color') initColor = sa.valueEn;
    else if (sa.type === 'variety') initVariety = sa.valueEn;
    else if (sa.type === 'newOld') initNewOld = sa.valueEn;
    else if (sa.type === 'spec') initSpec = sa.valueEn;
  }

  return {
    id: 'product-rates',
    vertical: sel.vertical || 'Grains',
    product: sel.product || 'Wheat',
    byproduct: bp,
    initialRateType: stats.mostOccurringRateType,
    initialMoisture: initMoisture,
    initialColor: initColor,
    initialVariety: initVariety,
    initialNewOld: initNewOld,
    initialSpec: initSpec,
    initialCondition: sa?.type === 'quality' && !sa.valueEn.includes(' / ') ? sa.valueEn : undefined,
    initialOrigin: sa?.type === 'origin' && !sa.valueEn.includes(' / ') ? sa.valueEn : undefined,
    // Open on the day the card's numbers are from (the picked day had no reports otherwise).
    initialStatDate: stats.statsDate && stats.statsDate < dateStr ? stats.statsDate : dateStr,
    initialAvgMin: stats.avgMin > 0 ? stats.avgMin : undefined,
    initialAvgMax: stats.avgMax > 0 ? stats.avgMax : undefined,
    initialTotalArrival: stats.totalArrival > 0 ? stats.totalArrival : undefined,
    initialMarkets: stats.markets > 0 ? stats.markets : undefined,
  };
}
