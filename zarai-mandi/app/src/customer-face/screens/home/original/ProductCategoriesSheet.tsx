import { useState } from "react";

import {
  getProductSelectionsForDivision,
  PRODUCT_DIVISIONS,
  PRODUCT_GROUPS,
} from "../../../shared/data/catalog";
import { getproductIconSrc } from "../../../shared/data/icons";
import { getProductPngIcon } from "../../../shared/data/productPngIcons";
import { toUrduDigits, URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";
import type { Screen } from "../../../shared/types";

type Division = (typeof PRODUCT_DIVISIONS)[number];

/** Products a group card shows before "See more" (two rows). */
const PREVIEW = 6;

/**
 * "View All" (full screen): every product, one card per group (Crops, Fertilizer,
 * Fruits, ...) showing two rows and "See more". Tap an unlocked product to open
 * its by-products, a locked one to start the subscribe flow, as on Home.
 */
export function ProductCategoriesSheet({
  activeProducts,
  lockedProducts,
  isAccessible,
  getVerticalForProduct,
  handleLockedProductClick,
  onClose,
  push,
}: {
  activeProducts: Division[];
  lockedProducts: Division[];
  isAccessible: (name: string) => boolean;
  getVerticalForProduct: (name: string) => string;
  handleLockedProductClick: (divName: string, verticalFor?: string) => void;
  onClose: () => void;
  push: (s: Screen) => void;
}) {
  const { lang, tc } = useLang();
  const all = [...activeProducts, ...lockedProducts];
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const tile = (div: Division) => {
    const verticalFor = getVerticalForProduct(div.name);
    const unlocked = isAccessible(div.name);
    return (
      <button
        key={div.name}
        onClick={() => {
          onClose();
          if (unlocked) {
            const selProducts = getProductSelectionsForDivision(div.name);
            push({ id: "byproduct-combined", products: selProducts, active: 0 });
          } else {
            handleLockedProductClick(div.name, verticalFor);
          }
        }}
        className="flex flex-col items-center tap-target min-w-0"
      >
        <div
          style={{
            width: "clamp(62px, 17vw, 74px)",
            height: "clamp(62px, 17vw, 74px)",
            borderRadius: "50%",
            border: unlocked ? "2.5px solid #087F63" : "1.5px solid #BDD9CD",
            background: unlocked ? "#F4FAF7" : "#E4EFE9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: unlocked ? "0 4px 12px rgba(8,127,99,0.16)" : "0 2px 6px rgba(18,65,48,0.06)",
          }}
        >
          <img
            src={getProductPngIcon(div.name) ?? getproductIconSrc(div.name, verticalFor)}
            alt=""
            style={{ width: "70%", height: "70%", objectFit: "contain", opacity: unlocked ? 1 : 0.55 }}
          />
          {!unlocked && (
            <span
              style={{
                position: "absolute",
                bottom: -2,
                insetInlineEnd: -2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#7A8D85",
                color: "#fff",
                border: "2px solid #FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
              }}
            >
              🔒
            </span>
          )}
        </div>
        <span
          className="text-center break-words w-full"
          style={{
            marginTop: 5,
            fontSize: 12,
            fontWeight: 800,
            color: unlocked ? "#183B34" : "#6B7C76",
            fontFamily: lang === "ur" ? URDU_FONT : "inherit",
            lineHeight: lang === "ur" ? 1.7 : 1.15,
          }}
        >
          {tc(div.name)}
        </span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 flex flex-col screen-enter"
      style={{ zIndex: 340, background: "#F1F7F4" }}
    >
      <header
        className="flex-shrink-0 flex items-center gap-2 px-4 pb-3"
        style={{
          paddingTop: "max(36px, calc(var(--zm-bleed-top) + 10px))",
          background: "rgba(244, 250, 247, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(213, 226, 221, 0.8)",
        }}
      >
        <button
          onClick={() => onClose()}
          className="tap-target zm-beam-border w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 text-[#183B34] transition active:scale-95"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
            border: "1.2px solid rgba(16, 185, 129, 0.4)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {lang === "ur" ? "→" : "←"}
        </button>
        <h2
          className="text-[16px] font-black text-[#143B33]"
          style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
        >
          {lang === "ur" ? "تمام مصنوعات" : "All Products"}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8 flex flex-col gap-3">
        {PRODUCT_GROUPS.map((g) => {
          const items = all.filter((d) => d.group === g.id);
          if (items.length === 0) return null;
          const isOpen = open.has(g.id) || items.length <= PREVIEW;
          return (
            <section
              key={g.id}
              className="rounded-[18px] bg-white px-3 pt-3 pb-2"
              style={{ border: "1.5px solid #D1E5DC", boxShadow: "0 3px 12px rgba(6,77,64,0.06)" }}
            >
              <div className="flex items-baseline justify-between gap-2 px-1 mb-2.5">
                <h3
                  className="text-[15px] font-black text-[#143B33]"
                  style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                >
                  {lang === "ur" ? g.ur : g.en}
                </h3>
                <span
                  className="text-[11px] font-bold text-[#52635F]"
                  style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                >
                  {lang === "ur" ? `${toUrduDigits(items.length)} مصنوعات` : `${items.length} product${items.length === 1 ? "" : "s"}`}
                </span>
              </div>
              <div className="grid gap-x-2 gap-y-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                {(isOpen ? items : items.slice(0, PREVIEW)).map(tile)}
              </div>
              {items.length > PREVIEW && (
                <button
                  type="button"
                  onClick={() => toggle(g.id)}
                  aria-expanded={isOpen}
                  className="tap-target w-full mt-1.5 py-2 rounded-xl flex items-center justify-center gap-1 text-[12.5px] font-bold text-[#087F63] active:bg-[#E8F8F3]"
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
    </div>
  );
}
