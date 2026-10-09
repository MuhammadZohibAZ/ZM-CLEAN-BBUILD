import { useEffect, useState, useMemo } from "react";

import { fetchAttributeValues, type AttributeValue } from "../../lib/api";

import { ByproductDatePill } from "../components/ByproductDatePill";
import { apiCardStatsToUi, apiSpecialAttrToUi, ByProductNationalCard, SPECIAL_ATTR_META, specialAttrValueUr } from "../components/ByProductNationalCard";
import { FilterChipBar, useMultiFilter, type FilterOption } from "../components/FilterChipBar";
import { ProductIcon } from "../components/ProductIcon";
import { ByProductAttributeFilterScreen } from "./byproduct-testers/ByProductAttributeFilterScreen";
import { ByProductRateTypeFilterScreen } from "./byproduct-testers/ByProductRateTypeFilterScreen";
import { ScreenVariantSwitch, useByproductScreenVariant } from "./byproduct-testers/ScreenVariantSwitch";
import {
  buildByproductCards,
  type ByproductCardData,
  byproductsForSelection,
  productRatesScreenFor,
  toDateStr,
} from "../shared/data/byproductCards";
import { getDivisionForProduct } from "../shared/data/catalog";
import { latestDatasetDay } from "../shared/data/datasetDates";
import { useDivisionCardData } from "../shared/hooks/useDivisionCardData";
import { toUrduDigits, URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type LocationScope, type ProductSel, type RateItem, type Screen } from "../shared/types";

// ─── REVAMPED BY-PRODUCT COMBINED SCREEN (4 CARDS VISIBLE IN 2*2 GRID) ─────────────

export function ByProductCombinedScreen({
  products,
  active,
  push,
  replace,
  onBack,
  isPickedBP = () => false,
  togglePickBP = () => { },
  locationScope,
  onOpenLocation,
  onSelectLocation,
  profileCompleted = false,
  onOpenSubscribe,
}: {
  products: ProductSel[];
  active: number;
  push: (s: Screen) => void;
  replace: (s: Screen) => void;
  onBack: () => void;
  isPickedBP?: (item: RateItem) => boolean;
  togglePickBP?: (item: RateItem) => void;
  locationScope?: LocationScope;
  onOpenLocation?: () => void;
  onSelectLocation?: (s: LocationScope) => void;
  profileCompleted?: boolean;
  onOpenSubscribe?: () => void;
}) {
  const idx = Math.min(active, Math.max(0, products.length - 1));
  const activeProduct = products[idx] ?? products[0];

  const setActive = (i: number) => {
    replace({ id: 'byproduct-combined', products, active: i });
  };

  // Whether entry is Vertical Level (multiple products) vs Product Level (single product)
  const isVerticalLevelEntry = products.length > 1;

  const { voiceEnabled, lang, tc: tcL, tm: tmL } = useLang();

  // Testing: switch the card area between the original grid and the two
  // filter variants in ./byproduct-testers (remove with that folder).
  const [screenVariant, setScreenVariant] = useByproductScreenVariant();

  const currentLocScope: LocationScope = locationScope || { kind: 'pakistan', label: 'All Pakistan' };

  // Real catalog + card stats fetched from the Postgres-backed market API
  // (zarai-mandi/api/), keyed by database division (resolved via getDivisionForProduct).
  const dbDivision = getDivisionForProduct(activeProduct?.vertical, activeProduct?.product);
  const divisionsNeeded = useMemo(
    () => [dbDivision],
    [dbDivision]
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(latestDatasetDay());

  const curDate = selectedDate || latestDatasetDay();
  const curDateStr = toDateStr(curDate);

  // Special-attribute values reported for this division's by-products (filter chips).
  const [attrValues, setAttrValues] = useState<AttributeValue[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchAttributeValues(dbDivision, { locationKind: currentLocScope.kind, locationLabel: currentLocScope.label })
      .then((rows) => !cancelled && setAttrValues(rows))
      .catch(() => !cancelled && setAttrValues([]));
    return () => {
      cancelled = true;
    };
  }, [dbDivision, currentLocScope.kind, currentLocScope.label]);

  // Each card's chosen rate type ("catalogId" or "catalogId~attribute value" -> rate type); reset per product.
  const [cardRates, setCardRates] = useState<Record<string, string>>({});
  useEffect(() => setCardRates({}), [dbDivision, activeProduct?.product]);

  const [catalogForList, setCatalogForList] = useState<string[]>([]);
  const attrOptions = useMemo<FilterOption[]>(() => {
    const wanted = new Set(catalogForList.map((b) => b.toLowerCase()));
    const byValue = new Map<string, FilterOption>();
    for (const v of attrValues) {
      if (wanted.size && !wanted.has(v.byproduct.toLowerCase())) continue;
      const key = `${v.type}|${v.value}`;
      const existing = byValue.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      const ui = apiSpecialAttrToUi({ type: v.type, value: v.type === 'moisture' ? `${v.value}%` : v.value });
      const meta = SPECIAL_ATTR_META[v.type];
      byValue.set(key, {
        value: key,
        caption: lang === 'ur' ? meta?.labelUr : meta?.labelEn,
        label: ui ? (lang === 'ur' ? specialAttrValueUr(ui, tcL) : ui.valueEn) : v.value,
        count: 1,
      });
    }
    return [...byValue.values()].sort((a, b) => b.count - a.count);
  }, [attrValues, catalogForList, lang, tcL]);
  const attrFilter = useMultiFilter(attrOptions);

  const { catalogByDivision, cardStatsByDivision } = useDivisionCardData(divisionsNeeded, curDateStr, currentLocScope, {
    attrs: attrFilter.active,
    rates: cardRates,
  });

  const byproducts = useMemo(
    () => byproductsForSelection(catalogByDivision[dbDivision] || [], activeProduct, isVerticalLevelEntry),
    [catalogByDivision, dbDivision, isVerticalLevelEntry, activeProduct?.product, activeProduct?.vertical]
  );
  // Chip counts only cover the by-products this screen lists.
  useEffect(() => setCatalogForList(byproducts), [byproducts]);

  // By-products with none of the chosen attribute values are hidden.
  const filteredOut = useMemo(
    () => new Set((cardStatsByDivision[dbDivision] || []).filter((c) => c.filteredOut).map((c) => c.byproduct.toLowerCase())),
    [cardStatsByDivision, dbDivision]
  );

  // 1 summary card per by-product, updating dynamically when date, location, or division changes.
  // With an attribute filter on, a by-product gets one card per selected value
  // (e.g. Wheat · New and Wheat · Old), since their averages differ.
  const byproductCardsData = useMemo(() => {
    const divStats = cardStatsByDivision[dbDivision] || [];
    return buildByproductCards(byproducts, activeProduct, dbDivision, divStats, currentLocScope, curDate)
      .filter((c) => !filteredOut.has(c.bp.toLowerCase()))
      .flatMap((card): (ByproductCardData & { key: string; rateKey: string | null })[] => {
        const perValue = divStats.filter((s) => s.split && !s.filteredOut && s.byproduct.toLowerCase() === card.bp.toLowerCase());
        if (!perValue.length) return [{ ...card, key: card.bp, rateKey: card.stats.catalogId ? String(card.stats.catalogId) : null }];
        return perValue.map((s) => ({
          ...card,
          stats: apiCardStatsToUi(s),
          key: `${card.bp}~${s.split!.value}`,
          rateKey: `${s.catalogId}~${s.split!.value}`,
        }));
      });
  }, [byproducts, dbDivision, cardStatsByDivision, curDate, curDateStr, activeProduct?.product, currentLocScope, filteredOut]);

  return (
    <div
      className="flex flex-col h-full screen-enter relative overflow-hidden"
      style={{ background: '#F1F7F4' }}
    >
      {/* Header */}
      <header
        className="flex-shrink-0 relative z-10"
        style={{
          background: 'rgba(244, 250, 247, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(213, 226, 221, 0.8)',
        }}
      >
        {/* Title row */}
        <div className="zm-status-gap px-3 pt-9 pb-2.5 flex items-center justify-between gap-1.5 w-full">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="tap-target zm-beam-border w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 text-[#183B34] transition active:scale-95"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1.2px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {lang === 'ur' ? '→' : '←'}
            </button>
            <ProductIcon
              name={activeProduct?.product || 'Wheat'}
              vertical={activeProduct?.vertical}
              size={28}
              style={{ flexShrink: 0 }}
            />
            <div className="min-w-0 flex-1">
              <h2
                className="font-black text-[#183B34] text-base leading-tight truncate"
                style={{ fontFamily: lang === 'ur' ? URDU_FONT : 'inherit' }}
              >
                {tcL(activeProduct?.product || 'Wheat')}
              </h2>
              <p className="text-[11px] font-semibold text-[#52635F] leading-tight whitespace-nowrap">
                {lang === 'ur'
                  ? `${toUrduDigits(byproducts.length)} ضمنی مصنوعات`
                  : `${byproducts.length} By-products`}
              </p>
            </div>
          </div>

          <ByproductDatePill selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        {/* Vertical Level Entry Filter Bar: ONLY rendered if entry is multi-product! */}
        {isVerticalLevelEntry && (
          <div
            className="px-3 py-2 flex items-center gap-2 flex-shrink-0 relative overflow-x-auto"
            style={{
              background: 'rgba(244, 250, 247, 0.55)',
              borderTop: '1px solid rgba(255, 255, 255, 0.6)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
              scrollbarWidth: 'none',
            }}
          >
            <div className="flex items-center gap-1.5 overflow-x-auto w-full py-0.5">
              {products.map((p, pIdx) => {
                const on = pIdx === idx;
                return (
                  <button
                    key={p.product}
                    onClick={() => setActive(pIdx)}
                    className="tap-target zm-beam-border flex-shrink-0 flex items-center gap-1.5 rounded-full font-bold transition active:scale-95 px-3 py-1"
                    style={{
                      background: on
                        ? 'linear-gradient(135deg, rgba(167, 243, 208, 0.85), rgba(110, 231, 183, 0.75))'
                        : 'rgba(255, 255, 255, 0.65)',
                      color: '#064E3B',
                      border: on
                        ? '1.2px solid #10B981'
                        : '1.2px solid rgba(16, 185, 129, 0.35)',
                      fontSize: 12,
                      minHeight: 32,
                    }}
                  >
                    <ProductIcon
                      name={p.product}
                      vertical={p.vertical}
                      size={16}
                      style={{ flexShrink: 0 }}
                    />
                    <span>{tcL(p.product)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {screenVariant !== 'original' && (() => {
        const testerProps = {
          dbDivision,
          activeProduct,
          byproducts,
          curDate,
          curDateStr,
          locationScope: currentLocScope,
          push,
        };
        const testerKey = `${dbDivision}-${activeProduct?.product}`;
        return screenVariant === 'attribute'
          ? <ByProductAttributeFilterScreen key={testerKey} {...testerProps} />
          : <ByProductRateTypeFilterScreen key={testerKey} {...testerProps} />;
      })()}

      {/* Special-attribute filter (hidden for products whose by-products have none). */}
      {screenVariant === 'original' && attrOptions.length > 0 && (
        <FilterChipBar
          title={lang === 'ur' ? 'خصوصی وصف' : 'Special attribute'}
          options={attrOptions}
          selected={attrFilter.active}
          onToggle={attrFilter.toggle}
          totalCount={byproducts.length}
          visibleCount={byproductCardsData.length}
        />
      )}

      {/* By-Product Cards — 4-card visible grid (2 columns x 2 rows fit comfortably on screen) */}
      {screenVariant === 'original' && (
      <div
        className="flex-1 overflow-y-auto px-2.5 sm:px-3 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)', scrollbarWidth: 'none' }}
      >
        {byproductCardsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 px-4">
            <p className="font-semibold text-sm">
                {attrFilter.active.length > 0
                  ? lang === 'ur'
                    ? 'اس فلٹر کے لیے کوئی کارڈ نہیں'
                    : 'No cards for this filter'
                  : lang === 'ur'
                    ? 'کوئی ضمنی مصنوعات نہیں ملیں'
                    : 'No by-products found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {byproductCardsData.map((card) => {
              const { stats, rateKey } = card;
              const navigateToDetail = () => push(productRatesScreenFor(card, curDateStr));

              return (
                <ByProductNationalCard
                  key={`${activeProduct?.product}-${card.key}`}
                  stats={stats}
                  product={activeProduct?.product}
                  vertical={activeProduct?.vertical}
                  selectedDate={curDate}
                  onClick={navigateToDetail}
                  onMorePriceTypesClick={navigateToDetail}
                  onRateTypeChange={
                    rateKey ? (rt) => setCardRates((prev) => ({ ...prev, [rateKey]: rt })) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
      )}

      <ScreenVariantSwitch variant={screenVariant} onChange={setScreenVariant} />
    </div>
  );
}

