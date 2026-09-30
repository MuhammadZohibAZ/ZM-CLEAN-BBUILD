import { useMemo } from "react";

import { shortRate, stripMandi, type Fmt } from "./format";
import { ALL_RATES, statsFor } from "./selectors";
import { C } from "./theme";
import type { MarketRow } from "./types";
import { Card, Icon } from "./ui";

/**
 * "Where should I sell today?" — the highest and lowest paying mandis for
 * one rate type on the chosen day, against the national average. Rates are
 * only compared within a single rate type (retail vs farm would mislead);
 * with "All rates" it uses the most reported rate type.
 */
export function BestPlaces({
  f,
  tm,
  tr,
  dayRows,
  rate,
  onOpen,
  compact = false,
}: {
  f: Fmt;
  tm: (s: string) => string;
  tr: (s: string) => string;
  dayRows: MarketRow[]; // one day, all of Pakistan, filters applied
  rate: string;
  onOpen: (mandi: string, rate: string) => void;
  compact?: boolean;
}) {
  const data = useMemo(() => {
    let basis = rate;
    if (basis === ALL_RATES) {
      const counts = new Map<string, Set<string>>();
      for (const r of dayRows) counts.set(r.rateType, (counts.get(r.rateType) || new Set()).add(r.mandiName));
      basis = [...counts.entries()].sort((a, b) => b[1].size - a[1].size)[0]?.[0] || "";
    }
    const byMandi = new Map<string, MarketRow[]>();
    for (const r of dayRows) if (r.rateType === basis) byMandi.set(r.mandiName, [...(byMandi.get(r.mandiName) || []), r]);
    const list = [...byMandi.entries()]
      .map(([m, rs]) => ({ mandi: m, district: rs[0].district, province: rs[0].province, mid: statsFor(rs).mid }))
      .filter((o) => o.mid > 0)
      .sort((a, b) => b.mid - a.mid);
    if (list.length < 3) return null;
    const avg = list.reduce((a, o) => a + o.mid, 0) / list.length;
    return { basis, avg, high: list[0], low: list[list.length - 1], count: list.length };
  }, [dayRows, rate]);

  if (!data) return null;

  const row = (kind: "high" | "low") => {
    const o = data[kind];
    const diff = o.mid - data.avg;
    const up = kind === "high";
    return (
      <button
        type="button"
        className="zm-row"
        onClick={() => onOpen(o.mandi, data.basis)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: compact ? 8 : 12,
          padding: compact ? "6px 12px" : "12px 16px",
          border: "none",
          borderTop: kind === "low" ? `1px solid ${C.lineSoft}` : "none",
          background: C.surface,
          textAlign: "start",
          fontFamily: f.font,
          color: C.ink,
        }}
      >
        <span
          style={{
            width: compact ? 24 : 34,
            height: compact ? 24 : 34,
            borderRadius: compact ? 12 : 17,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: up ? C.upTint : C.downTint,
            color: up ? C.up : C.down,
            fontSize: compact ? 11 : 14,
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          {up ? "▲" : "▼"}
        </span>
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: compact ? 11 : 12.5, fontWeight: 500, color: C.muted, lineHeight: f.lh }}>{up ? f.tx("Highest rate", "سب سے زیادہ ریٹ") : f.tx("Lowest rate", "سب سے کم ریٹ")}</span>
          <span style={{ fontSize: compact ? 13.5 : 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: f.lh }}>
            {tm(stripMandi(o.mandi))}
            <span style={{ fontWeight: 500, color: C.muted }}> · {tm(o.province || o.district)}</span>
          </span>
        </span>
        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
          <span style={{ fontSize: compact ? 13.5 : 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>{f.rs(o.mid)}</span>
          <span style={{ fontSize: compact ? 11 : 12.5, fontWeight: 600, color: up ? C.up : C.down, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
            {diff >= 0 ? "+" : "−"}
            {f.num(Math.abs(diff))} {f.tx("vs avg", "اوسط سے")}
          </span>
        </span>
        <Icon name="chevRight" size={compact ? 13 : 16} width={2.4} color={C.faint} flip={f.ur} />
      </button>
    );
  };

  return (
    <div style={{ padding: compact ? "0" : "16px 16px 0" }}>
      <Card style={{ overflow: "hidden", borderRadius: compact ? 16 : 20, border: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, padding: compact ? "7px 12px 3px" : "14px 16px 6px" }}>
          <span style={{ fontSize: compact ? 13.5 : 16, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: f.ur ? 1.6 : 1.2 }}>{f.tx("Today's price range", "آج کی قیمت کی حد")}</span>
          <span style={{ fontSize: compact ? 11 : 12.5, fontWeight: 500, color: C.muted, whiteSpace: "nowrap" }}>
            {shortRate(tr(data.basis))} · {f.tx(`${data.count} mandis`, `${f.digits(data.count)} منڈیاں`)}
          </span>
        </div>
        {row("high")}
        {row("low")}
      </Card>
    </div>
  );
}
