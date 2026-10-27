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
        // Nothing favourited yet: a centred empty state (star, short title and
        // one line on how to add one).
        <div
          className="w-full flex flex-col items-center text-center"
          style={{
            padding: "22px 20px 20px",
            borderRadius: 22,
            background: "rgba(255, 255, 255, 0.82)",
            border: "1px solid #D5E7DF",
            boxShadow: "0 6px 18px -10px rgba(6, 60, 48, 0.25)",
            fontFamily: lang === "ur" ? URDU_FONT : "inherit",
          }}
        >
          <span
            aria-hidden="true"
            className="flex items-center justify-center"
            style={{ width: 56, height: 56, borderRadius: "50%", background: "#FFF5E6", border: "1px solid #F6D9A6" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2" strokeLinejoin="round">
              <path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9z" />
            </svg>
          </span>
          <span style={{ marginTop: 10, fontSize: 16, fontWeight: 800, color: "#183B34", lineHeight: lang === "ur" ? 1.8 : 1.3 }}>
            {lang === "ur" ? "ابھی کوئی پسندیدہ نہیں" : "No favourites yet"}
          </span>
          <span style={{ marginTop: 4, maxWidth: 280, fontSize: 13, fontWeight: 500, color: "#52635F", lineHeight: lang === "ur" ? 1.9 : 1.45 }}>
            {lang === "ur"
              ? "کسی بھی ریٹ پر ☆ دبائیں، وہ یہاں فوری رسائی کے لیے محفوظ ہو جائے گا"
              : "Tap ☆ on any rate to save it here for quick access"}
          </span>
        </div>
      )}
    </section>
  );
}
