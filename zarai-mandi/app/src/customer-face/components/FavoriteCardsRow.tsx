import { useEffect, useState } from "react";

import { fetchVerticalCardStats, type CardStats } from "../../lib/api";
import { productRatesScreenFor, toDateStr } from "../shared/data/byproductCards";
import { getDivisionForProduct } from "../shared/data/catalog";
import { latestDatasetDay } from "../shared/data/datasetDates";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import type { LocationScope, Screen } from "../shared/types";
import { apiCardStatsToUi, ByProductNationalCard, emptyByproductStats } from "./ByProductNationalCard";

export type FavoriteCardItem = {
  vertical: string;
  product: string;
  byproduct: string;
  /** Where it was favourited (All Pakistan, a province, district or mandi). */
  location?: LocationScope;
  rateType?: string;
};

const PAKISTAN: LocationScope = { kind: "pakistan", label: "All Pakistan" };

/** Card stats for one favourite at its own location (and rate type, when it was saved with one). */
async function statsFor(item: FavoriteCardItem, date: string): Promise<CardStats | null> {
  const division = getDivisionForProduct(item.vertical, item.product);
  const loc = item.location ?? PAKISTAN;
  const opts = { date, locationKind: loc.kind, locationLabel: loc.label };
  const find = (list: CardStats[]) => list.find((c) => c.byproduct.toLowerCase() === item.byproduct.toLowerCase()) || null;
  const base = find(await fetchVerticalCardStats(division, opts));
  if (!base || !item.rateType || base.mostOccurringRateType === item.rateType || !base.allRateTypes.includes(item.rateType)) return base;
  return find(await fetchVerticalCardStats(division, { ...opts, rates: { [String(base.catalogId)]: item.rateType } })) || base;
}

/**
 * Home's Favourites: the same by-product cards as the by-product screen, in a
 * straight horizontally scrolling row, each for the location it was saved with.
 */
export function FavoriteCardsRow({ items, push }: { items: FavoriteCardItem[]; push: (s: Screen) => void }) {
  const { lang, tm } = useLang();
  const isUr = lang === "ur";
  const day = latestDatasetDay();
  const dateStr = toDateStr(day);
  const [stats, setStats] = useState<Record<string, CardStats | null>>({});
  // Short screens: compact cards so Home fits above the bottom nav without scrolling.
  const [compact, setCompact] = useState(() => window.innerHeight < 800);
  useEffect(() => {
    const onResize = () => setCompact(window.innerHeight < 800);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const keyOf = (it: FavoriteCardItem) =>
    `${it.vertical}|${it.product}|${it.byproduct}|${it.location?.kind ?? ""}|${it.location?.label ?? ""}|${it.rateType ?? ""}`;
  const itemsKey = items.map(keyOf).join(";");

  useEffect(() => {
    let cancelled = false;
    Promise.all(items.map((it) => statsFor(it, dateStr).catch(() => null))).then((list) => {
      if (cancelled) return;
      const next: Record<string, CardStats | null> = {};
      items.forEach((it, i) => (next[keyOf(it)] = list[i]));
      setStats(next);
    });
    return () => {
      cancelled = true;
    };
  }, [itemsKey, dateStr]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="flex items-stretch overflow-x-auto -mx-4 px-4 gap-2"
      style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory", paddingTop: 4, paddingBottom: 8, scrollPaddingInline: 16 }}
    >
      {items.map((it) => {
        const k = keyOf(it);
        const raw = stats[k];
        const card = {
          sel: { vertical: it.vertical, product: it.product },
          bp: it.byproduct,
          stats: raw ? apiCardStatsToUi(raw) : emptyByproductStats(it.product, it.byproduct),
        };
        const loc = it.location ?? PAKISTAN;
        const place = loc.kind === "pakistan" ? (isUr ? "پورا پاکستان" : "All Pakistan") : tm(loc.label);
        const open = () => {
          const screen = productRatesScreenFor(card, dateStr);
          push(screen.id === "product-rates" ? { ...screen, initialScope: loc } : screen);
        };
        return (
          <div key={k} className="flex-shrink-0 flex flex-col gap-1.5" style={{ width: "calc((100% - 8px) / 1.8)", scrollSnapAlign: "start" }}>
            {/* Where it was favourited */}
            <span
              className="self-start flex items-center gap-1 rounded-full px-2 py-0.5 max-w-full"
              style={{ background: "#EAF5F0", border: "1px solid #C7E8D8", fontFamily: isUr ? URDU_FONT : "inherit" }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#087F63" className="flex-shrink-0" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" fill="#EAF5F0" />
              </svg>
              <span className="truncate text-[10.5px] font-bold text-[#075E4F]">{place}</span>
            </span>
            {/* Row flex: the card stretches so every card in the row is the same height */}
            <div className="flex-1 flex">
              <ByProductNationalCard
                stats={card.stats}
                product={it.product}
                vertical={it.vertical}
                selectedDate={day}
                onClick={open}
                onMorePriceTypesClick={open}
                compact={compact}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
