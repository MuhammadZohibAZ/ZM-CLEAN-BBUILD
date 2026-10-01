import { useRef, useState } from "react";

import { axisSpec, type Fmt } from "./format";
import { C } from "./theme";

/** Trading-app candle colours + MA lines (Binance-style, tuned to the app). */
export const CANDLE = {
  up: "#0E9F6E",
  down: "#E5484D",
  flat: "#8C9A95",
  ma7: "#F0B90B",
  ma14: "#7C5CFC",
  grid: "#EEF1EF",
  axis: "#8C9A95",
};

export type CandleData = {
  dates: string[]; // visible window
  open: number[]; // previous reported day's average (0 = none)
  high: number[]; // day max
  low: number[]; // day min
  close: number[]; // day average
  vol: number[]; // arrivals (bags)
  ma7: number[];
  ma14: number[];
};

/**
 * Binance-style price chart: candles, volume pane, MA(7)/MA(14), right price
 * axis with a live price tag, high/low markers, and a crosshair with axis tags.
 *
 * Gestures (touch-first):
 *  - drag sideways  → scroll back / forward in time (onPanDays: + = earlier)
 *  - pinch / wheel  → zoom the number of visible days (onSpan)
 *  - tap or hold    → crosshair on a day; tap again to hide
 */
export function CandleChart({
  f,
  data,
  latestClose,
  idx,
  onIdx,
  span,
  onSpan,
  onPanDays,
  animKey,
  height = 300,
}: {
  f: Fmt;
  data: CandleData;
  latestClose: number;
  idx: number | null;
  onIdx: (i: number | null) => void;
  span: number;
  onSpan?: (days: number) => void;
  onPanDays?: (deltaDays: number) => void;
  animKey: string;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const W = 360;
  const TITLE_W = 14; // rotated "Rupees" axis title
  const AX = 50 + TITLE_W; // right price axis
  const plotW = W - AX;
  const H = height;
  const priceTop = 10;
  const volH = 52;
  const dateH = 22;
  const priceBottom = H - dateH - volH - 12;
  const volTop = priceBottom + 12;
  const volBottom = volTop + volH;
  const n = data.dates.length;
  const slot = plotW / Math.max(n, 1);
  const cw = Math.max(3, Math.min(12, slot * 0.62));
  const xc = (i: number) => {
    const px = slot * i + slot / 2;
    return f.ur ? plotW - px : px;
  };

  // Price scale over visible highs/lows (+ MA values), padded.
  const vals = [...data.high, ...data.low, ...data.ma7, ...data.ma14].filter((v) => v > 0);
  const rawLo = vals.length ? Math.min(...vals) : 0;
  const rawHi = vals.length ? Math.max(...vals) : 1;
  const pad = Math.max((rawHi - rawLo) * 0.1, 10);
  const lo = rawLo - pad;
  const hi = rawHi + pad;
  const y = (v: number) => priceTop + (1 - (v - lo) / (hi - lo || 1)) * (priceBottom - priceTop);
  const vMax = Math.max(...data.vol, 1);
  const yv = (v: number) => volBottom - (v / vMax) * volH;

  const color = (i: number) => {
    const o = data.open[i];
    const c = data.close[i];
    if (!(o > 0 && c > 0) || o === c) return CANDLE.flat;
    return c > o ? CANDLE.up : CANDLE.down;
  };

  // High / low markers over the visible window.
  let hiI = -1;
  let loI = -1;
  data.high.forEach((v, i) => v > 0 && (hiI < 0 || v > data.high[hiI]) && (hiI = i));
  data.low.forEach((v, i) => v > 0 && (loI < 0 || v < data.low[loI]) && (loI = i));

  const maPath = (arr: number[]) =>
    arr
      .map((v, i) => (v > 0 ? `${xc(i).toFixed(1)},${y(v).toFixed(1)}` : null))
      .reduce<string[]>((acc, p, i, all) => {
        if (!p) return acc;
        acc.push(`${i === 0 || !all[i - 1] ? "M" : "L"}${p}`);
        return acc;
      }, [])
      .join(" ");

  const ticks = [0.15, 0.4, 0.65, 0.9].map((p) => hi - (hi - lo) * p);
  const labelIdx = n > 1 ? [...new Set([0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1])] : [0];

  // ── Gestures ──────────────────────────────────────────────
  const pointers = useRef(new Map<number, number>()); // id -> clientX
  const g = useRef<{ mode: "idle" | "pending" | "pan" | "cross" | "pinch"; x: number; timer: number | null; applied: number; dist: number; baseSpan: number; wasCross: boolean }>({
    mode: "idle",
    x: 0,
    timer: null,
    applied: 0,
    dist: 0,
    baseSpan: span,
    wasCross: false,
  });
  const [crossY, setCrossY] = useState<number | null>(null);

  const indexAt = (clientX: number) => {
    const el = svgRef.current;
    if (!el || n < 1) return 0;
    const r = el.getBoundingClientRect();
    let px = ((clientX - r.left) / r.width) * W;
    if (f.ur) px = plotW - px;
    return Math.max(0, Math.min(n - 1, Math.floor(px / slot)));
  };
  const tick = () => {
    try {
      navigator.vibrate?.(4);
    } catch {
      /* no haptics */
    }
  };
  const showCross = (clientX: number, clientY?: number) => {
    const i = indexAt(clientX);
    if (i !== idx) tick();
    onIdx(i);
    const el = svgRef.current;
    if (el && clientY !== undefined) {
      const r = el.getBoundingClientRect();
      const vy = ((clientY - r.top) / r.height) * H;
      setCrossY(vy >= priceTop && vy <= priceBottom ? vy : null);
    }
  };
  const hideCross = () => {
    onIdx(null);
    setCrossY(null);
  };
  const pinchDist = () => {
    const xs = [...pointers.current.values()];
    return xs.length >= 2 ? Math.abs(xs[0] - xs[1]) : 0;
  };

  const crossActive = idx !== null;
  const ci = idx ?? n - 1;
  const crossPrice = crossY !== null ? lo + (1 - (crossY - priceTop) / (priceBottom - priceTop)) * (hi - lo) : data.close[ci];
  const latestY = latestClose > 0 ? Math.min(Math.max(y(latestClose), priceTop), priceBottom) : null;
  const lastDir = color(n - 1);

  const tag = (yy: number, text: string, fill: string) => (
    <g>
      <rect x={W - AX + 2} y={yy - 9} width={AX - TITLE_W - 4} height={18} rx={4} fill={fill} />
      <text x={W - TITLE_W - (AX - TITLE_W) / 2} y={yy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff" style={{ fontVariantNumeric: "tabular-nums" }}>
        {text}
      </text>
    </g>
  );

  return (
    <div style={{ position: "relative" }}>
      {/* MA legend */}
      <div style={{ display: "flex", gap: 12, padding: "0 12px 4px", fontSize: 11.5, fontWeight: 600, fontVariantNumeric: "tabular-nums", direction: "ltr" }}>
        <span style={{ color: CANDLE.ma7 }}>{f.tx("7-day avg", "۷ دن اوسط")} {data.ma7[ci] > 0 ? f.num(data.ma7[ci]) : "—"}</span>
        <span style={{ color: CANDLE.ma14 }}>{f.tx("14-day avg", "۱۴ دن اوسط")} {data.ma14[ci] > 0 ? f.num(data.ma14[ci]) : "—"}</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={f.tx("Candle chart. Drag for earlier days, pinch to zoom, tap for details.", "کینڈل چارٹ")}
        style={{ display: "block", touchAction: "pan-y", userSelect: "none", WebkitTapHighlightColor: "transparent" }}
        onWheel={(e) => {
          if (!onSpan) return;
          onSpan(span + (e.deltaY > 0 ? 2 : -2));
        }}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* capture unsupported */
          }
          pointers.current.set(e.pointerId, e.clientX);
          const s = g.current;
          if (pointers.current.size === 2 && onSpan) {
            if (s.timer) window.clearTimeout(s.timer);
            s.mode = "pinch";
            s.dist = pinchDist();
            s.baseSpan = span;
            return;
          }
          s.x = e.clientX;
          s.applied = 0;
          s.wasCross = crossActive;
          s.mode = "pending";
          s.timer = window.setTimeout(() => {
            if (g.current.mode !== "pending") return;
            g.current.mode = "cross";
            try {
              navigator.vibrate?.(8);
            } catch {
              /* no haptics */
            }
            showCross(g.current.x, e.clientY);
          }, 250);
        }}
        onPointerMove={(e) => {
          if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, e.clientX);
          const s = g.current;
          if (s.mode === "pinch" && onSpan) {
            const d = pinchDist();
            if (s.dist > 0 && d > 0) onSpan(Math.round(s.baseSpan / (d / s.dist)));
            return;
          }
          if (s.mode === "pending") {
            if (Math.abs(e.clientX - s.x) < 6) return;
            if (s.timer) window.clearTimeout(s.timer);
            s.mode = crossActive ? "cross" : "pan";
          }
          if (s.mode === "pan" && onPanDays && svgRef.current) {
            const r = svgRef.current.getBoundingClientRect();
            const pxPerDay = (r.width * plotW) / W / Math.max(n, 1);
            const days = Math.round((e.clientX - s.x) / pxPerDay) * (f.ur ? -1 : 1);
            if (days !== s.applied) {
              onPanDays(days - s.applied);
              s.applied = days;
            }
          } else if (s.mode === "cross") {
            showCross(e.clientX, e.clientY);
          }
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          const s = g.current;
          if (s.timer) window.clearTimeout(s.timer);
          if (s.mode === "pending") {
            // a tap: toggle the crosshair
            if (s.wasCross) hideCross();
            else showCross(e.clientX, e.clientY);
          }
          if (pointers.current.size === 0) s.mode = "idle";
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          g.current.mode = "idle";
        }}
      >
        {/* grid */}
        {ticks.map((v, k) => (
          <line key={`h${k}`} x1={0} x2={plotW} y1={y(v)} y2={y(v)} stroke={CANDLE.grid} />
        ))}
        {labelIdx.map((i) => (
          <line key={`v${i}`} x1={xc(i)} x2={xc(i)} y1={priceTop} y2={volBottom} stroke={CANDLE.grid} />
        ))}
        <line x1={0} x2={plotW} y1={volTop - 6} y2={volTop - 6} stroke={CANDLE.grid} />

        <text
          x={W - 5}
          y={(priceTop + priceBottom) / 2}
          transform={`rotate(90 ${W - 5} ${(priceTop + priceBottom) / 2})`}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          fontWeight="700"
          fill={CANDLE.axis}
        >
          {axisSpec(f, "rupees", rawHi).title}
        </text>
        {/* right price axis labels */}
        {ticks.map((v, k) => {
          // Hide an axis label that would collide with the live-price or crosshair tag.
          const ty = y(v);
          const clash = (latestY !== null && Math.abs(ty - latestY) < 16) || (crossActive && Math.abs(ty - (crossY ?? y(data.close[ci] || lo))) < 16);
          return clash ? null : (
            <text key={`t${k}`} x={W - TITLE_W - 2} y={ty + 4} textAnchor="end" fontSize="11" fontWeight="500" fill={CANDLE.axis} style={{ fontVariantNumeric: "tabular-nums" }}>
              {f.num(v)}
            </text>
          );
        })}

        <g key={animKey}>
          {/* volume */}
          {data.vol.map((v, i) =>
            v > 0 ? (
              <rect
                key={`vol${i}`}
                className="zm-grow"
                style={{ animationDelay: `${Math.min(i, 40) * 10}ms` }}
                x={xc(i) - cw / 2}
                y={yv(v)}
                width={cw}
                height={Math.max(1, volBottom - yv(v))}
                fill={color(i)}
                opacity={crossActive && i !== ci ? 0.25 : 0.4}
              />
            ) : null,
          )}

          {/* candles */}
          {data.close.map((c, i) => {
            const h = data.high[i];
            const l = data.low[i];
            if (!(c > 0 && h > 0 && l > 0)) return null;
            const o = data.open[i] > 0 ? data.open[i] : c;
            const col = color(i);
            const top = y(Math.max(o, c));
            const bot = y(Math.min(o, c));
            return (
              <g key={`c${i}`} className="zm-grow" style={{ animationDelay: `${Math.min(i, 40) * 10}ms`, opacity: crossActive && i !== ci ? 0.55 : 1 }}>
                <line x1={xc(i)} x2={xc(i)} y1={y(h)} y2={y(l)} stroke={col} strokeWidth={1.2} />
                <rect x={xc(i) - cw / 2} y={top} width={cw} height={Math.max(1.4, bot - top)} rx={1} fill={col} />
              </g>
            );
          })}

          {/* moving averages */}
          <path d={maPath(data.ma7)} fill="none" stroke={CANDLE.ma7} strokeWidth={1.4} strokeLinejoin="round" className="zm-fadein" />
          <path d={maPath(data.ma14)} fill="none" stroke={CANDLE.ma14} strokeWidth={1.4} strokeLinejoin="round" className="zm-fadein" />
        </g>

        {/* high / low markers */}
        {hiI >= 0 && (
          <g>
            <line x1={xc(hiI)} x2={xc(hiI) + (xc(hiI) > plotW / 2 ? -16 : 16)} y1={y(data.high[hiI])} y2={y(data.high[hiI])} stroke={C.ink2} strokeWidth={1} />
            <text
              x={xc(hiI) + (xc(hiI) > plotW / 2 ? -19 : 19)}
              y={y(data.high[hiI]) + 4}
              textAnchor={xc(hiI) > plotW / 2 ? "end" : "start"}
              fontSize="11"
              fontWeight="600"
              fill={C.ink2}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {f.num(data.high[hiI])}
            </text>
          </g>
        )}
        {loI >= 0 && (
          <g>
            <line x1={xc(loI)} x2={xc(loI) + (xc(loI) > plotW / 2 ? -16 : 16)} y1={y(data.low[loI])} y2={y(data.low[loI])} stroke={C.ink2} strokeWidth={1} />
            <text
              x={xc(loI) + (xc(loI) > plotW / 2 ? -19 : 19)}
              y={y(data.low[loI]) + 4}
              textAnchor={xc(loI) > plotW / 2 ? "end" : "start"}
              fontSize="11"
              fontWeight="600"
              fill={C.ink2}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {f.num(data.low[loI])}
            </text>
          </g>
        )}

        {/* live price line + tag */}
        {latestY !== null && (
          <g>
            <line x1={0} x2={plotW} y1={latestY} y2={latestY} stroke={lastDir} strokeDasharray="3 3" strokeWidth={1} opacity={0.8} />
            {tag(latestY, f.num(latestClose), lastDir)}
          </g>
        )}

        {/* crosshair */}
        {crossActive && (
          <g pointerEvents="none">
            <line x1={xc(ci)} x2={xc(ci)} y1={priceTop} y2={volBottom} stroke={C.ink} strokeDasharray="3 3" strokeWidth={1} opacity={0.55} />
            {crossY !== null && <line x1={0} x2={plotW} y1={crossY} y2={crossY} stroke={C.ink} strokeDasharray="3 3" strokeWidth={1} opacity={0.55} />}
            {tag(crossY ?? y(data.close[ci] || lo), f.num(crossPrice), C.ink)}
            {(() => {
              const label = f.day(data.dates[ci]);
              const w = 56;
              const cx = Math.min(Math.max(xc(ci), w / 2), plotW - w / 2);
              return (
                <g>
                  <rect x={cx - w / 2} y={H - dateH + 2} width={w} height={18} rx={4} fill={C.ink} />
                  <text x={cx} y={H - dateH + 15} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">
                    {label}
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* date axis */}
        {!crossActive &&
          labelIdx.map((i, k) => (
            <text
              key={`d${i}`}
              x={xc(i)}
              y={H - 6}
              textAnchor={k === 0 ? (f.ur ? "end" : "start") : k === labelIdx.length - 1 ? (f.ur ? "start" : "end") : "middle"}
              fontSize="11"
              fontWeight="500"
              fill={CANDLE.axis}
            >
              {f.day(data.dates[i])}
            </text>
          ))}
        <text x={4} y={volTop + 6} fontSize="11" fontWeight="600" fill={C.ink2} stroke="#FFFFFF" strokeWidth={3} paintOrder="stroke" style={{ fontVariantNumeric: "tabular-nums" }}>
          {f.tx("Arrivals", "آمد")} {data.vol[ci] > 0 ? `${f.num(data.vol[ci])} ${f.tx("bags", "بوریاں")}` : ""}
        </text>
      </svg>
    </div>
  );
}
