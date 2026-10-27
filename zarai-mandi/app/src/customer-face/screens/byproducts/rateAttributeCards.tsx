// Cards for the by-product screen (ByProductSidebarFilterScreen): a rate type
// for every card (each card's own most reported by default) and special-attribute
// values (several give each by-product one card per value).

import { useEffect, useMemo, useState } from "react";

import {
  fetchAttributeValues,
  fetchRateCounts,
  fetchVerticalCardStats,
  type AttributeValue,
  type CardStats,
} from "../../../lib/api";
import { apiCardStatsToUi, apiSpecialAttrToUi, SPECIAL_ATTR_META, specialAttrValueUr } from "../../components/ByProductNationalCard";
import { mainByproductRank } from "../../shared/data/byproductCards";
import { useLang } from "../../shared/i18n/LangProvider";
import { makeFmt } from "../product-rates/format";
import type { LocationScope, ProductSel, Screen } from "../../shared/types";

/** What ByProductCombinedScreen hands the card area below its header. */
export type ByproductBodyProps = {
  dbDivision: string;
  activeProduct: ProductSel | undefined;
  /** Catalog by-products for the current selection. */
  byproducts: string[];
  curDate: Date;
  curDateStr: string;
  locationScope: LocationScope;
  push: (s: Screen) => void;
};

/**
 * `perCardDefault`: with no rate picked, every card shows its own most received
 * rate type (the by-product screen). Without it, the day's most reported rate
 * applies to all cards.
 */
export function useRateAttributeCards(props: ByproductBodyProps, opts: { perCardDefault?: boolean } = {}) {
  const perCard = !!opts.perCardDefault;
  const { dbDivision, activeProduct, byproducts, curDate, curDateStr, locationScope, push } = props;
  const { lang, tc, tr } = useLang();
  const f = makeFmt(lang);
  const loc = { locationKind: locationScope.kind, locationLabel: locationScope.label };
  const locKey = `${loc.locationKind}|${loc.locationLabel}`;
  const wanted = useMemo(() => new Set(byproducts.map((b) => b.toLowerCase())), [byproducts]);

  const [attrs, setAttrs] = useState<string[]>([]);
  // null = the day's most reported rate type.
  const [rate, setRate] = useState<string | null>(null);

  // Reset when the product changes.
  useEffect(() => {
    setAttrs([]);
    setRate(null);
  }, [dbDivision, activeProduct?.product]);

  // Attribute values reported for this product's by-products.
  const [attrValues, setAttrValues] = useState<AttributeValue[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchAttributeValues(dbDivision, loc)
      .then((rows) => !cancelled && setAttrValues(rows))
      .catch(() => !cancelled && setAttrValues([]));
    return () => {
      cancelled = true;
    };
  }, [dbDivision, locKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reports per rate type that day: the default rate and the list order.
  const [rateCounts, setRateCounts] = useState<{ rateType: string; count: number }[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchRateCounts(dbDivision, { date: curDateStr, ...loc })
      .then((r) => !cancelled && setRateCounts(r.counts))
      .catch(() => !cancelled && setRateCounts([]));
    return () => {
      cancelled = true;
    };
  }, [dbDivision, curDateStr, locKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cards for the attribute choice alone (their rate types make the Rate list).
  const [base, setBase] = useState<CardStats[]>([]);
  const [raw, setRaw] = useState<CardStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const attrsKey = [...attrs].sort().join(",");
  useEffect(() => {
    let cancelled = false;
    setError(false);
    fetchVerticalCardStats(dbDivision, { date: curDateStr, ...loc, attrs })
      .then((b) => !cancelled && setBase(b))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [dbDivision, curDateStr, locKey, attrsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const inList = (c: CardStats) => (wanted.size === 0 || wanted.has(c.byproduct.toLowerCase())) && !c.filteredOut;

  // Rate list: the day's most reported first, then how many cards have it.
  const rateOptions = useMemo(() => {
    const cardCount = new Map<string, number>();
    for (const c of base.filter(inList)) for (const rt of c.allRateTypes || []) cardCount.set(rt, (cardCount.get(rt) || 0) + 1);
    const today = new Map(rateCounts.map((r) => [r.rateType, r.count]));
    return [...cardCount]
      .map(([id, cards]) => ({ id, cards, today: today.get(id) || 0 }))
      .sort((a, b) => b.today - a.today || b.cards - a.cards);
  }, [base, rateCounts, wanted]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeRate = rate ?? (perCard ? null : rateOptions[0]?.id ?? null);

  // Nothing reported for this product: no rate to load cards for.
  useEffect(() => {
    if (!activeRate && !perCard) setRaw([]);
  }, [activeRate, perCard]);

  // ... and with the rate applied (what the grid shows).
  useEffect(() => {
    if (!activeRate && !perCard) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchVerticalCardStats(dbDivision, { date: curDateStr, ...loc, attrs, rate: activeRate ?? undefined })
      .then((r) => !cancelled && setRaw(r))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [dbDivision, curDateStr, locKey, attrsKey, activeRate, perCard]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attribute groups: type -> values, each with how many by-products report it.
  const attrGroups = useMemo(() => {
    const groups = new Map<string, Map<string, number>>();
    for (const v of attrValues) {
      if (wanted.size && !wanted.has(v.byproduct.toLowerCase())) continue;
      const g = groups.get(v.type) || new Map<string, number>();
      g.set(v.value, (g.get(v.value) || 0) + 1);
      groups.set(v.type, g);
    }
    return [...groups]
      .map(([type, values]) => ({ type, values: [...values].sort((a, b) => b[1] - a[1]) }))
      .sort((a, b) => b.values.length - a.values.length);
  }, [attrValues, wanted]);

  const attrLabel = (type: string) => {
    const meta = SPECIAL_ATTR_META[type];
    return meta ? (lang === "ur" ? meta.labelUr : meta.labelEn) : type;
  };
  const valueLabel = (type: string, value: string) => {
    const ui = apiSpecialAttrToUi({ type: type as AttributeValue["type"], value: type === "moisture" ? `${value}%` : value });
    return ui ? (lang === "ur" ? specialAttrValueUr(ui, tc) : ui.valueEn) : value;
  };
  const toggleAttr = (key: string) => setAttrs((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));

  // Cards: one per by-product (or per by-product and attribute value) that has the rate.
  const cards = useMemo(() => {
    const sel = { vertical: activeProduct?.vertical || "Grains", product: activeProduct?.product || dbDivision };
    return raw
      .filter(inList)
      .filter((c) => !c.rateFallback)
      .map((c, i) => ({
        sel,
        bp: c.byproduct,
        stats: apiCardStatsToUi(c),
        key: `${c.catalogId}~${c.split?.value ?? ""}`,
        i,
        rank: mainByproductRank(sel.product, c.byproduct),
      }))
      .sort((a, b) => a.rank - b.rank || Number(b.stats.hasData) - Number(a.stats.hasData) || a.i - b.i);
  }, [raw, wanted, activeProduct?.vertical, activeProduct?.product, dbDivision]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    f, lang, tr, attrs, setAttrs, rate, setRate, rateOptions, activeRate,
    attrGroups, attrLabel, valueLabel, toggleAttr, cards, loading, error,
    curDate, curDateStr, push,
  };
}

export type RateAttributeCards = ReturnType<typeof useRateAttributeCards>;
