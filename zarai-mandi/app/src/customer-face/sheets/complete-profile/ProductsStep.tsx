// Complete Profile step 1: pick the products you are interested in (in season
// for the month), grouped as in View All, each at the same monthly price.

/** Products a group shows before "See more" (three rows of two). */
const PREVIEW = 6;

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { getPackagesForMonth, MONTH_KEYS, MONTH_NAMES_EN } from "../../../data/seasonProductData";
import { PRODUCT_GROUPS, PRODUCT_PRICE_PER_MONTH } from "../../shared/data/catalog";
import { toUrduDigits, URDU_FONT, useLang } from "../../shared/i18n/LangProvider";
import { type CompleteProfileState } from "./useCompleteProfile";

/** A product name kept on one line: the font steps down from `max` only as far
 * as needed to fit the space it has (re-checked when that space changes). */
function OneLineName({
  text,
  className,
  style,
  max = 13,
  min = 8,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
  max?: number;
  min?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      while (size > min && el.scrollWidth > el.clientWidth + 0.5) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    // Fonts (Urdu especially) can arrive after the first measure.
    document.fonts?.ready.then(fit).catch(() => {});
    const parent = el.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [text, max, min]);
  return (
    <span
      ref={ref}
      className={`block flex-1 min-w-0 whitespace-nowrap ${className ?? ""}`}
      style={{ fontSize: max, ...style }}
    >
      {text}
    </span>
  );
}

export function ProductsStep({ s }: { s: CompleteProfileState }) {
  const {
    data,
    lang,
    demoMonthIdx,
    setDemoMonthIdx,
    isMonthPickerOpen,
    setIsMonthPickerOpen,
    toggleProd,
  } = s;
  const { tc } = useLang();
  const availablePackages = getPackagesForMonth(MONTH_KEYS[demoMonthIdx]);
  const currentMonthNameEn = MONTH_NAMES_EN[demoMonthIdx];
  const isPicked = (p: { name: string; id: string }) =>
    data.selectedProds.includes(p.name) || data.selectedProds.includes(p.id);

  // Groups opened with "See more".
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Title & Subtitle + Subtle Demo Month Switcher on Top Right */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2
            className="font-black text-[20px] sm:text-[22px] text-[#143B33] leading-tight"
            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
          >
            {lang === "ur" ? "اپنی مصنوعات منتخب کریں" : "Select Your Products"}
          </h2>
          <p
            className="text-[12px] font-medium text-[#52635F] mt-0.5"
            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
          >
            {lang === "ur"
              ? "اپنی سبسکرپشن مصنوعات منتخب کریں۔"
              : "Choose your subscription products."}
          </p>
        </div>

        {/* Subtle Demo Month Switcher */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            className="tap-target flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#D5E2DD] text-[#52635F] hover:border-[#087F63] hover:text-[#087F63] transition-all shadow-2xs"
            title="Change demonstration month"
          >
            <span className="text-[11px] font-bold">
              Demo:{" "}
              <span className="text-[#087F63] font-black">
                {currentMonthNameEn}
              </span>
            </span>
            <span className="text-[10px] text-[#9CA3AF]">▾</span>
          </button>

          {/* Floating Dropdown Month Menu */}
          {isMonthPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsMonthPickerOpen(false)}
              />
              <div
                className="absolute right-0 top-8 z-50 bg-white rounded-2xl p-2 shadow-2xl border border-[#E2E8F0] grid grid-cols-3 gap-1 w-[240px] animate-fadeIn"
                style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
              >
                {MONTH_NAMES_EN.map((mName, mIdx) => {
                  const isCur = demoMonthIdx === mIdx;
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => {
                        setDemoMonthIdx(mIdx);
                        setIsMonthPickerOpen(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition text-center ${
                        isCur
                          ? "bg-[#087F63] text-white"
                          : "text-[#374151] hover:bg-[#F3F4F6]"
                      }`}
                    >
                      {mName.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Price line, then one section per group (Crops, Fertilizer, Fruits, ...):
          picked products first, two rows, then "See more". */}
      <p
        className="text-[12px] font-bold text-[#087F63] -mt-1"
        style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
      >
        {lang === "ur"
          ? `ہر پروڈکٹ ${toUrduDigits(PRODUCT_PRICE_PER_MONTH.toLocaleString())} روپے ماہانہ`
          : `Every product PKR ${PRODUCT_PRICE_PER_MONTH.toLocaleString()} / month`}
      </p>
      {PRODUCT_GROUPS.map((g) => {
        const items = availablePackages
          .filter((p) => p.group === g.id)
          .map((p, i) => ({ p, i }))
          .sort((a, b) => Number(isPicked(b.p)) - Number(isPicked(a.p)) || a.i - b.i)
          .map(({ p }) => p);
        if (items.length === 0) return null;
        const isOpen = openGroups.has(g.id) || items.length <= PREVIEW;
        return (
          <section key={g.id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between px-0.5">
              <h3
                className="text-[13.5px] font-black text-[#143B33]"
                style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
              >
                {lang === "ur" ? g.ur : g.en}
              </h3>
              <span className="text-[11px] font-bold text-[#52635F]" style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}>
                {lang === "ur" ? `${toUrduDigits(items.length)} مصنوعات` : `${items.length} product${items.length === 1 ? "" : "s"}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(isOpen ? items : items.slice(0, PREVIEW)).map((pkg) => {
                const isSelected = isPicked(pkg);
                return (
                  <div
                    key={pkg.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => toggleProd(pkg.name)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleProd(pkg.name)}
                    className={`rounded-2xl p-2 flex items-center justify-between gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#087F63] bg-[#E8F8F3] shadow-xs"
                        : "border border-[#D5E2DD] bg-white hover:border-[#B5CEC5]"
                    }`}
                  >
                    {/* Icon + Title (title always on one line) */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <img src={pkg.icon} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                      <OneLineName
                        text={tc(pkg.name)}
                        className={`font-bold ${isSelected ? "text-[#087F63]" : "text-[#183B34]"}`}
                        style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                      />
                    </div>
                    <div
                      className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "border-[#087F63] bg-[#087F63] text-white" : "border-[#9CA3AF] bg-white"
                      }`}
                    >
                      {isSelected && <span className="text-[10px] font-black">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {items.length > PREVIEW && (
              <button
                type="button"
                onClick={() => toggleGroup(g.id)}
                aria-expanded={isOpen}
                className="tap-target self-center flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-bold text-[#087F63] active:bg-[#E8F8F3]"
                style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
              >
                {isOpen
                  ? lang === "ur" ? "کم دکھائیں" : "See less"
                  : lang === "ur"
                    ? `مزید دیکھیں (${toUrduDigits(items.length - PREVIEW)})`
                    : `See more (${items.length - PREVIEW})`}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: isOpen ? "rotate(180deg)" : undefined }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
