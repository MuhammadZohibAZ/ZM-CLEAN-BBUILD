import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import useMeasure from "react-use-measure";

import { fitRingScale, ThreeDCarousel } from "../../../../components/ui/3d-carousel";
import { ByproductDatePill } from "../../../components/ByproductDatePill";
import { ByProductNationalCard } from "../../../components/ByProductNationalCard";
import {
  buildByproductCards,
  buildVerticalCards,
  byproductsForSelection,
  productRatesScreenFor,
  toDateStr,
  type ByproductCardData,
  type ByproductGroup,
} from "../../../shared/data/byproductCards";
import { calculateByproductSummary } from "../../../shared/data/byproductStats";
import { getDivisionForProduct, getProductSelectionsForDivision } from "../../../shared/data/catalog";
import { getproductIconSrc } from "../../../shared/data/icons";
import { useDivisionCardData } from "../../../shared/hooks/useDivisionCardData";
import { URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";
import { type LocationScope, type Screen } from "../../../shared/types";
import { speakText } from "../../../shared/voice";
import { ByproductJumpIndicator, type JumpGroup, type JumpItem } from "./ByproductJumpIndicator";
import { homeMemory, selectionKey, type HomeSelection } from "../homeMemory";

// Home carousel: every by-product of the selected product as by-product cards
// standing on a 3D ring, with the dotted jump indicator underneath. A vertical
// (Fruits, Vegetable, ...) is treated as one product: all its by-products in
// one carousel, grouped by sub-product; the pill under the ring names the product
// of the card in front, and the jump list can jump straight to any product.
// The ♥ Favorites selection shows the user's favourite cards instead.

export type FavoriteItem = {
  vertical: string;
  product: string;
  byproduct: string;
  mandiName: string;
  rateType: string;
};

const LATEST_DATE = new Date(2026, 8, 14);
const RING_SLOTS = 12;
// The by-product card (same design as the old by-products screen) at its
// natural size; the ring scales it to fit.
const RING_CARD_WIDTH = 184;
const RING_CARD_HEIGHT = 208;
const RING_MIN_LOOP = 6;
const NO_DIVISIONS: string[] = [];

type Face =
  | { kind: "card"; key: string; card: ByproductCardData }
  | { kind: "favorite"; key: string; item: FavoriteItem };

export function HomeByproductCarousel({
  selection,
  favorites,
  favoritesAreSuggestions,
  locationScope,
  push,
  onOpen,
  rail,
  jumpRequest,
}: {
  selection: HomeSelection;
  favorites: FavoriteItem[];
  /** True when the user has no favourites yet and defaults are shown. */
  favoritesAreSuggestions: boolean;
  locationScope: LocationScope;
  push: (s: Screen) => void;
  /** Runs a card's navigation through Home's voice-guide handling. */
  onOpen: (spokenName: string, navigate: () => void) => void;
  /** The product picker, shown between the date and the ring. */
  rail?: ReactNode;
  /** Bring this by-product to the front (from Home's inline search). */
  jumpRequest?: { name: string; nonce: number } | null;
}) {
  const { lang, tc, tm, voiceEnabled } = useLang();
  const isUr = lang === "ur";
  const font = isUr ? URDU_FONT : "inherit";
  const selKey = selectionKey(selection);

  // ── Date (shared by every product on Home) ───────────────────────
  const [date, setDateState] = useState<Date | null>(homeMemory.date ?? LATEST_DATE);
  const setDate = (d: Date) => {
    homeMemory.date = d;
    setDateState(d);
  };
  const curDate = date || LATEST_DATE;
  const curDateStr = toDateStr(curDate);

  // ── Data ──────────────────────────────────────────────────────────
  const productName = selection.kind === "product" ? selection.name : null;
  const selections = useMemo(
    () => (productName ? getProductSelectionsForDivision(productName) : []),
    [productName],
  );
  const isVertical = selections.length > 1;
  const dbDivision = productName ? getDivisionForProduct(selections[0]?.vertical, selections[0]?.product) : "";
  const divisions = useMemo(() => (dbDivision ? [dbDivision] : NO_DIVISIONS), [dbDivision]);
  const { catalogByDivision, cardStatsByDivision } = useDivisionCardData(divisions, curDateStr, locationScope);
  const rawCatalog = catalogByDivision[dbDivision];
  const loading = selection.kind === "product" && rawCatalog === undefined;

  // Card stats are computed from the full dataset, so only rebuild when the
  // product, its data, the date or the location actually change.
  const productData = useMemo(() => {
    if (!rawCatalog) return { cards: [] as ByproductCardData[], groups: [] as ByproductGroup[] };
    const stats = cardStatsByDivision[dbDivision] || [];
    if (!isVertical) {
      const bps = byproductsForSelection(rawCatalog, selections[0], false);
      return { cards: buildByproductCards(bps, selections[0], dbDivision, stats, locationScope, curDate), groups: [] };
    }
    return buildVerticalCards(rawCatalog, selections, dbDivision, stats, locationScope, curDate);
  }, [rawCatalog, cardStatsByDivision, dbDivision, isVertical, selections, locationScope.kind, locationScope.label, curDateStr]);

  const faces: Face[] = useMemo(
    () =>
      selection.kind === "favorites"
        ? favorites.map((item, i) => ({ kind: "favorite" as const, key: `${item.product}|${item.byproduct}|${i}`, item }))
        : productData.cards.map((card) => ({ kind: "card" as const, key: `${card.sel.product}|${card.bp}`, card })),
    [selection.kind, favorites, productData],
  );

  // Favourite cards show the same Avg Min / Max / Markets, from the local dataset.
  const favoriteStats = useMemo(
    () =>
      selection.kind === "favorites"
        ? favorites.map((item) => calculateByproductSummary(item.product, item.byproduct, locationScope, curDate))
        : [],
    [selection.kind, favorites, locationScope.kind, locationScope.label, curDateStr],
  );

  const groups: JumpGroup[] =
    selection.kind === "favorites"
      ? []
      : productData.groups.map((g) => ({
        label: tc(g.sel.product),
        iconSrc: getproductIconSrc(g.sel.product, g.sel.vertical),
        start: g.start,
        count: g.count,
      }));

  // ── Active card (remembered by card, not position, per selection) ─
  const [activeKeys, setActiveKeys] = useState<Record<string, string>>(() => ({ ...homeMemory.activeCardByKey }));
  const storedKey = activeKeys[selKey];
  const foundIndex = storedKey ? faces.findIndex((f) => f.key === storedKey) : -1;
  const activeIndex = foundIndex >= 0 ? foundIndex : 0;
  const setActiveIndex = (i: number) => {
    const face = faces[i];
    if (!face) return;
    homeMemory.activeCardByKey[selKey] = face.key;
    setActiveKeys((prev) => ({ ...prev, [selKey]: face.key }));
  };

  const jumpTo = (i: number) => {
    setActiveIndex(i);
    if (voiceEnabled && jumpItems[i]) speakText(jumpItems[i].label);
  };

  const jumpItems: JumpItem[] = faces.map((f) =>
    f.kind === "card"
      ? {
        key: f.card.bp,
        label: tc(f.card.bp),
        iconSrc: getproductIconSrc(f.card.bp, f.card.sel.vertical),
        muted: !f.card.stats.hasData,
      }
      : {
        key: f.item.byproduct,
        label: tc(f.item.byproduct),
        iconSrc: getproductIconSrc(f.item.byproduct, f.item.vertical),
      },
  );

  // Search: once the requested by-product's cards are loaded, spin to it.
  const handledJump = useRef(0);
  useEffect(() => {
    if (!jumpRequest || jumpRequest.nonce === handledJump.current || loading || faces.length === 0) return;
    const want = jumpRequest.name.toLowerCase();
    const nameOf = (f: Face) => (f.kind === "card" ? f.card.bp : f.item.byproduct).toLowerCase();
    let i = faces.findIndex((f) => nameOf(f) === want);
    if (i < 0) i = faces.findIndex((f) => nameOf(f).includes(want) || want.includes(nameOf(f)));
    if (i < 0) return;
    handledJump.current = jumpRequest.nonce;
    setActiveIndex(i);
  }, [jumpRequest?.nonce, faces, loading]);

  // Product of the card in front (a vertical's sub-product), named big in the pill.
  const activeFace = faces[activeIndex];
  const productTitle =
    activeFace?.kind === "favorite"
      ? tc(activeFace.item.product)
      : isVertical && activeFace?.kind === "card"
        ? tc(activeFace.card.sel.product)
        : selection.kind === "product"
          ? tc(selection.name)
          : "";

  // ── Card taps ─────────────────────────────────────────────────────
  const openFace = (face: Face) => {
    if (face.kind === "card") {
      onOpen(tc(face.card.bp), () => push(productRatesScreenFor(face.card, curDateStr)));
      return;
    }
    const { item } = face;
    const spoken = isUr ? `${tc(item.byproduct)} ${tm(item.mandiName)}` : `${item.byproduct} ${item.mandiName}`;
    onOpen(spoken, () =>
      push({
        id: "product-rates",
        vertical: item.vertical,
        product: item.product,
        byproduct: item.byproduct,
        initialMandi: item.mandiName,
        initialRateType: item.rateType,
      }),
    );
  };

  // ── Layout ────────────────────────────────────────────────────────
  // The ring (front card + back cards rising over it + tray) must fit the
  // stage; the screen itself never scrolls.
  const [stageRef, stage] = useMeasure();
  // Largest card size whose whole ring (back row included) fits the stage.
  const cardScale = fitRingScale({
    cardWidth: RING_CARD_WIDTH,
    cardHeight: RING_CARD_HEIGHT,
    width: stage.width,
    height: stage.height,
    maxScale: 1.3,
    widthFraction: 0.52,
    margin: 2,
  });

  const title = selection.kind === "favorites" ? (isUr ? "پسندیدہ" : "Favorites") : tc(selection.name);
  const chip = (children: React.ReactNode) => (
    <span
      className="rounded-full"
      style={{
        padding: "3px 10px",
        background: "rgba(255, 255, 255, 0.82)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#35594C",
        fontSize: isUr ? 11 : 10,
        fontWeight: 700,
        fontFamily: font,
        boxShadow: "0 2px 8px rgba(6, 77, 64, 0.08)",
      }}
    >
      {children}
    </span>
  );

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {/* Date filter (products) / suggestion hint (favourites), centred */}
      <div className="flex items-center justify-center px-4 flex-shrink-0" style={{ minHeight: 30 }}>
        {selection.kind === "favorites"
          ? favoritesAreSuggestions && chip(isUr ? "تجاویز · کسی ریٹ پر ♡ دبائیں" : "Suggested · tap ♡ on a rate to save")
          : <ByproductDatePill compact selectedDate={date} onSelectDate={setDate} />}
      </div>

      {rail && <div className="flex-shrink-0" style={{ marginTop: 4, marginBottom: 6 }}>{rail}</div>}

      {/* 3D ring */}
      <div ref={stageRef} className="relative flex-1 min-h-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="animate-pulse"
              style={{
                width: RING_CARD_WIDTH * cardScale,
                height: RING_CARD_HEIGHT * cardScale,
                borderRadius: 20,
                background: "rgba(255,255,255,0.75)",
                border: "1.5px solid #D1E5DC",
              }}
            />
          </div>
        ) : faces.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <p className="text-center" style={{ fontSize: 13, fontWeight: 700, color: "#6B7C76", fontFamily: font }}>
              {isUr ? "کوئی ضمنی مصنوعات نہیں ملیں" : "No by-products found"}
            </p>
          </div>
        ) : (
          stage.width > 0 && (
            <ThreeDCarousel
              key={selKey}
              items={faces}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              getKey={(f) => f.key}
              cardWidth={RING_CARD_WIDTH}
              cardHeight={RING_CARD_HEIGHT}
              cardScale={cardScale}
              slots={RING_SLOTS}
              minLoop={RING_MIN_LOOP}
              rtl={isUr}
              ariaLabel={title}
              renderBack={(f) => {
                // Seen from behind: which by-product waits further round the ring.
                // The name sits at the very top: that's the part peeking over the front row.
                const name = f.kind === "card" ? f.card.bp : f.item.byproduct;
                return (
                  <div
                    className="absolute inset-0 flex flex-col"
                    style={{ borderRadius: 16, background: "#FFFFFF", border: "1.5px solid #D1E5DC", padding: "7px 10px" }}
                  >
                    <span
                      dir="auto"
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#143B33",
                        lineHeight: 1.15,
                        fontFamily: font,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {tc(name)}
                    </span>
                    <span className="flex flex-col" style={{ gap: 7, marginTop: 12 }}>
                      {[78, 56, 68].map((w) => (
                        <span key={w} style={{ width: `${w}%`, height: 6, borderRadius: 3, background: "#EAF3EE" }} />
                      ))}
                    </span>
                  </div>
                );
              }}
              renderItem={(f, i) => {
                const stats = f.kind === "card" ? f.card.stats : favoriteStats[i];
                if (!stats) return null;
                return (
                  <ByProductNationalCard
                    stats={stats}
                    product={f.kind === "card" ? f.card.sel.product : f.item.product}
                    vertical={f.kind === "card" ? f.card.sel.vertical : f.item.vertical}
                    selectedDate={curDate}
                    onClick={() => openFace(f)}
                    onMorePriceTypesClick={() => openFace(f)}
                  />
                );
              }}
            />
          )
        )}

      </div>

      {/* Dots + name pill + hold-to-jump list */}
      <div className="flex-shrink-0" style={{ paddingTop: 2, paddingBottom: 4 }}>
        {!loading && (
          <ByproductJumpIndicator
            items={jumpItems}
            groups={groups}
            activeIndex={activeIndex}
            onSelect={jumpTo}
            loop={faces.length >= RING_MIN_LOOP}
            title={productTitle}
            noun={
              selection.kind === "favorites"
                ? { en: "favourites", ur: "پسندیدہ" }
                : { en: "by-products", ur: "ضمنی مصنوعات" }
            }
          />
        )}
      </div>
    </div>
  );
}
