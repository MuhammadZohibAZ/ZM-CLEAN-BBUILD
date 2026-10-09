import { useEffect, useMemo, useState } from "react";

import { fetchVerticalSplitCardStats, type CardSplitBy, type CardStats } from "../../../lib/api";
import { apiCardStatsToUi, ByProductNationalCard } from "../../components/ByProductNationalCard";
import { mainByproductRank, productRatesScreenFor, type ByproductCardData } from "../../shared/data/byproductCards";
import { URDU_FONT, useLang } from "../../shared/i18n/LangProvider";
import { type LocationScope, type ProductSel, type Screen } from "../../shared/types";

export { FILTER_ALL, FilterChipBar, useMultiFilter, type FilterOption } from "../../components/FilterChipBar";

// Shared by the two tester variants of the by-product screen
// (ByProductAttributeFilterScreen, ByProductRateTypeFilterScreen). Delete this
// whole folder, and its few lines in ByProductCombinedScreen, to remove them.

/** What ByProductCombinedScreen hands a tester variant in place of its card grid. */
export type TesterBodyProps = {
  dbDivision: string;
  activeProduct: ProductSel | undefined;
  /** Catalog by-products for the current selection (same list the original screen shows). */
  byproducts: string[];
  curDate: Date;
  curDateStr: string;
  locationScope: LocationScope;
  push: (s: Screen) => void;
};

export type SplitCard = ByproductCardData & {
  key: string;
  /** Attribute value / rate type this card covers; null for a by-product with nothing to split on. */
  splitValue: string | null;
};

/**
 * Split card stats from the market API: every card's averages, arrivals and
 * markets are computed only from the records with its attribute value (or its
 * rate type), so cards never mix e.g. new-crop and old-crop prices.
 */
export function useSplitCards(by: CardSplitBy, props: TesterBodyProps) {
  const { dbDivision, activeProduct, byproducts, curDateStr, locationScope } = props;
  const [raw, setRaw] = useState<CardStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchVerticalSplitCardStats(dbDivision, by, {
      date: curDateStr,
      locationKind: locationScope.kind,
      locationLabel: locationScope.label,
    })
      .then((rows) => {
        if (!cancelled) setRaw(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setRaw([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dbDivision, by, curDateStr, locationScope.kind, locationScope.label]);

  const cards = useMemo<SplitCard[]>(() => {
    const wanted = new Set(byproducts.map((b) => b.toLowerCase()));
    const sel: ProductSel = {
      vertical: activeProduct?.vertical || "Grains",
      product: activeProduct?.product || dbDivision,
    };
    const list = raw
      .filter((r) => wanted.size === 0 || wanted.has(r.byproduct.toLowerCase()))
      .map((r) => ({
        sel,
        bp: r.byproduct,
        stats: apiCardStatsToUi(r),
        splitValue: r.split?.value ?? null,
        key: `${r.catalogId}-${r.split?.value ?? "all"}`,
      }));
    // Main by-products first (Wheat, Phutti Grade A/B/C, ...), then cards with
    // data; otherwise keep the API's catalog order (and, within a by-product,
    // its most-reported split first).
    return list
      .map((c, i) => ({ c, i, rank: mainByproductRank(sel.product, c.bp) }))
      .sort(
        (a, b) =>
          a.rank - b.rank ||
          Number(b.c.stats.hasData) - Number(a.c.stats.hasData) ||
          a.i - b.i
      )
      .map(({ c }) => c);
  }, [raw, byproducts, activeProduct?.vertical, activeProduct?.product, dbDivision]);

  return { cards, loading, error };
}

/** Scrollable 2-column card grid with loading, error and empty states. */
export function SplitCardGrid({
  cards,
  loading,
  error,
  curDate,
  curDateStr,
  push,
}: {
  cards: SplitCard[];
  loading: boolean;
  error: boolean;
  curDate: Date;
  curDateStr: string;
  push: (s: Screen) => void;
}) {
  const { lang } = useLang();
  const font = lang === "ur" ? URDU_FONT : "inherit";

  let message: string | null = null;
  if (error) {
    message = lang === "ur"
      ? "کارڈز لوڈ نہیں ہو سکے۔ مارکیٹ API چل رہی ہے؟"
      : "Couldn't load the cards. Is the market API running?";
  } else if (!loading && cards.length === 0) {
    message = lang === "ur" ? "اس فلٹر کے لیے کوئی کارڈ نہیں" : "No cards for this filter";
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-2.5 sm:px-3 pt-2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 140px)", scrollbarWidth: "none" }}
    >
      {loading && cards.length === 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[16px] animate-pulse"
              style={{ height: 168, background: "#FFFFFF", border: "1.5px solid #D1E5DC" }}
            />
          ))}
        </div>
      ) : message ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60 px-4 text-center">
          <p className="font-semibold text-sm text-[#183B34]" style={{ fontFamily: font }}>{message}</p>
        </div>
      ) : (
        <div className={`grid grid-cols-2 gap-2 sm:gap-2.5 ${loading ? "opacity-60" : ""}`}>
          {cards.map((card) => {
            const open = () => push(productRatesScreenFor(card, curDateStr));
            return (
              <ByProductNationalCard
                key={card.key}
                stats={card.stats}
                product={card.sel.product}
                vertical={card.sel.vertical}
                selectedDate={curDate}
                onClick={open}
                onMorePriceTypesClick={open}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
