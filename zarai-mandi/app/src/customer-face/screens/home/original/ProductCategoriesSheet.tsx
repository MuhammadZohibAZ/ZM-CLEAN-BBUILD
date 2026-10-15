import { getProductSelectionsForDivision, PRODUCT_DIVISIONS } from "../../../shared/data/catalog";
import { getproductIconSrc } from "../../../shared/data/icons";
import { URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";
import type { Screen } from "../../../shared/types";

type Division = (typeof PRODUCT_DIVISIONS)[number];

/**
 * "View All" product-category grid (full screen): every division, active and
 * locked. Tap an unlocked one to open its by-products, a locked one to start
 * the subscribe flow, same as the Home row's tiles.
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

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        <div
          className="grid gap-x-2 gap-y-5"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          {[...activeProducts, ...lockedProducts].map((div) => {
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
                className="flex flex-col items-center tap-target"
              >
                <div
                  className={unlocked ? "zm-beam-border zm-beam-border-white" : "zm-beam-border zm-beam-border-green"}
                  style={{
                    width: "clamp(78px, 22vw, 92px)",
                    height: "clamp(78px, 22vw, 92px)",
                    borderRadius: "50%",
                    border: unlocked ? "3px solid #087F63" : "1.5px solid #BDD9CD",
                    background: unlocked ? "#F4FAF7" : "#E4EFE9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    boxShadow: unlocked ? "0 6px 18px rgba(8,127,99,0.22)" : "0 2px 6px rgba(18,65,48,0.06)",
                  }}
                >
                  <img
                    src={getproductIconSrc(div.name, verticalFor)}
                    alt={div.name}
                    style={{
                      width: "72%",
                      height: "72%",
                      objectFit: "contain",
                      opacity: unlocked ? 1 : 0.55,
                    }}
                  />
                  {!unlocked && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#7A8D85",
                        color: "#fff",
                        border: "2px solid #F1F7F4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                      }}
                    >
                      🔒
                    </span>
                  )}
                </div>
                <span
                  className="text-center"
                  style={{
                    marginTop: 6,
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: unlocked ? "#183B34" : "#6B7C76",
                    fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                    lineHeight: 1.15,
                  }}
                >
                  {tc(div.name)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
