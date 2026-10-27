import { FavoriteCardsRow } from "../../../components/FavoriteCardsRow";
import { URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";
import type { RateItem, Screen } from "../../../shared/types";


/**
 * Original Home · "Favorites": heading, then the favourited by-products as the
 * by-product screen's cards (components/FavoriteCardsRow), or, until the user
 * favourites something, a "+" card saying how to add them.
 */
export function HomeFavoritesSection({
  pickedByproducts,
  push,
  voiceGuideActive,
}: {
  pickedByproducts: RateItem[];
  handleOrientationTap?: (key: string, speakMsg: string, navigateFn: () => void) => void;
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
      </div>

      {/* Favourites: the by-product screen's cards, scrolling sideways, each at the location it was saved with */}
      {pickedByproducts.length > 0 ? (
        <FavoriteCardsRow
          push={push}
          items={pickedByproducts.map((p) => ({
            vertical: p.vertical || "Grains",
            product: p.product || "Wheat",
            byproduct: p.byproduct,
            location: p.location,
            rateType: p.rateType,
          }))}
        />
      ) : (
        // Nothing favourited yet: a "+" card that says how to add one, and takes
        // the user up to the Products row to start.
        <button
          type="button"
          onClick={() =>
            document.querySelector("[data-home-product]")?.scrollIntoView({ behavior: "smooth", block: "center", inline: "start" })
          }
          className="tap-target w-full flex items-center gap-3 text-start transition active:scale-[0.99]"
          style={{
            padding: "16px 16px",
            borderRadius: 20,
            border: "2px dashed #9CC9B8",
            background: "rgba(232, 248, 243, 0.7)",
            fontFamily: lang === "ur" ? URDU_FONT : "inherit",
          }}
        >
          <span
            aria-hidden="true"
            className="flex-shrink-0 flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: "50%", background: "#087F63", color: "#FFFFFF", fontSize: 26, fontWeight: 600, lineHeight: 1 }}
          >
            +
          </span>
          <span className="flex flex-col gap-0.5 min-w-0">
            <span style={{ fontSize: 15, fontWeight: 800, color: "#183B34", lineHeight: lang === "ur" ? 1.8 : 1.3 }}>
              {lang === "ur" ? "اپنی پسندیدہ اشیاء یہاں شامل کریں" : "Add your favourites here"}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "#52635F", lineHeight: lang === "ur" ? 1.9 : 1.35 }}>
              {lang === "ur"
                ? "کسی بھی ضمنی مصنوع کے ریٹ کھولیں اور ☆ دبائیں، وہ یہاں نظر آئیں گے"
                : "Open any by-product's rates and tap ☆ to keep them here"}
            </span>
          </span>
        </button>
      )}
    </section>
  );
}
