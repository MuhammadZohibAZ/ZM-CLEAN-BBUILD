// Complete Profile step 1: pick the products you are interested in, grouped as
// in View All, each at the same monthly price.

/** Products a group shows before "See more" (three rows of two). */
const PREVIEW = 6;

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { SEASON_PACKAGES } from "../../../data/seasonProductData";
import { PRODUCT_GROUPS, PRODUCT_PRICE_PER_MONTH } from "../../shared/data/catalog";
import { getProductPngIcon } from "../../shared/data/productPngIcons";
import { toUrduDigits, URDU_FONT, useLang } from "../../shared/i18n/LangProvider";
import { type CompleteProfileState } from "./useCompleteProfile";

/**
 * A product name on up to two lines, in a box that is always two lines tall so
 * every product card is the same size. Long names ("Organic & Biostimulants")
 * wrap at word breaks; the font steps down from `max` only when a name still
 * doesn't fit in two lines (one very long word), re-checked when the space changes.
 */
function TwoLineName({
  text,
  className,
  style,
  lineHeight,
  max = 13,
  min = 9,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
  lineHeight: number;
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
      // More than two lines (Urdu letters reach above and below their line, so
      // half a line of slack), or one word wider than the box.
      const overflows = () =>
        el.scrollHeight > lineHeight * size * 2.5 || el.scrollWidth > el.clientWidth + 0.5;
      while (size > min && overflows()) {
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
  }, [text, max, min, lineHeight]);
  return (
    <div className="flex-1 min-w-0 flex items-center" style={{ height: 2 * lineHeight * max }}>
      <span
        ref={ref}
        className={`min-w-0 w-full ${className ?? ""}`}
        style={{
          fontSize: max,
          lineHeight,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          overflowWrap: "normal",
          wordBreak: "normal",
          ...style,
        }}
      >
        {keepAbbreviationTogether(text)}
      </span>
    </div>
  );
}

/** A spelled-out abbreviation ("ایس ایس پی" = SSP: every word 3 letters or less)
 * stays on one line instead of breaking between its letters. */
function keepAbbreviationTogether(text: string): string {
  const words = text.trim().split(/\s+/);
  return words.length > 1 && words.every((w) => w.length <= 3) ? words.join("\u00A0") : text;
}

export function ProductsStep({ s }: { s: CompleteProfileState }) {
  const {
    data,
    lang,
    toggleProd,
  } = s;
  const { tc } = useLang();
  const availablePackages = SEASON_PACKAGES;
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
      {/* Title and the one price every product has */}
      <div>
        <h2
          className="font-black text-[20px] sm:text-[22px] text-[#143B33] leading-tight"
          style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
        >
          {lang === "ur" ? "اپنی مصنوعات منتخب کریں" : "Select Your Products"}
        </h2>
        <p
          className="text-[12px] font-bold text-[#087F63] mt-0.5"
          style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
        >
          {lang === "ur"
            ? `${toUrduDigits(PRODUCT_PRICE_PER_MONTH.toLocaleString())} روپے فی پروڈکٹ / ماہ`
            : `Rs ${PRODUCT_PRICE_PER_MONTH.toLocaleString()} per product / month`}
        </p>
      </div>

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
                    // Selected: the outline is thickened with an inset shadow, so the card keeps its size.
                    className={`rounded-2xl p-2 flex items-center justify-between gap-1 transition-all cursor-pointer border ${
                      isSelected
                        ? "border-[#087F63] bg-[#E8F8F3] shadow-[inset_0_0_0_1px_#087F63]"
                        : "border-[#D5E2DD] bg-white hover:border-[#B5CEC5]"
                    }`}
                  >
                    {/* Icon + Title (up to two lines; every card the same height) */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <img src={getProductPngIcon(pkg.name) ?? pkg.icon} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                      <TwoLineName
                        text={tc(pkg.name)}
                        lineHeight={lang === "ur" ? 1.6 : 1.2}
                        className={`font-bold ${isSelected ? "text-[#087F63]" : "text-[#183B34]"}`}
                        style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                      />
                    </div>
                    <div
                      className={`w-4 h-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "border-[#087F63] bg-[#087F63] text-white" : "border-[#9CA3AF] bg-white"
                      }`}
                    >
                      {isSelected && <span className="text-[9px] font-black">✓</span>}
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
