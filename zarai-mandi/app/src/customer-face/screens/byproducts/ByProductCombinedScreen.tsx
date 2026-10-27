import { useEffect, useState } from "react";

import { fetchByProducts } from "../../../lib/api";

import { ByproductDatePill } from "../../components/ByproductDatePill";
import { ProductIcon } from "../../components/ProductIcon";
import { Icon, IconButton } from "../product-rates/ui";
import { ByProductSidebarFilterScreen } from "./ByProductSidebarFilterScreen";
import { byproductsForSelection, toDateStr } from "../../shared/data/byproductCards";
import { getDivisionForProduct } from "../../shared/data/catalog";
import { latestDatasetDay } from "../../shared/data/datasetDates";
import { toUrduDigits, URDU_FONT, useLang } from "../../shared/i18n/LangProvider";
import { type LocationScope, type ProductSel, type RateItem, type Screen } from "../../shared/types";

// ─── BY-PRODUCT SCREEN: header (product, date) + cards with the filter sidebar ───
// (the other card layouts tried earlier are in _archive/customer-face/screens/byproducts/testers).

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

  const { lang, tc: tcL, tm: tmL } = useLang();

  const currentLocScope: LocationScope = locationScope || { kind: 'pakistan', label: 'All Pakistan' };
  const dbDivision = getDivisionForProduct(activeProduct?.vertical, activeProduct?.product);

  const [selectedDate, setSelectedDate] = useState<Date | null>(latestDatasetDay());
  const curDate = selectedDate || latestDatasetDay();
  const curDateStr = toDateStr(curDate);

  // The by-products this screen lists (header count + the cards below).
  const [byproducts, setByproducts] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchByProducts(dbDivision)
      .then((catalog) => !cancelled && setByproducts(byproductsForSelection(catalog, activeProduct, isVerticalLevelEntry)))
      .catch(() => !cancelled && setByproducts([]));
    return () => {
      cancelled = true;
    };
  }, [dbDivision, isVerticalLevelEntry, activeProduct?.product, activeProduct?.vertical]); // eslint-disable-line react-hooks/exhaustive-deps

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
            {/* Same back button as the product rates screen (AppBar). */}
            <IconButton label={lang === 'ur' ? 'واپس' : 'Back'} onClick={onBack}>
              <Icon name="back" size={20} width={2.4} flip={lang === 'ur'} />
            </IconButton>
            <ProductIcon
              name={activeProduct?.product || 'Wheat'}
              vertical={activeProduct?.vertical}
              size={28}
              style={{ flexShrink: 0 }}
            />
            <div className="min-w-0 flex-1">
              <h2
                className="font-black text-[#183B34] text-base leading-tight break-words min-w-0"
                style={{ fontFamily: lang === 'ur' ? URDU_FONT : 'inherit' }}
              >
                {tcL(activeProduct?.product || 'Wheat')}
              </h2>
              <p className="text-[11px] font-semibold text-[#52635F] leading-tight break-words">
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

      <ByProductSidebarFilterScreen
        key={`${dbDivision}-${activeProduct?.product}`}
        dbDivision={dbDivision}
        activeProduct={activeProduct}
        byproducts={byproducts}
        curDate={curDate}
        curDateStr={curDateStr}
        locationScope={currentLocScope}
        push={push}
      />
    </div>
  );
}

