import { useState } from "react";

import { ByProductNationalCard } from "../../../components/ByProductNationalCard";
import { productRatesScreenFor } from "../../../shared/data/byproductCards";
import { C } from "../../product-rates/theme";
import { Icon } from "../../product-rates/ui";
import { useRateAttributeCards } from "./rateAttributeCards";
import type { TesterBodyProps } from "./splitCards";

// Tester variant of the by-product screen: a filter drawer. Closed by default;
// a floating Filters button slides a panel over half the screen (rate type and special
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
  const activeCount = (rate !== null ? 1 : 0) + attrs.length;
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

  // ── filter bar: pinned at the top (start side), says what's filtered ──
  const summary = [
    ...(rate !== null ? [shortRate(rate)] : []),
    ...attrs.map((a) => {
      const i = a.indexOf("|");
      return valueLabel(a.slice(0, i), a.slice(i + 1));
    }),
  ].join(" · ");
  const filterBar = (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 4,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 10px 6px",
        background: "linear-gradient(to bottom, #F1F7F4 75%, rgba(241, 247, 244, 0))",
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={activeCount ? f.tx(`Filters, ${activeCount} applied`, `فلٹر، ${f.digits(activeCount)} لاگو`) : f.tx("Filters", "فلٹر")}
        onClick={() => setOpen(true)}
        style={{
          flexShrink: 0,
          height: 38,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "0 14px",
          borderRadius: 19,
          border: activeCount ? "none" : `1.5px solid ${C.brand}`,
          background: activeCount ? C.brand : C.surface,
          color: activeCount ? "#FFFFFF" : C.brand,
          boxShadow: "0 2px 8px rgba(6, 45, 36, 0.10)",
          fontSize: 13.5,
          fontWeight: 700,
          fontFamily: f.font,
        }}
      >
        <Icon name="filter" size={15} width={2.4} color={activeCount ? "#FFFFFF" : C.brand} />
        {f.tx("Filters", "فلٹر")}
        {activeCount > 0 && (
          <span
            aria-hidden="true"
            style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: 10, background: "#FFFFFF", color: C.brandDeep, fontSize: 11.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {f.digits(activeCount)}
          </span>
        )}
      </button>
      <span
        onClick={() => setOpen(true)}
        style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, fontWeight: 600, color: active ? C.ink : C.muted, fontFamily: f.font, cursor: "pointer" }}
      >
        {active ? summary : f.tx("Filter by rate type and attribute", "ریٹ کی قسم اور خصوصیت سے فلٹر کریں")}
      </span>
    </div>
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
      {filterBar}
      <div style={{ padding: "2px 10px 0" }}>
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
    // The cards fill the screen; the Filters bar pinned at the top opens the drawer.
    <div dir={f.dir} style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden", fontFamily: f.font }}>
      {cardList}
      {drawer}
    </div>
  );
}
