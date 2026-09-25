import { useState } from "react";

import { CircleTile } from "../components/CircleTile";
import { ProductIcon } from "../components/ProductIcon";
import { ScrollRow } from "../components/ScrollRow";
import { LockIconSVG } from "../components/icons";
import { PRODUCT_DIVISIONS, SUBSCRIBED_PRODUCTS } from "../shared/data/catalog";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type ProdDiv, type ProductSel, type Screen } from "../shared/types";
import { speakText } from "../shared/voice";

export function ProductSelectScreen({
  push,
  onBack,
}: {
  push: (s: Screen) => void;
  onBack: () => void;
}) {
  // null = divisions grid; a vertical-type ProdDiv = its products grid
  const [openDiv, setOpenDiv] = useState<ProdDiv | null>(null);
  const [selected, setSelected] = useState<ProductSel[]>([]);
  const { lang, voiceEnabled, t: tl, tc } = useLang();

  const goBack = () => {
    if (openDiv) {
      setOpenDiv(null);
      return;
    }
    onBack();
  };

  const keyOf = (s: ProductSel) => `${s.vertical}|${s.product}`;
  const isProductSelected = (vertical: string, product: string) =>
    selected.some((s) => keyOf(s) === `${vertical}|${product}`);
  const toggleProduct = (vertical: string, product: string) => {
    const k = `${vertical}|${product}`;
    setSelected((prev) =>
      prev.some((s) => keyOf(s) === k)
        ? prev.filter((s) => keyOf(s) !== k)
        : [...prev, { vertical, product }],
    );
  };

  const handleProductTap = (
    onSelect: () => void,
    speakLabel: string,
    subscribed: boolean,
    productName?: string,
    verticalName?: string,
  ) => {
    if (!subscribed) {
      if (voiceEnabled) {
        speakText(lang === "ur" ? "یہ مصنوع مقفل ہے" : "This product is locked");
        setTimeout(() => {
          push({
            id: "billing",
            product: productName || speakLabel,
            vertical: verticalName,
          });
        }, 850);
        return;
      }
      push({
        id: "billing",
        product: productName || speakLabel,
        vertical: verticalName,
      });
      return;
    }
    if (voiceEnabled) {
      speakText(tc(speakLabel));
      setTimeout(() => {
        onSelect();
      }, 850);
      return;
    }
    onSelect();
  };

  const currentProducts: string[] =
    openDiv && openDiv.type === "vertical"
      ? Object.keys(openDiv.products ?? {})
      : [];

  const title = openDiv ? tc(openDiv.name) : tl("prodsel.title");
  const breadcrumb = openDiv
    ? lang === "ur"
      ? "دیکھنے کے لیے مصنوعات منتخب کریں"
      : "Select products to watch"
    : null;

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
            onClick={goBack}
            className="tap-target w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#E8EFEC" }}
          >
            <span style={{ fontSize: 20 }}>{lang === "ur" ? "→" : "←"}</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="font-extrabold text-xl truncate"
              style={{ fontFamily: "'Poppins', sans-serif", color: "#183B34" }}
            >
              {title}
            </h1>
            <p
              className="text-xs truncate"
              style={{ color: "#52635F", fontFamily: "'Inter', sans-serif" }}
            >
              {breadcrumb ??
                (lang === "ur"
                  ? "مصنوعات کا انتخاب کریں"
                  : "Tap products you want to follow")}
            </p>
          </div>
          {selected.length > 0 && (
            <span
              className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white text-xs"
              style={{
                minWidth: 26,
                height: 26,
                background: "#087F63",
                padding: "0 7px",
              }}
            >
              {selected.length}
            </span>
          )}
        </div>
      </header>

      {/* Selected product chips */}
      {selected.length > 0 && (
        <ScrollRow
          bg="#E4F2EC"
          style={{
            background: "#E4F2EC",
            borderBottom: "1px solid #C7E8D8",
            flexShrink: 0,
          }}
        >
          <span
            className="flex-shrink-0 text-xs font-semibold"
            style={{ color: "#075E4F" }}
          >
            {lang === "ur" ? "مصنوعات:" : "Products:"}
          </span>
          {selected.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelected((p) => p.filter((_, j) => j !== i))}
              className="tap-target flex-shrink-0 flex items-center gap-1 rounded-full text-xs font-bold px-3 py-1"
              style={{ background: "#087F63", color: "#fff" }}
            >
              {tc(s.product)}
            </button>
          ))}
        </ScrollRow>
      )}

      {/* Content grid */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-5 pb-4">
        {/* Divisions grid */}
        {!openDiv && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px 12px",
              alignItems: "end",
            }}
          >
            {[...PRODUCT_DIVISIONS]
              .sort((a, b) => {
                const as_ = SUBSCRIBED_PRODUCTS.has(a.name) ? 0 : 1;
                const bs_ = SUBSCRIBED_PRODUCTS.has(b.name) ? 0 : 1;
                return as_ - bs_;
              })
              .map((div) => {
                const subscribed = SUBSCRIBED_PRODUCTS.has(div.name);
                const sel =
                  div.type === "product"
                    ? isProductSelected(div.name, div.name)
                    : selected.some((s) => s.vertical === div.name);
                const btnSize = subscribed ? 96 : 72;
                const iconSize = subscribed ? 58 : 42;
                return (
                  <div key={div.name} className="flex flex-col items-center">
                    <button
                      onClick={() =>
                        handleProductTap(
                          () =>
                            div.type === "product"
                              ? toggleProduct(div.name, div.name)
                              : setOpenDiv(div),
                          div.name,
                          subscribed,
                          div.name,
                          div.type === "vertical" ? div.name : undefined,
                        )
                      }
                      className="tap-target relative flex items-center justify-center rounded-full overflow-hidden"
                      style={{
                        width: btnSize,
                        height: btnSize,
                        flexShrink: 0,
                        background: !subscribed
                          ? "#E2EFE9"
                          : sel
                            ? "#E4F2EC"
                            : "#F1F7F4",
                        border: sel
                          ? "3px solid #087F63"
                          : subscribed
                            ? "2.5px solid #087F63"
                            : "1.5px solid #BDD9CD",
                        boxShadow: subscribed
                          ? "0 4px 14px rgba(8,127,99,0.18)"
                          : "0 2px 8px rgba(18,65,48,0.06)",
                      }}
                    >
                      <ProductIcon
                        name={div.name}
                        size={iconSize}
                        style={{
                          filter: !subscribed
                            ? "blur(2.2px) grayscale(20%) opacity(0.55)"
                            : undefined,
                        }}
                      />
                      {!subscribed && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ zIndex: 2 }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "rgba(255, 255, 255, 0.8)",
                              backdropFilter: "blur(3px)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid rgba(255,255,255,0.9)",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                            }}
                          >
                            <LockIconSVG size={14} color="#183B34" />
                          </div>
                        </div>
                      )}
                      {sel && subscribed && (
                        <div
                          className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "#087F63" }}
                        >
                          <span
                            style={{
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                        </div>
                      )}
                    </button>
                    <span
                      className="mt-1.5 text-center leading-tight font-semibold"
                      style={{
                        fontSize: 12,
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "'Inter', sans-serif",
                        color: !subscribed
                          ? "#475F57"
                          : sel
                            ? "#087F63"
                            : "#183B34",
                        maxWidth: 80,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {tc(div.name)}
                    </span>
                    {!subscribed && (
                      <span className="mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E4F0EA] text-[#087F63] border border-[#C6DFD4]">
                        {lang === "ur" ? "سبسکرائب" : "Subscribe"}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Products within a vertical-type division — multi-select in place */}
        {openDiv && (
          <div className="flex flex-wrap gap-x-3 gap-y-5 justify-start">
            {currentProducts.map((p) => {
              const label = p.replace(/_/g, " ");
              return (
                <CircleTile
                  key={p}
                  product={label}
                  vertical={openDiv.name}
                  alt={label}
                  label={tc(label)}
                  selected={isProductSelected(openDiv.name, p)}
                  onPress={() =>
                    handleProductTap(
                      () => toggleProduct(openDiv.name, p),
                      label,
                      true,
                    )
                  }
                  size={72}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div
        className="flex-shrink-0 px-4 pb-6 pt-3"
        style={{ borderTop: "1px solid #D5E2DD", background: "#F4FAF7" }}
      >
        {selected.length > 0 ? (
          <button
            onClick={() =>
              push({ id: "byproduct-combined", products: selected, active: 0 })
            }
            className="tap-target w-full rounded-2xl py-4 font-bold text-white text-base"
            style={{
              background: "#087F63",
              boxShadow: "0 4px 20px rgba(15,138,95,0.3)",
            }}
          >
            {lang === "ur"
              ? `مصنوعات دیکھیں (${selected.length}) ←`
              : `View ${selected.length} ${selected.length === 1 ? "Product" : "Products"} →`}
          </button>
        ) : (
          <div
            className="w-full rounded-2xl py-4 font-semibold text-center text-sm"
            style={{ background: "#D5E2DD", color: "#52635F" }}
          >
            {openDiv
              ? lang === "ur"
                ? "شامل کرنے کے لیے مصنوعات ٹیپ کریں"
                : "Tap products to add them"
              : lang === "ur"
                ? "ٹیپ کریں · + مزید شامل کریں"
                : "Tap a product · + add more"}
          </div>
        )}
      </div>
    </div>
  );
}
