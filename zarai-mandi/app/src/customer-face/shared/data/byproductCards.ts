import { type ByProductCatalogRow, type CardStats } from "../../../lib/api";

import {
  apiCardStatsToUi,
  emptyByproductStats,
  getCardUpdatedMinutes,
} from "../../components/ByProductNationalCard";
import { calculateByproductSummary } from "./byproductStats";
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
 * 1 summary card per by-product, with date/location-specific rates and arrivals
 * computed from the dataset, sorted with data first and most recently updated first.
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
    let stats = raw ? apiCardStatsToUi(raw) : emptyByproductStats(dbDivision, bp);

    // Compute date-specific rates and arrivals from the dataset for the selected date
    const localStats = calculateByproductSummary(sel?.product || dbDivision, bp, locationScope, date);
    if (localStats) {
      stats = {
        ...stats,
        hasData: localStats.hasData,
        avgMin: localStats.avgMin,
        avgMax: localStats.avgMax,
        totalArrival: localStats.totalArrival,
        markets: localStats.markets,
        mostOccurringRateType: localStats.mostOccurringRateType || stats.mostOccurringRateType,
        specialAttr: localStats.specialAttr || stats.specialAttr,
      };
    }

    return { sel: cardSel, bp, stats };
  });

  // Sort by updated time: 1m ago (most recent) first, followed by 4m, 7m, 10m, etc.
  return list.sort((a, b) => {
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

  if (sa) {
    if (sa.type === 'moisture') initMoisture = sa.valueEn.replace('%', '').trim();
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
    initialCondition: sa?.type === 'quality' ? sa.valueEn : undefined,
    initialStatDate: dateStr,
    initialAvgMin: stats.avgMin > 0 ? stats.avgMin : undefined,
    initialAvgMax: stats.avgMax > 0 ? stats.avgMax : undefined,
    initialTotalArrival: stats.totalArrival > 0 ? stats.totalArrival : undefined,
    initialMarkets: stats.markets > 0 ? stats.markets : undefined,
  };
}
