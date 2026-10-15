import { useEffect, useRef, useState, type CSSProperties } from "react";

import { LockIconSVG } from "../../components/icons";
import { getproductIconSrc } from "../../shared/data/icons";
import { toUrduDigits, URDU_FONT, useLang } from "../../shared/i18n/LangProvider";
import { type ProdDiv } from "../../shared/types";
import { type HomeSelection } from "./homeMemory";

// Product picker above the Home ring. ♥ Favorites stays pinned; the products
// scroll beside it (unlocked first, then locked ones: blurred, tapping starts
// the subscribe flow). Arrows appear only while there is more to scroll.

const CIRCLE = 56;
const CIRCLE_ON = 62;

export function ProductRail({
  activeProducts,
  lockedProducts,
  selected,
  favoritesCount,
  getVertical,
  onSelect,
  onLockedClick,
  raised = false,
}: {
  activeProducts: ProdDiv[];
  lockedProducts: ProdDiv[];
  selected: HomeSelection;
  favoritesCount: number;
  getVertical: (name: string) => string;
  onSelect: (sel: HomeSelection) => void;
  onLockedClick: (name: string, vertical: string) => void;
  /** Lift above the voice-guide overlay. */
  raised?: boolean;
}) {
  const { lang, t, tc } = useLang();
  const isUr = lang === "ur";
  const font = isUr ? URDU_FONT : "inherit";
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [more, setMore] = useState({ back: false, forward: false });

  const selectedKey = selected.kind === "favorites" ? "__favorites" : selected.name;

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const pos = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setMore({ back: pos > 4, forward: pos < max - 4 });
  };

  // Keep the selected product centred in the rail (scrolls the rail only).
  useEffect(() => {
    const rail = scrollRef.current;
    const item = itemRefs.current[selectedKey];
    if (rail && item && selectedKey !== "__favorites") {
      const offset = item.getBoundingClientRect().left - rail.getBoundingClientRect().left;
      rail.scrollTo({ left: rail.scrollLeft + offset - (rail.clientWidth - item.clientWidth) / 2, behavior: "smooth" });
    }
    updateArrows();
  }, [selectedKey, lang, activeProducts.length, lockedProducts.length]);

  const page = (sign: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    // In RTL the rail scrolls towards negative scrollLeft.
    el.scrollBy({ left: sign * (isUr ? -1 : 1) * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const circle = (on: boolean, extra?: CSSProperties): CSSProperties => ({
    width: on ? CIRCLE_ON : CIRCLE,
    height: on ? CIRCLE_ON : CIRCLE,
    borderRadius: "50%",
    background: "#FFFFFF",
    border: on ? "3px solid #087F63" : "1px solid #DCE9E3",
    boxShadow: "0 3px 10px rgba(18, 65, 48, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
    transition: "all 0.2s ease",
    ...extra,
  });

  const label = (text: string, on: boolean, muted = false, accent = "#087F63") => (
    <span
      className="truncate"
      style={{
        maxWidth: 96,
        marginTop: 6,
        padding: on ? "2px 12px" : "2px 2px",
        borderRadius: 9999,
        background: on ? accent : "transparent",
        color: on ? "#FFFFFF" : muted ? "#6B7C76" : "#183B34",
        fontSize: isUr ? 14 : 13.5,
        fontWeight: 700,
        lineHeight: 1.3,
        fontFamily: font,
      }}
    >
      {text}
    </span>
  );

  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      onClick={() => page(dir)}
      aria-label={dir === 1 ? (isUr ? "مزید مصنوعات" : "More products") : isUr ? "پچھلی مصنوعات" : "Previous products"}
      className="tap-target flex items-center justify-center rounded-full transition active:scale-90"
      style={{
        position: "absolute",
        top: (CIRCLE_ON - 36) / 2,
        [dir === 1 ? (isUr ? "left" : "right") : isUr ? "right" : "left"]: 4,
        width: 36,
        height: 36,
        background: "#FFFFFF",
        boxShadow: "0 3px 10px rgba(18, 65, 48, 0.16)",
        zIndex: 3,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#183B34" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points={(dir === 1) !== isUr ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
      </svg>
    </button>
  );

  return (
    <section className="relative flex-shrink-0 flex items-start px-3" style={{ zIndex: raised ? 45 : 5, gap: 4 }}>
      {/* ♥ Favorites — pinned */}
      <button
        ref={(el) => {
          itemRefs.current.__favorites = el;
        }}
        type="button"
        onClick={() => onSelect({ kind: "favorites" })}
        aria-pressed={selectedKey === "__favorites"}
        className="tap-target flex-shrink-0 flex flex-col items-center"
        style={{ minWidth: 76, paddingTop: selectedKey === "__favorites" ? 0 : (CIRCLE_ON - CIRCLE) / 2 }}
      >
        <div
          style={circle(selectedKey === "__favorites", {
            background: "#FFF0F3",
            border: selectedKey === "__favorites" ? "3px solid #E11D48" : "1px solid #F9C9D3",
          })}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#E11D48" stroke="#E11D48" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {favoritesCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                minWidth: 20,
                height: 20,
                padding: "0 5px",
                borderRadius: 9999,
                background: "#E11D48",
                color: "#fff",
                border: "2px solid #F1F7F4",
                fontSize: 10.5,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isUr ? toUrduDigits(favoritesCount) : favoritesCount}
            </span>
          )}
        </div>
        {label(t("Favorites"), selectedKey === "__favorites", false, "#E11D48")}
      </button>

      {/* Products — scroll from here */}
      <div className="relative flex-1 min-w-0">
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex items-start overflow-x-auto"
          style={{ scrollbarWidth: "none", gap: 6, paddingInlineEnd: 40 }}
        >
          {activeProducts.map((div) => {
            const on = selectedKey === div.name;
            return (
              <button
                key={div.name}
                ref={(el) => {
                  itemRefs.current[div.name] = el;
                }}
                type="button"
                onClick={() => onSelect({ kind: "product", name: div.name })}
                aria-pressed={on}
                className="tap-target flex-shrink-0 flex flex-col items-center"
                style={{ minWidth: 72, paddingTop: on ? 0 : (CIRCLE_ON - CIRCLE) / 2 }}
              >
                <div style={circle(on)}>
                  <img
                    src={getproductIconSrc(div.name, getVertical(div.name))}
                    alt=""
                    style={{ width: "80%", height: "80%", objectFit: "contain" }}
                  />
                </div>
                {label(tc(div.name), on)}
              </button>
            );
          })}

          {lockedProducts.map((div) => {
            const vertical = getVertical(div.name);
            return (
              <button
                key={div.name}
                type="button"
                onClick={() => onLockedClick(div.name, vertical)}
                aria-label={`${tc(div.name)} — ${t("Subscribe")}`}
                className="tap-target flex-shrink-0 flex flex-col items-center"
                style={{ minWidth: 72, paddingTop: (CIRCLE_ON - CIRCLE) / 2 }}
              >
                <div style={circle(false, { background: "#E4EFE9", overflow: "hidden" })}>
                  <img
                    src={getproductIconSrc(div.name, vertical)}
                    alt=""
                    style={{
                      width: "75%",
                      height: "75%",
                      objectFit: "contain",
                      filter: "blur(2px) grayscale(20%)",
                      opacity: 0.55,
                      position: "absolute",
                    }}
                  />
                  <span
                    className="relative flex items-center justify-center rounded-full"
                    style={{ width: 24, height: 24, background: "rgba(255, 255, 255, 0.9)", zIndex: 2 }}
                  >
                    <LockIconSVG size={12} color="#2A483E" />
                  </span>
                </div>
                {label(tc(div.name), false, true)}
              </button>
            );
          })}
        </div>

        {more.forward && arrow(1)}
        {more.back && arrow(-1)}
      </div>
    </section>
  );
}
