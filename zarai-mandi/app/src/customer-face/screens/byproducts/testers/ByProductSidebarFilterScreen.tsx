import { useState } from "react";

import { ByProductNationalCard } from "../../../components/ByProductNationalCard";
import { productRatesScreenFor } from "../../../shared/data/byproductCards";
import { C } from "../../product-rates/theme";
import { Icon } from "../../product-rates/ui";
import { useRateAttributeCards } from "./rateAttributeCards";
import type { TesterBodyProps } from "./splitCards";

// Tester variant of the by-product screen: a filter drawer. Closed by default;
// the Filters button slides a panel over half the screen (rate type and special
// attribute only). The cards move to the other half in one column and stay
// scrollable while the panel is open. With no rate picked, every card shows its
// own most received rate; picking a rate applies it to all cards (tap it again
// to clear).

/** Room at the end of each scrolling area so the last item clears the bottom nav. */
const NAV_SPACE = "calc(env(safe-area-inset-bottom, 0px) + 120px)";
const DRAWER_MS = 220;

export function ByProductSidebarFilterScreen(props: TesterBodyProps) {
  const {
    f, tr, attrs, setAttrs, rate, setRate, rateOptions,
    attrGroups, attrLabel, valueLabel, toggleAttr, cards, loading, error, curDate, curDateStr, push,
  } = useRateAttributeCards(props, { perCardDefault: true });
  const [open, setOpen] = useState(false);
  const active = rate !== null || attrs.length > 0;
  const shortRate = (r: string) => tr(r).replace(/\s*Rate$/i, "");
  const start = f.ur ? "right" : "left";

  // ── drawer pieces ──
  const sectionTitle = (title: string) => (
    <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, padding: "14px 4px 8px" }}>{title}</div>
  );

  const rateRow = (id: string) => {
    const on = rate === id;
    return (
      <button
        key={id}
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => setRate(on ? null : id)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "9px 8px",
          border: "none",
          borderRadius: 10,
          background: on ? C.brandTint : "transparent",
          textAlign: "start",
          fontFamily: f.font,
          color: on ? C.brandDeep : C.ink,
          fontSize: 13,
          fontWeight: on ? 700 : 600,
        }}
      >
        <span
          aria-hidden="true"
          style={{ width: 16, height: 16, borderRadius: 8, flexShrink: 0, border: on ? `5px solid ${C.brand}` : `1.5px solid ${C.line}`, background: C.surface }}
        />
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortRate(id)}</span>
      </button>
    );
  };

  const valueChip = (key: string, label: string) => {
    const on = attrs.includes(key);
    return (
      <button
        key={key}
        type="button"
        role="checkbox"
        aria-checked={on}
        onClick={() => toggleAttr(key)}
        style={{
          height: 32,
          padding: "0 12px",
          border: `1px solid ${on ? C.brand : C.line}`,
          borderRadius: 16,
          background: on ? C.brand : C.surface,
          color: on ? "#FFFFFF" : C.ink,
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: f.font,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    );
  };

  const drawer = (
    <aside
      aria-label={f.tx("Filters", "فلٹر")}
      aria-hidden={!open}
      style={{
        position: "absolute",
        top: 0,
        // ends just above the bottom nav so its footer button stays visible
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)",
        [start]: 0,
        width: "50%",
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        background: C.surface,
        boxShadow: open ? (f.ur ? "-8px 0 24px rgba(6,45,36,0.16)" : "8px 0 24px rgba(6,45,36,0.16)") : "none",
        borderStartEndRadius: 18,
        borderEndEndRadius: 18,
        transform: open ? "translateX(0)" : `translateX(${f.ur ? "100%" : "-100%"})`,
        visibility: open ? "visible" : "hidden",
        transition: `transform ${DRAWER_MS}ms ease, box-shadow ${DRAWER_MS}ms ease, visibility ${DRAWER_MS}ms`,
      }}
    >
      {/* Header: title, reset, close */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 10px 10px 14px", borderBottom: `1px solid ${C.lineSoft}`, flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: 15.5, fontWeight: 800, color: C.ink }}>{f.tx("Filters", "فلٹر")}</span>
        {active && (
          <button
            type="button"
            onClick={() => {
              setRate(null);
              setAttrs([]);
            }}
            style={{ border: "none", background: "transparent", padding: "4px 6px", color: C.brandDeep, fontSize: 12.5, fontWeight: 700, fontFamily: f.font }}
          >
            {f.tx("Reset", "ری سیٹ")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={f.tx("Close filters", "فلٹر بند کریں")}
          style={{ width: 30, height: 30, borderRadius: 15, border: "none", background: C.chip, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="close" size={13} width={2.6} color={C.ink} />
        </button>
      </div>

      {/* Rate type + special attribute */}
      <div className="zm-hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 8px", scrollbarWidth: "none" }}>
        {sectionTitle(f.tx("Rate type", "ریٹ کی قسم"))}
        <div role="radiogroup" aria-label={f.tx("Rate type", "ریٹ کی قسم")} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {rateOptions.map((r) => rateRow(r.id))}
        </div>

        {attrGroups.length > 0 && (
          <>
            <div style={{ height: 1, background: C.lineSoft, margin: "12px 4px 0" }} />
            {sectionTitle(f.tx("Special attribute", "خصوصی وصف"))}
            {attrGroups.map((g) => (
              <div key={g.type} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, padding: "0 4px 6px" }}>{attrLabel(g.type)}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {g.values.map(([value]) => valueChip(`${g.type}|${value}`, valueLabel(g.type, value)))}
                </div>
              </div>
            ))}
          </>
        )}
        <div aria-hidden="true" style={{ height: 16 }} />
      </div>

      {/* Footer: close and look at the results */}
      <div style={{ padding: 10, borderTop: `1px solid ${C.lineSoft}`, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ width: "100%", height: 42, borderRadius: 13, border: "none", background: C.brand, color: "#FFFFFF", fontSize: 13.5, fontWeight: 700, fontFamily: f.font }}
        >
          {f.tx("Show results", "نتائج دکھائیں")}
        </button>
      </div>
    </aside>
  );

  // ── cards: full width in 2 columns, or one column beside the open drawer ──
  const cardList = (
    <div
      className="zm-hide-scrollbar"
      style={{
        height: "100%",
        overflowY: "auto",
        scrollbarWidth: "none",
        [f.ur ? "paddingRight" : "paddingLeft"]: open ? "50%" : 0,
        transition: `padding ${DRAWER_MS}ms ease`,
      }}
    >
      <div style={{ padding: "10px 10px 0" }}>
        {error ? (
          <p style={{ padding: "60px 8px", textAlign: "center", fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: f.font }}>
            {f.tx("Couldn't load the cards. Is the market API running?", "کارڈز لوڈ نہیں ہو سکے۔ مارکیٹ API چل رہی ہے؟")}
          </p>
        ) : loading && cards.length === 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: open ? "1fr" : "1fr 1fr", gap: 8 }} aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ height: 168, borderRadius: 16, background: "#FFFFFF", border: "1.5px solid #D1E5DC" }} />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p style={{ padding: "60px 8px", textAlign: "center", fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: f.font }}>
            {f.tx("No cards for these filters", "ان فلٹرز کے لیے کوئی کارڈ نہیں")}
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: open ? "1fr" : "1fr 1fr", gap: 8, opacity: loading ? 0.6 : 1 }}>
            {cards.map((c) => {
              const openCard = () => push(productRatesScreenFor(c, curDateStr));
              return (
                <ByProductNationalCard
                  key={c.key}
                  stats={c.stats}
                  product={c.sel.product}
                  vertical={c.sel.vertical}
                  selectedDate={curDate}
                  onClick={openCard}
                  onMorePriceTypesClick={openCard}
                />
              );
            })}
          </div>
        )}
      </div>
      <div aria-hidden="true" style={{ height: NAV_SPACE }} />
    </div>
  );

  return (
    <>
      {/* Top strip: Filters button + what is applied (tap a chip to remove it) */}
      <div dir={f.dir} className="flex-shrink-0" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.surface, borderBottom: `1px solid ${C.lineSoft}`, fontFamily: f.font }}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{
            position: "relative",
            height: 34,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 12px",
            borderRadius: 11,
            border: `1px solid ${open ? C.brand : C.line}`,
            background: open ? C.brand : C.surface,
            color: open ? "#FFFFFF" : C.ink,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: f.font,
            flexShrink: 0,
          }}
        >
          <Icon name="filter" size={14} width={2.4} color={open ? "#FFFFFF" : C.ink2} />
          {f.tx("Filters", "فلٹر")}
          {active && !open && (
            <span aria-hidden="true" style={{ position: "absolute", top: -3, [f.ur ? "left" : "right"]: -3, width: 10, height: 10, borderRadius: 5, background: C.brand, border: "2px solid #FFFFFF" }} />
          )}
        </button>
        <div className="zm-hide-scrollbar" style={{ flex: 1, minWidth: 0, display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          {rate && (
            <button type="button" onClick={() => setRate(null)} style={stripChip(f.font)} aria-label={f.tx(`Remove ${shortRate(rate)}`, `${shortRate(rate)} ہٹائیں`)}>
              {shortRate(rate)}
              <Icon name="close" size={8} width={2.8} color={C.brandDeep} />
            </button>
          )}
          {attrs.map((a) => {
            const [type, ...rest] = a.split("|");
            const label = valueLabel(type, rest.join("|"));
            return (
              <button key={a} type="button" onClick={() => toggleAttr(a)} style={stripChip(f.font)} aria-label={f.tx(`Remove ${label}`, `${label} ہٹائیں`)}>
                {label}
                <Icon name="close" size={8} width={2.8} color={C.brandDeep} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Body: the drawer slides over the cards; the cards keep scrolling beside it */}
      <div dir={f.dir} style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden", fontFamily: f.font }}>
        {cardList}
        {drawer}
      </div>
    </>
  );
}

function stripChip(font: string) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 5,
    height: 28,
    padding: "0 7px 0 10px",
    borderRadius: 14,
    border: "none",
    background: C.brandTint,
    color: C.brandDeep,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: font,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  };
}
