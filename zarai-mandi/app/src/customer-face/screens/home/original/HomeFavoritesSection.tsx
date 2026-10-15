import { FavoriteCardsRow } from "../../../components/FavoriteCardsRow";
import { URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";
import type { RateItem, Screen } from "../../../shared/types";

/** Shown until the user favourites something. */
const DEFAULT_FAVOURITES = ["Wheat", "Maida", "Flour", "Wheat Bran", "Semolina", "Straw", "Sorghum", "Barley", "Special Flour"];

/**
 * Original Home · "Favorites": heading with "See All", then the favourited
 * by-products as the by-product screen's cards (components/FavoriteCardsRow).
 */
export function HomeFavoritesSection({
  pickedByproducts,
  handleOrientationTap,
  push,
  voiceGuideActive,
}: {
  pickedByproducts: RateItem[];
  handleOrientationTap: (key: string, speakMsg: string, navigateFn: () => void) => void;
  push: (s: Screen) => void;
  voiceGuideActive?: boolean;
}) {
  const { lang, t } = useLang();
  return (
    <section
      className="px-4"
      style={{
        position: "relative",
        zIndex: voiceGuideActive ? 45 : 10,
        paddingTop: "10px",
      }}
    >
      {/* Favorites heading */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <p
              style={{
                fontSize: "clamp(18px, 2.5vh, 22px)",
                fontWeight: 800,
                color: "#183B34",
                lineHeight: 1.2,
                fontFamily:
                  lang === "ur"
                    ? URDU_FONT
                    : "inherit",
              }}
            >
              {t("Favorites")}
            </p>

          </div>
        </div>

        {/* See All Button */}
        <button
          onClick={() => {
            handleOrientationTap(
              "favorites-all",
              lang === "ur" ? "پسندیدہ ریٹس" : "Favorite Rates",
              () => {
                push({
                  id: "byproduct-combined",
                  products: [
                    {
                      vertical: "Grains",
                      product: "Wheat",
                    },
                  ],
                  active: 0,
                });
              },
            );
          }}
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
          <span>{lang === "ur" ? "سب دیکھیں" : "See All"}</span>
          <span style={{ fontSize: "12px", fontWeight: 800 }}>
            {lang === "ur" ? "←" : "›"}
          </span>
        </button>
      </div>

      {/* Favourites: the by-product screen's cards, scrolling sideways, each at the location it was saved with */}
      <FavoriteCardsRow
        push={push}
        items={
          pickedByproducts.length > 0
            ? pickedByproducts.map((p) => ({
              vertical: p.vertical || "Grains",
              product: p.product || "Wheat",
              byproduct: p.byproduct,
              location: p.location,
              rateType: p.rateType,
            }))
            : DEFAULT_FAVOURITES.map((bp) => ({ vertical: "Grains", product: "Wheat", byproduct: bp }))
        }
      />
    </section>
  );
}
