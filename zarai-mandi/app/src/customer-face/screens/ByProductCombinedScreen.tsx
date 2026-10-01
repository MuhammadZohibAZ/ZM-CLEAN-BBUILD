import { useState, useMemo } from "react";

import { ByproductDatePill } from "../components/ByproductDatePill";
import { ByProductNationalCard } from "../components/ByProductNationalCard";
import { ProductIcon } from "../components/ProductIcon";
import {
  buildByproductCards,
  byproductsForSelection,
  productRatesScreenFor,
  toDateStr,
} from "../shared/data/byproductCards";
import { getDivisionForProduct } from "../shared/data/catalog";
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

  const currentLocScope: LocationScope = locationScope || { kind: 'pakistan', label: 'All Pakistan' };

  // Real catalog + card stats fetched from the Postgres-backed market API
  // (zarai-mandi/api/), keyed by database division (resolved via getDivisionForProduct).
  const dbDivision = getDivisionForProduct(activeProduct?.vertical, activeProduct?.product);
  const divisionsNeeded = useMemo(
    () => [dbDivision],
    [dbDivision]
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 8, 14));

  const curDate = selectedDate || new Date(2026, 8, 14);
  const curDateStr = toDateStr(curDate);

  const { catalogByDivision, cardStatsByDivision } = useDivisionCardData(divisionsNeeded, curDateStr, currentLocScope);

  const byproducts = useMemo(
    () => byproductsForSelection(catalogByDivision[dbDivision] || [], activeProduct, isVerticalLevelEntry),
    [catalogByDivision, dbDivision, isVerticalLevelEntry, activeProduct?.product, activeProduct?.vertical]
  );

  // 1 summary card per by-product, updating dynamically when date, location, or division changes.
  const byproductCardsData = useMemo(
    () => buildByproductCards(byproducts, activeProduct, dbDivision, cardStatsByDivision[dbDivision] || [], currentLocScope, curDate),
    [byproducts, dbDivision, cardStatsByDivision, curDate, curDateStr, activeProduct?.product, currentLocScope]
  );

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
        <div className="px-3 pt-9 pb-2.5 flex items-center justify-between gap-1.5 w-full">
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

      {/* By-Product Cards — 4-card visible grid (2 columns x 2 rows fit comfortably on screen) */}
      <div
        className="flex-1 overflow-y-auto px-2.5 sm:px-3 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)', scrollbarWidth: 'none' }}
      >
        {byproductCardsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 px-4">
            <p className="font-semibold text-sm">
              {lang === 'ur'
                ? 'کوئی ضمنی مصنوعات نہیں ملیں'
                : 'No by-products found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {byproductCardsData.map((card) => {
              const { bp, stats } = card;
              const navigateToDetail = () => push(productRatesScreenFor(card, curDateStr));

              return (
                <ByProductNationalCard
                  key={`${activeProduct?.product}-${bp}`}
                  stats={stats}
                  product={activeProduct?.product}
                  vertical={activeProduct?.vertical}
                  selectedDate={curDate}
                  onClick={navigateToDetail}
                  onMorePriceTypesClick={navigateToDetail}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

