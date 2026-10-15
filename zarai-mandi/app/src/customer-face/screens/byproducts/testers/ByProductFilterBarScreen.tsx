import { useState } from "react";

import { ByProductNationalCard } from "../../../components/ByProductNationalCard";
import { productRatesScreenFor } from "../../../shared/data/byproductCards";
import { PickerSheet } from "../../product-rates/PickerSheet";
import { C } from "../../product-rates/theme";
import { BottomSheet, Icon } from "../../product-rates/ui";
import { useRateAttributeCards } from "./rateAttributeCards";
import type { TesterBodyProps } from "./splitCards";

// Tester variant of the by-product screen: a compact filter bar (in the rates
// screen's style) on top of the card grid.
//  - Rate: one rate type for every card. It opens on the rate reported most
//    that day; cards without the chosen rate are hidden.
//  - Attribute: values grouped by attribute (Crop: New / Old, Color: ...);
//    choosing several gives each by-product one card per value.
// Picked attribute values show as removable chips under the bar.

export function ByProductFilterBarScreen(props: TesterBodyProps) {
  const {
    f, tr, attrs, setAttrs, setRate, rateOptions, activeRate,
    attrGroups, attrLabel, valueLabel, toggleAttr, cards, loading, error, curDate, curDateStr, push,
  } = useRateAttributeCards(props);
  const [open, setOpen] = useState<"rate" | "attr" | null>(null);

  // One compact field of the bar: "Caption  Value ▾" on a single line.
  const field = (caption: string, value: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${caption}: ${value}`}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        height: 38,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 12px",
        borderRadius: 12,
        border: `1px solid ${active ? C.brand : C.line}`,
        background: active ? C.brandTint : C.surfaceAlt,
        fontFamily: f.font,
        textAlign: "start",
      }}
    >
      <span style={{ fontSize: 11.5, fontWeight: 500, color: active ? C.brandDeep : C.muted, whiteSpace: "nowrap" }}>{caption}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: active ? C.brandDeep : C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </span>
      <Icon name="chevDown" size={10} width={2.6} color={active ? C.brandDeep : C.faint} />
    </button>
  );

  return (
    <>
      {/* Compact filter bar */}
      <div dir={f.dir} className="flex-shrink-0" style={{ background: C.surface, padding: "8px 12px", borderBottom: `1px solid ${C.lineSoft}`, fontFamily: f.font }}>
        <div style={{ display: "flex", gap: 8 }}>
          {field(f.tx("Rate", "ریٹ"), activeRate ? tr(activeRate).replace(/ Rate$/, "") : "—", false, () => setOpen("rate"))}
          {attrGroups.length > 0 &&
            field(
              f.tx("Attribute", "وصف"),
              attrs.length ? f.tx(`${attrs.length} selected`, `${f.digits(attrs.length)} منتخب`) : f.tx("Any", "کوئی بھی"),
              attrs.length > 0,
              () => setOpen("attr"),
            )}
        </div>

        {/* Picked attribute values as removable chips */}
        {attrs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {attrs.map((a) => {
              const [type, ...rest] = a.split("|");
              const value = rest.join("|");
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAttr(a)}
                  aria-label={f.tx(`Remove ${valueLabel(type, value)}`, `${valueLabel(type, value)} ہٹائیں`)}
                  style={{ display: "flex", alignItems: "center", gap: 5, height: 26, padding: "0 6px 0 9px", borderRadius: 13, border: "none", background: C.brandTint, color: C.brandDeep, fontSize: 12, fontWeight: 600, fontFamily: f.font, whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  <span style={{ color: C.muted, fontWeight: 500 }}>{attrLabel(type)}</span>
                  {valueLabel(type, value)}
                  <Icon name="close" size={8} width={2.8} color={C.brandDeep} />
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAttrs([])}
              style={{ height: 26, padding: "0 6px", border: "none", background: "transparent", color: C.brandDeep, fontSize: 12, fontWeight: 700, fontFamily: f.font, whiteSpace: "nowrap", flexShrink: 0, marginInlineStart: "auto" }}
            >
              {f.tx("Clear", "صاف کریں")}
            </button>
          </div>
        )}
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto px-2.5 sm:px-3 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 140px)", scrollbarWidth: "none" }}>
        {error ? (
          <p className="py-20 text-center text-sm font-semibold" style={{ color: C.muted, fontFamily: f.font }}>
            {f.tx("Couldn't load the cards. Is the market API running?", "کارڈز لوڈ نہیں ہو سکے۔ مارکیٹ API چل رہی ہے؟")}
          </p>
        ) : loading && cards.length === 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[16px] animate-pulse" style={{ height: 168, background: "#FFFFFF", border: "1.5px solid #D1E5DC" }} />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p className="py-20 text-center text-sm font-semibold" style={{ color: C.muted, fontFamily: f.font }}>
            {f.tx("No cards for these filters", "ان فلٹرز کے لیے کوئی کارڈ نہیں")}
          </p>
        ) : (
          <div className={`grid grid-cols-2 gap-2 sm:gap-2.5 ${loading ? "opacity-60" : ""}`}>
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

      {open === "rate" && (
        <PickerSheet
          f={f}
          title={f.tx("Rate type", "ریٹ کی قسم")}
          subtitle={f.tx("Most reported today first · cards without it are hidden", "آج سب سے زیادہ رپورٹ شدہ پہلے · جن کارڈز میں یہ نہیں وہ چھپ جائیں گے")}
          value={activeRate ? [activeRate] : []}
          onChange={(v) => setRate(v[0])}
          onClose={() => setOpen(null)}
          options={rateOptions.map((r) => ({
            id: r.id,
            label: tr(r.id),
            meta: r.today
              ? f.tx(`${r.today} report${r.today === 1 ? "" : "s"} today`, `آج ${f.digits(r.today)} رپورٹس`)
              : f.tx(`${r.cards} by-product${r.cards === 1 ? "" : "s"}`, `${f.digits(r.cards)} ضمنی مصنوعات`),
          }))}
        />
      )}

      {open === "attr" && (
        <BottomSheet
          onClose={() => setOpen(null)}
          title={f.tx("Attributes", "خصوصیات")}
          subtitle={f.tx("Pick several to compare them side by side", "ساتھ ساتھ موازنے کے لیے کئی چنیں")}
          dir={f.dir}
          font={f.font}
          display={f.display}
          action={
            attrs.length > 0 ? (
              <button type="button" onClick={() => setAttrs([])} style={{ height: 44, padding: "0 10px", border: "none", background: "transparent", color: C.brandDeep, fontSize: 14, fontWeight: 600, fontFamily: f.font }}>
                {f.tx("Clear", "صاف کریں")}
              </button>
            ) : undefined
          }
          footer={
            <button type="button" onClick={() => setOpen(null)} style={{ flex: 1, height: 52, borderRadius: 16, border: "none", background: C.brand, color: "#FFFFFF", fontSize: 15, fontWeight: 600, fontFamily: f.font }}>
              {f.tx("Done", "ٹھیک ہے")}
            </button>
          }
        >
          {attrGroups.map((g) => (
            <div key={g.type} style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{attrLabel(g.type)}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {g.values.map(([value, count]) => {
                  const key = `${g.type}|${value}`;
                  const on = attrs.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleAttr(key)}
                      style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px", border: "none", borderRadius: 19, background: on ? C.brand : C.chip, color: on ? "#FFFFFF" : C.ink, fontSize: 14, fontWeight: 600, fontFamily: f.font }}
                    >
                      {valueLabel(g.type, value)}
                      <span style={{ fontSize: 12, fontWeight: 600, opacity: on ? 0.8 : 0.5 }}>{f.digits(count)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </BottomSheet>
      )}
    </>
  );
}
