import { useMemo, useState } from "react";

import { MANDI_DATA } from "../../shared/data/mandiLocation";
import { attrLabel, attrValue } from "./Filters";
import { arrow, normLoc, shortRate, stripMandi, type Fmt } from "./format";
import { statsFor } from "./selectors";
import { C } from "./theme";
import { TrendChart } from "./TrendChart";
import type { AttrKey, MarketRow } from "./types";
import { BottomSheet, Chip, ChangePill, HScroll, Icon, IconButton, Segmented } from "./ui";
import { TIMELINE } from "./useMarketData";

/** Everything about one mandi: each rate type it reported, how it compares
 * with the country, a month of price and arrivals, and what was traded. */
export function MandiDetailSheet({
  f,
  t,
  tm,
  tr,
  mandiName,
  initialRate,
  allRows,
  dates,
  date,
  onClose,
  onListen,
  onSetLocation,
}: {
  f: Fmt;
  t: (s: string) => string;
  tm: (s: string) => string;
  tr: (s: string) => string;
  mandiName: string;
  initialRate: string;
  allRows: MarketRow[];
  dates: string[];
  date: string;
  onClose: () => void;
  onListen: (text: string) => void;
  onSetLocation: () => void;
}) {
  const key = normLoc(mandiName);
  const mine = useMemo(() => allRows.filter((r) => normLoc(r.mandiName) === key), [allRows, key]);
  const today = mine.filter((r) => r.date === date);
  const rates = [...new Set(today.map((r) => r.rateType))];
  const [rate, setRate] = useState(rates.includes(initialRate) ? initialRate : rates[0] || initialRate);
  const [view, setView] = useState<"price" | "arrival">("price");
  const [idx, setIdx] = useState(TIMELINE.length - 1);
  const [showInfo, setShowInfo] = useState(false);

  // Lookup mandi wiki / agricultural background profile
  const mandiMeta = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = norm(mandiName);
    const cityTarget = norm(stripMandi(mandiName));
    return (
      MANDI_DATA.find((m) => {
        const mn = norm(m.name);
        const mc = norm(m.city);
        return mn === target || mc === cityTarget || target.includes(mc) || mn.includes(cityTarget);
      }) || null
    );
  }, [mandiName]);

  const cur = today.filter((r) => r.rateType === rate);
  const s = statsFor(cur);
  const timelineIdx = TIMELINE.indexOf(date);
  const prevDate = timelineIdx > 0 ? TIMELINE[timelineIdx - 1] : dates[dates.indexOf(date) - 1];
  const prevRows = prevDate ? mine.filter((r) => r.date === prevDate && r.rateType === rate) : [];
  const prev = prevRows.length ? statsFor(prevRows) : null;
  const change = prev && prev.mid > 0 && s.mid > 0 ? ((s.mid - prev.mid) / prev.mid) * 100 : null;
  const diffYesterday = prev && prev.mid > 0 && s.mid > 0 ? s.mid - prev.mid : null;

  // Rank among all mandis for the same rate type that day.
  const byMandi = new Map<string, MarketRow[]>();
  for (const r of allRows) if (r.date === date && r.rateType === rate) byMandi.set(r.mandiName, [...(byMandi.get(r.mandiName) || []), r]);
  const mids = [...byMandi.entries()].map(([m, rs]) => ({ m, mid: statsFor(rs).mid })).sort((a, b) => b.mid - a.mid);
  const rank = mids.findIndex((x) => normLoc(x.m) === key) + 1;

  // Month series for this mandi + rate type (unreported days are gaps).
  const series = useMemo(() => {
    const lo: number[] = [];
    const hi: number[] = [];
    const mid: number[] = [];
    const arr: number[] = [];
    for (const d of TIMELINE) {
      const st = statsFor(mine.filter((r) => r.date === d && r.rateType === rate));
      lo.push(st.min);
      hi.push(st.max);
      mid.push(st.mid);
      arr.push(st.arrival);
    }
    return { lo, hi, mid, arr };
  }, [mine, rate]);

  const specKeys: AttrKey[] = ["newOld", "moisture", "color", "variety", "origin", "spec"];
  const join = (vals: (string | undefined)[]) => [...new Set(vals.filter(Boolean) as string[])];
  const name = tm(stripMandi(mandiName));
  const place = cur[0] || today[0] || mine[0];
  const color = C.brand;

  const districtName = place?.district
    ? f.ur
      ? `ضلع ${tm(place.district).replace(/ضلع/g, "").trim()}`
      : `${tm(place.district).replace(/\s*district$/i, "")} District`
    : mandiMeta?.district
      ? f.ur
        ? `ضلع ${tm(mandiMeta.district)}`
        : `${mandiMeta.district} District`
      : "";
  const provinceName = place?.province ? tm(place.province) : mandiMeta?.province ? tm(mandiMeta.province) : "";
  const dateStr = f.dayFullYear(date);
  const subtitle = [districtName, provinceName, dateStr].filter(Boolean).join(f.ur ? "، " : ", ");

  const spoken = f.tx(
    `${stripMandi(mandiName)} Mandi, ${shortRate(rate)} rate, ${Math.round(s.min)} to ${Math.round(s.max)} rupees per 40 kilo`,
    `${name} منڈی، ${shortRate(tr(rate))}، ${Math.round(s.min)} سے ${Math.round(s.max)} روپے فی چالیس کلو`,
  );

  const tradedFields = [
    ...specKeys.map((k) => ({ label: attrLabel(f, k), vals: join(cur.map((r) => r[k])).map((v) => attrValue(f, t, k, v)) })),
    { label: f.tx("Attribute", "خصوصیات"), vals: join(cur.map((r) => r.quality)) },
    { label: f.tx("Arrival", "آمد"), vals: s.arrival > 0 ? [`${f.num(s.arrival)} ${f.tx("bags", "بوریاں")}`] : [] },
    { label: f.tx("Arrival unit", "آمد کی اکائی"), vals: join(cur.map((r) => r.arrivalUnit)) },
  ].filter((x) => x.vals.length > 0);

  const box = (label: string, value: string, valColor: string = C.ink, bg: string = C.surfaceAlt) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: 10, borderRadius: 14, background: bg, minWidth: 0 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: valColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </div>
  );

  const defaultProfile = f.tx(
    `${stripMandi(mandiName)} is an active agricultural grain market hub in ${place?.province || mandiMeta?.province || "Pakistan"}, connecting regional growers with wholesale buyers for daily transparent auctions.`,
    `${name} پاکستان کی زرعی منڈیوں میں سے ایک اہم تجارتی مرکز ہے جہاں روزانہ اجناس کی خرید و فروخت اور شفاف بولیاں ہوتی ہیں۔`,
  );

  return (
    <BottomSheet
      onClose={onClose}
      title={f.tx(`${name} Mandi`, `${name} منڈی`)}
      subtitle={subtitle}
      dir={f.dir}
      font={f.font}
      display={f.display}
      action={
        <IconButton
          label={f.tx("Mandi Information & Wikipedia", "منڈی کی معلومات اور پس منظر")}
          onClick={() => setShowInfo((v) => !v)}
          active={showInfo}
          activeBg={C.brandTint}
          activeBorder={C.brandBorder}
        >
          <Icon name="info" size={19} color={showInfo ? C.brand : C.ink2} width={showInfo ? 2.5 : 2.2} />
        </IconButton>
      }
      footer={
        <>
          <button
            type="button"
            aria-label={f.tx("Hear this rate", "یہ ریٹ سنیں")}
            onClick={() => onListen(spoken)}
            style={{ width: 52, height: 52, borderRadius: 16, border: `1px solid ${C.line}`, background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <Icon name="speaker" size={22} color={C.brand} />
          </button>
          <button
            type="button"
            onClick={onSetLocation}
            style={{ flex: 1, height: 52, borderRadius: 16, border: "none", background: C.brand, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: f.font }}
          >
            {f.tx("Show this mandi at the top", "اس منڈی کو اوپر دکھائیں")}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Mandi Wikipedia / Location Details card */}
        {showInfo && (
          <div
            style={{
              borderRadius: 22,
              background: "#F0FDF4",
              border: `1.5px solid #BBF7D0`,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 4px 16px rgba(22, 101, 52, 0.08)",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: "#DCFCE7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.brand,
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  ℹ
                </span>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#14532D", fontFamily: f.display }}>
                    {f.tx(`About ${stripMandi(mandiName)} Mandi`, `${name} منڈی کا تعارف و پس منظر`)}
                  </span>

                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                style={{
                  border: "none",
                  background: "#DCFCE7",
                  color: "#166534",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                {f.tx("Hide", "چھپائیں")}
              </button>
            </div>

            <p
              style={{
                fontSize: 13.5,
                lineHeight: f.ur ? 1.9 : 1.55,
                color: "#1F2937",
                margin: 0,
                padding: "10px 12px",
                background: "rgba(255, 255, 255, 0.85)",
                borderRadius: 14,
                borderLeft: f.ur ? undefined : `3px solid ${C.brand}`,
                borderRight: f.ur ? `3px solid ${C.brand}` : undefined,
              }}
            >
              {mandiMeta?.agriProfile || defaultProfile}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255, 255, 255, 0.75)", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{f.tx("Major Crops", "اہم فصلیں")}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1F2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {mandiMeta?.commodities?.map((c) => t(c)).join("، ") || f.tx("Wheat, Grains", "گندم، اجناس")}
                </span>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255, 255, 255, 0.75)", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{f.tx("Region", "ڈسٹرکٹ / صوبہ")}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1F2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {place?.district || mandiMeta?.district || "—"}, {place?.province || mandiMeta?.province || "Punjab"}
                </span>
              </div>
            </div>
          </div>
        )}
        <div style={{ borderRadius: 22, background: C.surface, border: `1px solid ${C.line}`, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>
                <span style={{ color: C.ink, fontWeight: 700 }}>{shortRate(tr(rate))}</span> · {f.tx("per 40 kg", "فی ۴۰ کلو")}
              </span>
              <span style={{ fontFamily: f.display, fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: f.ur ? 1.8 : 1.1, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
                {s.min > 0 ? `${f.rs(s.min)} – ${f.num(s.max)}` : "—"}
              </span>
            </div>
            {change !== null && <ChangePill value={change} text={Math.abs(change) < 0.05 ? f.tx("No change", "کوئی تبدیلی نہیں") : `${arrow(change)} ${f.pct(change)}`} />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {box(
              prevDate ? f.tx(`vs ${f.day(prevDate)}`, `بمقابلہ ${f.day(prevDate)}`) : f.tx("vs Yesterday", "گزشتہ کل سے"),
              diffYesterday !== null ? `${diffYesterday >= 0 ? "+" : "−"}${f.rs(Math.abs(diffYesterday))}` : "—",
              diffYesterday !== null ? (diffYesterday > 0 ? C.up : diffYesterday < 0 ? C.down : C.ink) : C.ink,
            )}
            {box(f.tx("Rank today", "آج کا درجہ"), rank > 0 && mids.length > 1 ? f.tx(`${rank} of ${mids.length}`, `${f.digits(mids.length)} میں ${f.digits(rank)}`) : f.tx("Only one", "واحد"))}
          </div>
          <Segmented
            label={f.tx("Chart", "چارٹ")}
            value={view}
            onChange={setView}
            font={f.font}
            options={[
              { id: "price", label: f.tx("Price trend", "قیمت کا رجحان"), color: C.brand },
              { id: "arrival", label: f.tx("Arrival trend", "آمد کا رجحان"), color: C.arrival },
            ]}
          />
          {view === "price" ? (
            <TrendChart
              f={f}
              height={170}
              dates={TIMELINE}
              connectGaps
              hideSlider
              tooltip={(k) => (series.lo[k] > 0 ? { title: f.day(TIMELINE[k], true), value: `${f.num(series.lo[k])}–${f.num(series.hi[k])}` } : null)}
              series={[{ color, values: series.mid, lo: series.lo, hi: series.hi }]}
              idx={idx}
              onIdx={setIdx}
              yUnit="rupees"
              ariaLabel={f.tx("Price over the month", "مہینے بھر کی قیمت")}
            />
          ) : (
            <TrendChart
              f={f}
              height={170}
              dates={TIMELINE}
              series={[]}
              bars={series.arr}
              barsOnly
              hideSlider
              idx={idx}
              onIdx={setIdx}
              yUnit="bags"
              ariaLabel={f.tx("Arrivals over the month", "مہینے بھر کی آمد")}
            />
          )}
        </div>

        {tradedFields.length > 0 && (
          <div style={{ borderRadius: 22, background: C.surface, border: `1px solid ${C.line}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 6px", fontFamily: f.display, fontSize: 16, fontWeight: 700 }}>{f.tx("Attributes", "خصوصیات")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              {tradedFields.map((it) => (
                <div key={it.label} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 16px", borderTop: `1px solid ${C.lineSoft}` }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: C.muted }}>{it.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{it.vals.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
