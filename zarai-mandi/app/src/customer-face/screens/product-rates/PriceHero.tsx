import { arrow, signed, type Fmt } from "./format";
import type { Stats } from "./selectors";
import { C } from "./theme";
import { TrendChart, type Series } from "./TrendChart";
import { Icon, useCountUp } from "./ui";

/** Chart-card palette (shared with the Trends chart card): a light card
 * with a faint mint wash, the way light-mode trading apps do it. */
export const DK = {
  bg: "linear-gradient(180deg, #ECF7F1 0%, #FFFFFF 46%)",
  border: "1px solid #E1ECE6",
  shadow: "0 1px 2px rgba(15,26,23,0.04), 0 10px 26px -16px rgba(8,127,99,0.35)",
  text: C.ink,
  sub: C.ink2,
  faint: C.muted,
  line: C.lineSoft,
  up: C.up,
  down: C.down,
  mint: C.brand,
  chip: "rgba(15,26,23,0.05)",
};

export type ActiveAttrBadge = {
  key: string;
  label: string;
  value: string;
  display: string;
};

/** The answer first: the average rate for the chosen place and day, its
 * change, the month's shape and three key numbers. */
export function PriceHero({
  f,
  bandLabel,
  rateLabel,
  date,
  prevDate,
  isLatest,
  stats,
  prev,
  nationalMid,
  isMandi,
  spark,
  onPickDay,
  onListen,
  lockHistory,
  onSubscribe,
  loading,
  emptyMessage,
  onClearScope,
  specialAttr,
  activeAttrs,
}: {
  f: Fmt;
  province?: string;
  bandLabel: string;
  rateLabel: string;
  date: string;
  prevDate: string | null;
  isLatest: boolean;
  stats: Stats;
  prev: Stats | null;
  nationalMid: number;
  isMandi: boolean;
  spark: { dates: string[]; series: Series[]; idx: number };
  onPickDay: (i: number) => void;
  onListen: () => void;
  lockHistory: boolean;
  onSubscribe: () => void;
  loading: boolean;
  emptyMessage: string | null;
  onClearScope: () => void;
  specialAttr?: { label: string; value: string } | null;
  activeAttrs?: ActiveAttrBadge[];
}) {
  const change = prev && prev.mid > 0 && stats.mid > 0 ? ((stats.mid - prev.mid) / prev.mid) * 100 : null;
  const changeAbs = prev && prev.mid > 0 ? stats.mid - prev.mid : 0;
  const has = stats.count > 0;
  const dir = change === null ? 0 : signed(change);
  const vsNat = stats.mid - nationalMid;
  const hasSpark = spark.series.length > 0 && spark.series[0].values.some((v) => v > 0);
  const shownMid = useCountUp(stats.mid);
  const coverage = isMandi
    ? nationalMid > 0
      ? f.tx(`${vsNat >= 0 ? "+" : "−"}${f.num(Math.abs(vsNat))} vs Pakistan`, `پاکستان سے ${vsNat >= 0 ? "+" : "−"}${f.num(Math.abs(vsNat))}`)
      : ""
    : f.tx(`${stats.mandis} location${stats.mandis === 1 ? "" : "s"}`, `${f.digits(stats.mandis)} مقامات`);

  const stat = (label: string, value: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0, flex: 1 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: DK.faint, lineHeight: f.lh }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: DK.text, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: f.lh }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ padding: "4px 16px 0" }}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, color: DK.text, background: DK.bg, border: DK.border, boxShadow: DK.shadow }}>
        <div
          aria-hidden="true"
          style={{ position: "absolute", top: -120, insetInlineEnd: -90, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(47,181,138,0.12), rgba(47,181,138,0) 70%)", pointerEvents: "none" }}
        />

        <div style={{ position: "relative", padding: "8px 12px 2px", display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ minWidth: 0, fontSize: 12, fontWeight: 500, color: DK.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: f.lh }}>
              {[bandLabel, rateLabel, has ? coverage : ""].filter(Boolean).join(" · ") || f.tx("Mandi rates", "منڈی ریٹس")}
            </span>
            <button
              type="button"
              aria-label={f.tx("Hear this rate", "یہ ریٹ سنیں")}
              title={f.tx("Hear this rate", "یہ ریٹ سنیں")}
              onClick={onListen}
              style={{ width: 28, height: 28, borderRadius: 14, border: "none", background: DK.chip, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <Icon name="speaker" size={15} color={C.brand} />
            </button>
          </div>

          {loading ? (
            <>
              <div aria-busy="true" className="zm-shimmer" style={{ height: 34, width: "58%", borderRadius: 10 }} />
              <div className="zm-shimmer" style={{ height: 12, width: "38%", borderRadius: 6 }} />
            </>
          ) : has ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: f.ur ? 26 : 30, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: f.ur ? 1.6 : 1.1, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
                  {f.rs(shownMid)}
                </span>
                {change !== null && (
                  <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate", color: dir > 0 ? DK.up : dir < 0 ? DK.down : DK.sub }}>
                    {dir === 0 ? (
                      f.tx("No change", "کوئی تبدیلی نہیں")
                    ) : (
                      <>
                        {arrow(change)} {changeAbs >= 0 ? "+" : "−"}
                        {f.num(Math.abs(changeAbs))} ({f.pct(change)})
                      </>
                    )}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 500, color: DK.faint, lineHeight: f.lh }}>
                {f.tx("Average per 40 kg", "اوسط فی ۴۰ کلو")}
                {change !== null && prevDate ? f.tx(` · vs ${f.day(prevDate)}`, ` · ${f.day(prevDate)} سے`) : ""}
                {!isLatest ? ` · ${f.day(date, true)}` : ""}
              </span>
              {activeAttrs && activeAttrs.length > 0 ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                  {activeAttrs.map((attr) => (
                    <span
                      key={`${attr.key}-${attr.value}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 7.5px",
                        borderRadius: 7,
                        fontSize: 11,
                        fontWeight: 700,
                        background: "rgba(245, 158, 11, 0.12)",
                        color: "#D97706",
                        border: "1px solid rgba(245, 158, 11, 0.28)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>{attr.display}</span>
                    </span>
                  ))}
                </div>
              ) : specialAttr ? (
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 7.5px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 700,
                      background: "rgba(245, 158, 11, 0.12)",
                      color: "#D97706",
                      border: "1px solid rgba(245, 158, 11, 0.28)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span>{specialAttr.value || specialAttr.label}</span>
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0 8px" }}>
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: f.lh }}>{emptyMessage}</span>
              <button
                type="button"
                onClick={onClearScope}
                style={{ alignSelf: "flex-start", height: 30, padding: "0 12px", borderRadius: 15, border: "none", background: C.brand, color: "#FFFFFF", fontWeight: 700, fontSize: 12, fontFamily: f.font }}
              >
                {f.tx("Show all Pakistan", "پورا پاکستان دکھائیں")}
              </button>
            </div>
          )}
        </div>

        {hasSpark && (
          <div data-zm-hscroll style={{ position: "relative", padding: "0 6px 0" }}>
            <TrendChart
              f={f}
              compact
              connectGaps
              height={54}
              dates={spark.dates}
              series={spark.series.map((x) => ({ ...x, color: DK.mint }))}
              idx={spark.idx}
              onIdx={onPickDay}
              tooltip={(k) => (spark.series[0]?.values[k] > 0 ? { title: f.day(spark.dates[k], true), value: f.rs(spark.series[0].values[k]) } : null)}
              ariaLabel={f.tx("Rate over the month. Tap a day to see it.", "مہینے بھر کا ریٹ۔ دن دیکھنے کے لیے دبائیں۔")}
            />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 6px 4px", fontSize: 10.5, fontWeight: 500, color: DK.faint }}>
              <span>{f.day(spark.dates[0])}</span>
              <span>{f.day(spark.dates[spark.dates.length - 1])}</span>
            </div>
          </div>
        )}

        {has && (
          <div style={{ position: "relative", display: "flex", gap: 8, padding: "5px 12px 6px", borderTop: `1px solid ${DK.line}` }}>
            {stat(f.tx("Min", "کم"), f.rs(stats.min))}
            {stat(f.tx("Max", "زیادہ"), f.rs(stats.max))}
            {stat(f.tx("Arrival", "آمد"), stats.arrival > 0 ? `${f.num(stats.arrival)} ${f.tx("bags", "بوریاں")}` : "—")}
          </div>
        )}

        {lockHistory && (
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: C.surfaceAlt, borderTop: `1px solid ${DK.line}` }}>
            <Icon name="lock" size={15} color={C.ink2} />
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: DK.sub, lineHeight: f.ur ? 1.8 : 1.3 }}>
              {f.tx("Earlier days are locked on the free plan.", "پچھلے دنوں کا ڈیٹا مفت پلان میں بند ہے۔")}
            </span>
            <button
              type="button"
              onClick={onSubscribe}
              style={{ height: 28, padding: "0 10px", borderRadius: 14, border: "none", background: C.brand, color: "#FFFFFF", fontWeight: 700, fontSize: 12, flexShrink: 0, fontFamily: f.font }}
            >
              {f.tx("Subscribe", "سبسکرائب")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
