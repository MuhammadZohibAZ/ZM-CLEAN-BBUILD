import { LockIconSVG } from "../../../components/icons";
import { getProductSelectionsForDivision, PRODUCT_DIVISIONS } from "../../../shared/data/catalog";
import { getproductIconSrc } from "../../../shared/data/icons";
import { URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";
import type { Screen } from "../../../shared/types";

type Division = (typeof PRODUCT_DIVISIONS)[number];

/** Icons drawn edge to edge in a square (no empty margin): shown smaller so
 * the whole square fits inside the round frame (a circle's inner square is ~70%). */
const FULL_BLEED_ICONS = new Set(["Edible Oil", "Livestock"]);

/**
 * Original Home · "Products": the user's active products (green ring, tap to
 * open the by-product screen) followed by locked ones (tap to subscribe), with
 * a "View All" button for the full category grid.
 */
export function HomeProductsSection({
  activeProducts,
  lockedProducts,
  getVerticalForProduct,
  handleOrientationTap,
  handleLockedProductClick,
  onViewAll,
  push,
  voiceGuideActive,
  highlight,
}: {
  activeProducts: Division[];
  lockedProducts: Division[];
  getVerticalForProduct: (name: string) => string;
  handleOrientationTap: (key: string, speakMsg: string, navigateFn: () => void) => void;
  handleLockedProductClick: (divName: string, verticalFor?: string) => void;
  /** Opens the full product-category grid. */
  onViewAll: () => void;
  push: (s: Screen) => void;
  voiceGuideActive?: boolean;
  /** Product just found by search: ringed for a moment. */
  highlight?: string | null;
}) {
  const { lang, t, tc } = useLang();
  return (
    <section
      style={{
        paddingTop: "clamp(30px, 4.2vh, 48px)",
        paddingBottom: 0,
      }}
    >
      <div className="px-4 flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">

          <p
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#183B34",
              letterSpacing: lang === "ur" ? "0" : "0.02em",
              fontFamily:
                lang === "ur"
                  ? URDU_FONT
                  : "inherit",
            }}
          >
            {t("Products")}
          </p>
        </div>

        {/* View All Button -- opens the full category grid (all ~20
            products, active + locked), not a jump into Wheat */}
        <button
          onClick={() =>
            handleOrientationTap(
              "all-products",
              lang === "ur" ? "تمام مصنوعات" : "All Products",
              () => onViewAll(),
            )
          }
          className="tap-target zm-beam-border flex items-center justify-center rounded-full px-3 py-1 transition active:scale-95"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            border: "1.2px solid rgba(16, 185, 129, 0.35)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#087F63",
            fontSize: "12px",
            fontWeight: 700,
            gap: "4px",
            fontFamily: lang === "ur" ? URDU_FONT : "inherit",
          }}
        >
          <span>{lang === "ur" ? "سب دیکھیں" : "View All"}</span>
          <span style={{ fontSize: "12px", fontWeight: 800 }}>
            {lang === "ur" ? "←" : "›"}
          </span>
        </button>
      </div>

      <div
        className="flex items-start overflow-x-auto px-4 pb-1.5"
        style={{
          scrollbarWidth: "none",
          gap: "clamp(16px, 4.5vw, 22px)",
        }}
      >
        {activeProducts.map((div) => {
          const verticalFor = getVerticalForProduct(div.name);

          return (
            <button
              key={div.name}
              data-home-product={div.name}
              onClick={() =>
                handleOrientationTap("product", tc(div.name), () => {
                  const selProducts = getProductSelectionsForDivision(div.name);
                  push({
                    id: "byproduct-combined",
                    products: selProducts,
                    active: 0,
                  });
                })
              }
              className="flex-shrink-0 flex flex-col items-center tap-target"
              style={{
                width: "clamp(102px, 26vw, 122px)",
                zIndex: voiceGuideActive ? 45 : undefined,
              }}
            >
              {/* Active Circle - Grown to fill space luxuriously */}
              <div
                className="zm-beam-border zm-beam-border-white"
                style={{
                  width: "clamp(68px, calc(15vh - 28px), 116px)",
                  height: "clamp(68px, calc(15vh - 28px), 116px)",
                  borderRadius: "50%",
                  border: "3px solid #087F63",
                  background: "#F4FAF7",
                  outline: highlight === div.name ? "4px solid rgba(245, 158, 11, 0.75)" : "none",
                  outlineOffset: 3,
                  transform: highlight === div.name ? "scale(1.06)" : "none",
                  transition: "transform 250ms ease, outline-color 250ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  boxShadow: "0 6px 18px rgba(8,127,99,0.22)",
                }}
              >
                <img
                  src={getproductIconSrc(div.name, verticalFor)}
                  alt={div.name}
                  style={{
                    width: FULL_BLEED_ICONS.has(div.name) ? "66%" : "80%",
                    height: FULL_BLEED_ICONS.has(div.name) ? "66%" : "80%",
                    objectFit: "contain",
                  }}
                />

              </div>

              {/* Name */}
              <span
                style={{
                  marginTop: 6,
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#183B34",
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                  lineHeight: 1.15,
                }}
              >
                {tc(div.name)}
              </span>

              {/* Active Badge */}
              <span
                className="zm-beam-border zm-beam-border-white [@media(max-height:700px)]:hidden"
                style={{
                  marginTop: 3,
                  padding: "2.5px 11px",
                  borderRadius: 9999,
                  background: "linear-gradient(135deg, rgba(8, 127, 99, 0.95), rgba(5, 150, 105, 0.9))",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  boxShadow: "0 2px 8px rgba(8, 127, 99, 0.25)",
                  color: "#fff",
                  fontSize: 9.5,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                }}
              >
                {t("ACTIVE")}
              </span>
            </button>
          );
        })}

        {/* Locked Products */}
        {lockedProducts.map((div) => {
          const verticalFor = getVerticalForProduct(div.name);
          const iconSrc = getproductIconSrc(div.name, verticalFor);

          return (
            <button
              key={div.name}
              data-home-product={div.name}
              onClick={() =>
                handleLockedProductClick(div.name, verticalFor)
              }
              className="flex-shrink-0 flex flex-col items-center tap-target"
              style={{
                width: "clamp(74px, 18vw, 86px)",
              }}
            >
              {/* Locked circle */}
              <div
                className="zm-beam-border zm-beam-border-green"
                style={{
                  width: "clamp(56px, calc(10vh - 6px), 80px)",
                  height: "clamp(56px, calc(10vh - 6px), 80px)",
                  outline: highlight === div.name ? "4px solid rgba(245, 158, 11, 0.75)" : "none",
                  outlineOffset: 3,
                  marginTop: "max(0px, calc(2.5vh - 11px))",
                  borderRadius: "50%",
                  background: "#E4EFE9",
                  border: "1.5px solid #BDD9CD",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 2px 6px rgba(18,65,48,0.06)",
                }}
              >
                <img
                  src={iconSrc}
                  alt={div.name}
                  style={{
                    width: "75%",
                    height: "75%",
                    objectFit: "contain",
                    filter: "blur(2px) grayscale(20%)",
                    opacity: 0.55,
                    position: "absolute",
                  }}
                />

                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.85)",
                    backdropFilter: "blur(2px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    zIndex: 2,
                    border: "1px solid rgba(255, 255, 255, 0.9)",
                  }}
                >
                  <LockIconSVG
                    size={12}
                    color="#2A483E"
                  />
                </div>
              </div>

              <span
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: "#475F57",
                  fontWeight: 700,
                  textAlign: "center",
                  lineHeight: 1.15,
                  maxWidth: 76,
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                }}
              >
                {tc(div.name)}
              </span>

              <span
                className="zm-beam-border zm-beam-border-green"
                style={{
                  marginTop: 2,
                  padding: "2px 8px",
                  borderRadius: 9999,
                  background: "rgba(228, 240, 234, 0.75)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  boxShadow: "0 1.5px 4px rgba(8, 127, 99, 0.08)",
                  color: "#35594C",
                  fontSize: 9,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  fontFamily:
                    lang === "ur"
                      ? URDU_FONT
                      : "inherit",
                }}
              >
                {t("Subscribe")}
              </span>
            </button>
          );
        })}
      </div>
    </section>

  );
}
