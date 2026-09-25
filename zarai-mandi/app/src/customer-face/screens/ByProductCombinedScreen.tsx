import { useState, useEffect, useMemo } from "react";
import {
  fetchVerticalCardStats,
  fetchByProducts,
  type CardStats,
  type ByProductCatalogRow,
} from "../../lib/api";

import {
  apiCardStatsToUi,
  ByProductNationalCard,
  emptyByproductStats,
  getCardUpdatedMinutes,
} from "../components/ByProductNationalCard";
import { ProductIcon } from "../components/ProductIcon";
import { calculateByproductSummary } from "../shared/data/byproductStats";
import { getDivisionForProduct, PRODUCT_DIVISIONS, VERTICALS } from "../shared/data/catalog";
import { FLAT_ALL_MANDI_ROWS } from "../shared/data/mandis";
import { toUrduDigits, URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type LocationScope, type ProductSel, type RateItem, type Screen } from "../shared/types";

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
  // Both requests are cached client-side, so revisiting a division within the
  // session doesn't re-fetch.
  const dbDivision = getDivisionForProduct(activeProduct?.vertical, activeProduct?.product);
  const divisionsNeeded = useMemo(
    () => [dbDivision],
    [dbDivision]
  );
  const [catalogByDivision, setCatalogByDivision] = useState<Record<string, ByProductCatalogRow[]>>({});
  const [cardStatsByDivision, setCardStatsByDivision] = useState<Record<string, CardStats[]>>({});

  const byproducts = useMemo(() => {
    const rawCatalog = catalogByDivision[dbDivision] || [];
    if (!isVerticalLevelEntry) {
      // Product level (e.g. Wheat, Maize, Sesame): show all catalog items for this division
      return rawCatalog.map((c) => c.by_product);
    }
    // Vertical level (e.g. Edible Oil -> Canola tab, Fruits -> Apple tab): filter catalog to items matching this sub-product
    const subProd = activeProduct?.product || '';
    const subBps = productByproducts(activeProduct?.vertical || '', subProd);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normSub = norm(subProd);

    const filtered = rawCatalog.filter((c) => {
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
    });

    if (filtered.length > 0) {
      return filtered.map((c) => c.by_product);
    }
    // Fallback if catalog not loaded yet or no filter matches
    return subBps.length > 0 ? subBps : rawCatalog.map((c) => c.by_product);
  }, [catalogByDivision, dbDivision, isVerticalLevelEntry, activeProduct?.product, activeProduct?.vertical]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 8, 14));
  const [isDateCalOpen, setIsDateCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(new Date(2026, 8, 14));

  const curDate = selectedDate || new Date(2026, 8, 14);
  const curDateStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;

  // Gregorian + Lunar Islamic Date Object (2-line layout with dash)
  const dateInfo = useMemo(() => {
    const d = curDate;
    const islamic = getIslamicDate(d, lang);
    const monthsUr = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = d.getDate();
    const mIdx = d.getMonth();
    const gregDayMonth = lang === 'ur' ? `${toUrduDigits(day)} ${monthsUr[mIdx]}` : `${day} ${monthsEn[mIdx]}`;
    const gregYear = lang === 'ur' ? toUrduDigits(d.getFullYear()) : String(d.getFullYear());

    return {
      gregDayMonth,
      gregYear,
      hijriDayMonth: lang === 'ur' ? `${toUrduDigits(islamic.day)} ${islamic.monthName}` : `${islamic.day} ${islamic.monthName}`,
      hijriYear: lang === 'ur' ? `${toUrduDigits(islamic.year)} ھ` : `${islamic.year} A.H`,
    };
  }, [curDate, lang]);

  // Fetch the real by-product catalog + card stats for the active
  // division(s) whenever the division, date or location scope changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        divisionsNeeded.map(async (division) => {
          const [catalog, stats] = await Promise.all([
            fetchByProducts(division),
            fetchVerticalCardStats(division, {
              date: curDateStr,
              locationKind: currentLocScope.kind,
              locationLabel: currentLocScope.label,
            }),
          ]);
          return { division, catalog, stats };
        })
      );
      if (cancelled) return;
      setCatalogByDivision((prev) => {
        const next = { ...prev };
        for (const e of entries) next[e.division] = e.catalog;
        return next;
      });
      setCardStatsByDivision((prev) => {
        const next = { ...prev };
        for (const e of entries) next[e.division] = e.stats;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [divisionsNeeded.join('|'), curDateStr, currentLocScope.kind, currentLocScope.label]);

  // 1 summary card per by-product, updating dynamically when date, location, or division changes.
  const byproductCardsData = useMemo(() => {
    const statsForDivision = cardStatsByDivision[dbDivision] || [];
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const list = byproducts.map((bp) => {
      const normBp = norm(bp);
      const raw = statsForDivision.find((s) => norm(s.byproduct) === normBp || s.byproduct.toLowerCase() === bp.toLowerCase());
      let stats = raw ? apiCardStatsToUi(raw) : emptyByproductStats(dbDivision, bp);

      // Compute date-specific rates and arrivals from the dataset for the selected date
      const localStats = calculateByproductSummary(activeProduct?.product || dbDivision, bp, currentLocScope, curDate);
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

      return {
        bp,
        stats,
      };
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
  }, [byproducts, dbDivision, cardStatsByDivision, curDate, curDateStr, activeProduct?.product, currentLocScope]);

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
        <div className="px-3 pt-9 pb-2.5 flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="tap-target zm-beam-border w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 text-[#183B34] transition active:scale-95"
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
              size={32}
              style={{ flexShrink: 0 }}
            />
            <div className="min-w-0">
              <h2
                className="font-black text-[#183B34] text-base leading-tight truncate"
                style={{ fontFamily: lang === 'ur' ? URDU_FONT : 'inherit' }}
              >
                {tcL(activeProduct?.product || 'Wheat')}
              </h2>
              <p className="text-[11px] font-semibold text-[#52635F] leading-tight">
                {lang === 'ur'
                  ? `${toUrduDigits(byproducts.length)} ضمنی مصنوعات`
                  : `${byproducts.length} By-products`}
              </p>
            </div>
          </div>

          {/* Gregorian + Lunar Islamic Date Pill (Clickable Date Filter) */}
          <button
            type="button"
            onClick={() => setIsDateCalOpen(true)}
            className="tap-target flex items-center gap-1.5 px-2.5 py-1 rounded-2xl flex-shrink-0 cursor-pointer transition active:scale-95 text-left"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1.2px solid rgba(16, 185, 129, 0.45)',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#075E4F"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>

            <div
              className="flex items-center gap-1.5 text-[#075E4F]"
              style={{ fontFamily: lang === 'ur' ? URDU_FONT : 'inherit' }}
            >
              {/* Left Column: Gregorian Date & Year */}
              <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] font-extrabold whitespace-nowrap">
                  {dateInfo.gregDayMonth}
                </span>
                <span className="text-[8.5px] font-bold text-[#087F63]/80 tracking-wide mt-0.5 whitespace-nowrap">
                  {dateInfo.gregYear}
                </span>
              </div>

              {/* Dash separator */}
              <span className="text-xs font-bold text-[#10B981] pb-0.5">-</span>

              {/* Right Column: Hijri Date & Year */}
              <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] font-extrabold whitespace-nowrap">
                  {dateInfo.hijriDayMonth}
                </span>
                <span className="text-[8.5px] font-bold text-[#087F63]/80 tracking-wide mt-0.5 whitespace-nowrap">
                  {dateInfo.hijriYear}
                </span>
              </div>
            </div>

            <span className="text-[9px] text-[#075E4F] font-bold opacity-70 ml-0.5">▾</span>
          </button>
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

      {/* Date Calendar Modal for Screen 2 */}
      {isDateCalOpen && (() => {
        const mn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mnUr = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
        const sdYear = calMonth.getFullYear();
        const sdMonthIdx = calMonth.getMonth();
        const sdMonthName = lang === "ur"
          ? `${mnUr[sdMonthIdx]} ${toUrduDigits(sdYear)}`
          : calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const sdFirstDow = new Date(sdYear, sdMonthIdx, 1).getDay();
        const sdDaysInMonth = new Date(sdYear, sdMonthIdx + 1, 0).getDate();
        const sdCalDays: (number | null)[] = [
          ...Array(sdFirstDow).fill(null),
          ...Array.from({ length: sdDaysInMonth }, (_, i) => i + 1),
        ];
        while (sdCalDays.length % 7 !== 0) sdCalDays.push(null);
        const sdIsSame = (a: Date, b: Date) =>
          a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
        const sdIsRef = (d: Date) => sdIsSame(d, new Date(2026, 8, 14));

        return (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setIsDateCalOpen(false)}
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl w-[280px] sm:w-[300px] screen-enter"
              style={{ background: "#F4FAF7", border: "1.5px solid #10B981" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 pt-3.5 pb-3">
                <div className="flex items-center justify-between mb-2.5">
                  <button
                    onClick={() => setCalMonth(new Date(sdYear, sdMonthIdx - 1, 1))}
                    className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold transition active:scale-90"
                    style={{ background: "#E8EFEC", color: "#2F4A43", fontSize: 16 }}
                  >
                    ‹
                  </button>
                  <p
                    className="font-extrabold text-[#183B34]"
                    style={{
                      fontSize: lang === "ur" ? 16 : 14,
                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                    }}
                  >
                    {sdMonthName}
                  </p>
                  <button
                    onClick={() => setCalMonth(new Date(sdYear, sdMonthIdx + 1, 1))}
                    className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold transition active:scale-90"
                    style={{ background: "#E8EFEC", color: "#2F4A43", fontSize: 16 }}
                  >
                    ›
                  </button>
                </div>

                {selectedDate && (
                  <div className="flex justify-end mb-1.5">
                    <button
                      onClick={() => {
                        setSelectedDate(new Date(2026, 8, 14));
                        setIsDateCalOpen(false);
                      }}
                      className="font-bold px-2 py-0.5 rounded-full transition active:scale-95 shadow-sm"
                      style={{
                        background: "#E0F2FE",
                        color: "#0369A1",
                        fontSize: lang === "ur" ? 12 : 10,
                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                      }}
                    >
                      {lang === "ur" ? "۱۴ ستمبر (تازہ ترین)" : "14 Sep (Latest)"}
                    </button>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
                  {(lang === "ur"
                    ? ["ات", "پی", "من", "بد", "جم", "جم", "ہف"]
                    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
                  ).map((d, i) => (
                    <div
                      key={i}
                      className="text-center font-bold text-[10px]"
                      style={{
                        color: "#80918B",
                        paddingBottom: 2,
                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                  {sdCalDays.map((day, idx) => {
                    if (!day) return <div key={idx} />;
                    const d = new Date(sdYear, sdMonthIdx, day);
                    const selected = selectedDate ? sdIsSame(d, selectedDate) : false;
                    const isRef = sdIsRef(d);
                    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const inRange = dStr >= "2026-08-15" && dStr <= "2026-09-14";

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDate(d);
                          setIsDateCalOpen(false);
                        }}
                        className="tap-target flex items-center justify-center rounded-full font-bold text-xs mx-auto transition active:scale-90"
                        style={{
                          width: 32,
                          height: 32,
                          background: selected
                            ? "#087F63"
                            : isRef
                              ? "#E4F2EC"
                              : inRange
                                ? "rgba(16, 185, 129, 0.08)"
                                : "transparent",
                          color: selected
                            ? "#fff"
                            : isRef
                              ? "#075E4F"
                              : inRange
                                ? "#143B33"
                                : "#94A3B8",
                          border: isRef && !selected
                            ? "1.5px solid #087F63"
                            : selected
                              ? "none"
                              : inRange
                                ? "1px solid rgba(16, 185, 129, 0.25)"
                                : "none",
                        }}
                      >
                        {lang === "ur" ? toUrduDigits(day) : day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* By-Product Cards — 4-card visible grid (2 columns x 2 rows fit comfortably on screen) */}
      <div
        className="flex-1 overflow-y-auto px-2.5 sm:px-3 pt-2 pb-6"
        style={{ scrollbarWidth: 'none' }}
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
            {byproductCardsData.map(({ bp, stats }) => {
              const navigateToDetail = () => {
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

                push({
                  id: 'product-rates',
                  vertical: activeProduct?.vertical || 'Grains',
                  product: activeProduct?.product || 'Wheat',
                  byproduct: bp,
                  initialRateType: stats.mostOccurringRateType,
                  initialMoisture: initMoisture,
                  initialColor: initColor,
                  initialVariety: initVariety,
                  initialNewOld: initNewOld,
                  initialSpec: initSpec,
                  initialStatDate: curDateStr,
                });
              };

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

// ─── Islamic / Lunar Calendar Helper ──────────────────────────

// ─── Islamic / Lunar Calendar Helper ──────────────────────────
export function getIslamicDate(
  gregorianDate: Date,
  lang: string,
): { day: number; monthName: string; fullText: string; year: number } {
  const islamicMonthsEn = [
    "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
    "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhul Qada", "Dhul Hijja",
  ];
  const islamicMonthsUr = [
    "محرم", "صفر", "ربیع الاول", "ربیع الثانی",
    "جمادی الاول", "جمادی الثانی", "رجب", "شعبان",
    "رمضان", "شوال", "ذیقعد", "ذی الحجہ",
  ];

  // Tabular Islamic calendar approximation
  const jd = Math.floor(
    (gregorianDate.getTime() / 86400000) + 2440587.5,
  ) + 1;
  const epoch = 1948440;
  const z = jd - epoch;
  const cycle = Math.floor(z / 10631);
  const rem = z % 10631;
  const year = cycle * 30 + Math.floor((rem * 30 + 29) / 10631) + 1;
  const dayOfYear = jd - Math.floor(epoch + ((year - 1) * 354.3670)) + 1;
  const monthApprox = Math.min(
    Math.floor((jd - (epoch + Math.floor((year - 1) * 354.3670))) / 29.53),
    11,
  );
  const month = Math.max(0, Math.min(11, monthApprox));
  const monthStart = epoch + Math.floor((year - 1) * 354.3670) + Math.floor(month * 29.53);
  const day = Math.max(1, Math.min(30, jd - Math.floor(monthStart) + 1));

  const monthName = lang === "ur" ? islamicMonthsUr[month] : islamicMonthsEn[month];
  const dayStr = lang === "ur" ? toUrduDigits(day) : String(day);
  const fullText = lang === "ur" ? `${dayStr} ${monthName}` : `${dayStr} ${monthName}`;

  return { day, monthName, fullText, year };
}
