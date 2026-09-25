import { useState } from "react";

import { CircleTile } from "../components/CircleTile";
import { SpriteIcon } from "../components/ProductIcon";
import { ScrollRow } from "../components/ScrollRow";
import { VERTICALS } from "../shared/data/catalog";
import { type RateItem, type Screen } from "../shared/types";

//  BY-PRODUCT SELECT

export function ByProductSelectScreen({
  push,
  onBack,
}: {
  push: (s: Screen) => void;
  onBack: () => void;
}) {
  const verticals = Object.keys(VERTICALS);
  const [activeV, setActiveV] = useState(verticals[0]);
  const [activeComm, setActiveComm] = useState<string | null>(null);
  const [selected, setSelected] = useState<RateItem[]>([]);

  const products = Object.keys(VERTICALS[activeV]?.products || {});
  const byproducts = activeComm
    ? VERTICALS[activeV]?.products[activeComm] || []
    : [];

  const toggleBP = (bp: string) => {
    if (!activeComm) return;
    const item: RateItem = {
      vertical: activeV,
      product: activeComm,
      byproduct: bp,
    };
    const key = `${activeV}|${activeComm}|${bp}`;
    setSelected((prev) =>
      prev.some((p) => `${p.vertical}|${p.product}|${p.byproduct}` === key)
        ? prev.filter(
          (p) => `${p.vertical}|${p.product}|${p.byproduct}` !== key,
        )
        : [...prev, item],
    );
  };

  const isBPSelected = (bp: string) =>
    selected.some(
      (p) =>
        p.vertical === activeV &&
        p.product === activeComm &&
        p.byproduct === bp,
    );

  return (
    <div
      className="flex flex-col h-full screen-enter"
      style={{ background: "#F1F7F4" }}
    >
      {/* Header */}
      <header
        className="px-4 pt-10 pb-3 flex-shrink-0"
        style={{ background: "#F4FAF7", borderBottom: "1px solid #D5E2DD" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="tap-target w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#E8EFEC" }}
          >
            <span style={{ fontSize: 20 }}>←</span>
          </button>
          <div className="flex-1">
            <h1
              className="font-extrabold text-xl"
              style={{ fontFamily: "'Poppins', sans-serif", color: "#183B34" }}
            >
              Live Market
            </h1>
            <p
              className="text-xs"
              style={{ color: "#52635F", fontFamily: "'Inter', sans-serif" }}
            >
              {activeComm
                ? `${activeComm} · select byproducts`
                : "Choose a category and product"}
            </p>
          </div>
          {selected.length > 0 && (
            <span
              className="flex items-center justify-center rounded-full font-bold text-white text-xs"
              style={{
                minWidth: 24,
                height: 24,
                background: "#087F63",
                padding: "0 7px",
              }}
            >
              {selected.length}
            </span>
          )}
        </div>
      </header>

      {/* Selected chips */}
      {selected.length > 0 && (
        <ScrollRow
          bg="#E4F2EC"
          style={{ background: "#E4F2EC", borderBottom: "1px solid #C7E8D8" }}
        >
          <span
            className="flex-shrink-0 text-xs font-semibold"
            style={{ color: "#075E4F" }}
          >
            Selected:
          </span>
          {selected.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelected((p) => p.filter((_, j) => j !== i))}
              className="tap-target flex-shrink-0 flex items-center gap-1 rounded-full text-xs font-bold px-3 py-1"
              style={{ background: "#087F63", color: "#fff" }}
            >
              {s.byproduct}
            </button>
          ))}
        </ScrollRow>
      )}

      {/* Vertical tabs */}
      <ScrollRow
        bg="#fff"
        style={{ background: "#F4FAF7", borderBottom: "1px solid #D5E2DD" }}
      >
        {verticals.map((v) => (
          <button
            key={v}
            onClick={() => {
              setActiveV(v);
              setActiveComm(null);
            }}
            className="tap-target flex-shrink-0 flex items-center gap-1.5 rounded-full font-semibold text-xs px-3 py-2"
            style={{
              background: activeV === v ? "#087F63" : "#E8EFEC",
              color: activeV === v ? "#fff" : "#52635F",
              border: activeV === v ? "none" : "1px solid #D5E2DD",
            }}
          >
            <SpriteIcon
              spriteKey={VERTICALS[v]?.icon || "grains"}
              size={16}
              style={{
                flexShrink: 0,
                filter: activeV === v ? "brightness(0) invert(1)" : "none",
              }}
            />
            {v}
          </button>
        ))}
      </ScrollRow>

      {/* product row — if no product selected, show product tiles */}
      {!activeComm ? (
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-5 pb-4">
          <p
            className="text-xs font-semibold mb-4"
            style={{ color: "#52635F" }}
          >
            Pick a product to see its byproducts
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-5 justify-start">
            {products.map((c) => (
              <CircleTile
                key={c}
                product={c}
                vertical={activeV}
                alt={c}
                label={c}
                selected={false}
                onPress={() => setActiveComm(c)}
                size={72}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Back to product list + product name */}
          <div
            className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
            style={{ background: "#F1F7F4", borderBottom: "1px solid #D5E2DD" }}
          >
            <button
              onClick={() => setActiveComm(null)}
              className="tap-target flex items-center gap-1 text-xs font-semibold"
              style={{ color: "#087F63" }}
            >
              ← Products
            </button>
            <span style={{ color: "#D5E2DD" }}>|</span>
            <span className="font-bold text-sm" style={{ color: "#183B34" }}>
              {activeComm}
            </span>
          </div>

          {/* Byproduct tiles */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-5 pb-4">
            <div className="flex flex-wrap gap-x-3 gap-y-5 justify-start">
              {byproducts.map((bp) => (
                <CircleTile
                  key={bp}
                  product={bp}
                  vertical={activeV}
                  alt={bp}
                  label={bp}
                  selected={isBPSelected(bp)}
                  onPress={() => toggleBP(bp)}
                  size={72}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer CTA */}
      <div
        className="flex-shrink-0 px-4 pb-6 pt-3"
        style={{ borderTop: "1px solid #D5E2DD", background: "#F4FAF7" }}
      >
        {selected.length > 0 ? (
          <button
            onClick={() =>
              push({ id: "rates-result", items: selected, source: "byproduct" })
            }
            className="tap-target w-full rounded-2xl py-4 font-bold text-white text-base"
            style={{
              background: "#087F63",
              boxShadow: "0 4px 20px rgba(15,138,95,0.3)",
            }}
          >
            Show Rates · {selected.length} By-Product
            {selected.length > 1 ? "s" : ""} →
          </button>
        ) : (
          <div
            className="w-full rounded-2xl py-4 font-semibold text-center text-sm"
            style={{ background: "#D5E2DD", color: "#52635F" }}
          >
            {activeComm
              ? "Tap a byproduct to select"
              : "Choose a product first"}
          </div>
        )}
      </div>
    </div>
  );
}

//  RICH RATE CARD (matches screenshot aesthetic)

export const VERTICAL_BG: Record<string, string> = {
  Grains: "#075E4F",
  Fruits: "#B9822E",
  Vegetables: "#087F63",
  Livestock: "#9C4426",
  "Agri Inputs": "#256F8C",
  "Dry Fruits": "#B9822E",
  Herbals: "#2C86A8",
  Kiryana: "#52635F",
};
