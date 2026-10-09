import { useId, useRef, useState } from "react";

import { axisSpec, niceTicks, type AxisUnit, type Fmt } from "./format";
import { C } from "./theme";

export type Series = { color: string; values: number[]; lo?: number[]; hi?: number[] };

/**
 * The one chart used across the screen. Draws optional min–max bands,
 * lines and arrival bars on a shared day axis. Built for touch:
 *  - press and slide a finger to scrub; a value bubble follows the finger
 *    and each new day gives a tiny haptic tick (Android);
 *  - the line draws itself in and bars grow whenever the data changes;
 *  - zero values mean "no report" and are skipped, never drawn as a crash.
 */
export function TrendChart({
  f,
  dates,
  series,
  bars,
  barColor = "rgba(8,127,99,0.22)",
  barActive = C.brand,
  barsOnly = false,
  idx,
  onIdx,
  height = 240,
  compact = false,
  connectGaps = true,
  hideSlider = false,
  candles = false,
  onPanDays,
  animKey,
  yFormat,
  yUnit,
  tooltip,
  ariaLabel,
}: {
  f: Fmt;
  dates: string[];
  series: Series[];
  bars?: number[];
  barColor?: string;
  barActive?: string;
  barsOnly?: boolean;
  idx: number;
  onIdx?: (i: number) => void;
  height?: number;
  compact?: boolean;
  /** Draw one continuous line through days with no report. */
  connectGaps?: boolean;
  /** Keep the day slider for keyboards / screen readers but hide it visually. */
  hideSlider?: boolean;
  /** Binance-style candles: wick = day min–max, body = previous → current average. */
  candles?: boolean;
  /** Enables drag-to-pan through time. Called with whole days: + = earlier. */
  onPanDays?: (deltaDays: number) => void;
  /** Replays the draw-in animation only when this changes (not while panning). */
  animKey?: string;
  yFormat?: (v: number) => string;
  /** Y-axis title and number style (Rupees / Bags (k)); see axisSpec. */
  yUnit?: AxisUnit;
  /** Text for the bubble shown while a finger is on the chart. */
  tooltip?: (i: number) => { title: string; value: string } | null;
  ariaLabel: string;
}) {
  const gid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastIdx = useRef(idx);
  const [touching, setTouching] = useState(false);
  // Gesture: slide = pan through time, press-and-hold = crosshair scrub, tap = pick a day.
  const gesture = useRef<{ x: number; y: number; mode: "idle" | "pending" | "pan" | "scrub"; timer: number | null; applied: number }>({
    x: 0,
    y: 0,
    mode: "idle",
    timer: null,
    applied: 0,
  });
  const endGesture = (tapX?: number) => {
    const g = gesture.current;
    if (g.timer) window.clearTimeout(g.timer);
    if (g.mode === "pending" && tapX !== undefined) pick(tapX); // quick tap selects that day
    g.mode = "idle";
    g.timer = null;
    setTouching(false);
  };
  const W = 340;
  const axisW = compact ? 0 : 44;
  const plotW = W - axisW;
  const H = height;
  const bottomAxis = compact ? 4 : 22;
  const barH = bars && !barsOnly ? (compact ? 0 : 38) : 0;
  const lineTop = 10;
  const lineBottom = H - bottomAxis - (barH ? barH + 10 : 0);
  const n = dates.length;
  // Compact charts run edge to edge; inset the ends so the first/last point's dot isn't clipped.
  const edge = compact ? 10 : 0;
  const x = (i: number) => (n <= 1 ? plotW / 2 : edge + (i / (n - 1)) * (plotW - edge * 2));
  const xr = (i: number) => (f.ur ? plotW - x(i) + axisW : x(i));

  const allVals = barsOnly
    ? [0, ...(bars || [])]
    : series.flatMap((s) => [...s.values, ...(s.lo || []), ...(s.hi || [])]).filter((v) => v > 0);
  let lo = allVals.length ? Math.min(...allVals) : 0;
  let hi = allVals.length ? Math.max(...allVals) : 1;
  if (barsOnly) {
    lo = 0;
    hi = hi * 1.12 || 1;
  } else {
    const pad = Math.max((hi - lo) * (compact ? 0.45 : 0.12), 10);
    lo = Math.max(0, lo - pad);
    hi = hi + pad;
  }
  const y = (v: number) => lineTop + (1 - (v - lo) / (hi - lo || 1)) * (lineBottom - lineTop);

  // Catmull-Rom → cubic Bézier through a list of points (continues an open path).
  const smooth = (pts: [number, number][], move = true) => {
    let d = move ? `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}` : `L${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let k = 0; k < pts.length - 1; k++) {
      const p0 = pts[k - 1] || pts[k];
      const p1 = pts[k];
      const p2 = pts[k + 1];
      const p3 = pts[k + 2] || p2;
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  };

  // Smooth (Catmull-Rom → cubic Bézier) through reported days, seamlessly bridging missing days.
  const path = (vals: number[]) => {
    const runs: [number, number][][] = [];
    let cur: [number, number][] = [];
    vals.forEach((v, i) => {
      if (v > 0) cur.push([xr(i), y(v)]);
      else if (cur.length && !connectGaps) {
        runs.push(cur);
        cur = [];
      }
    });
    if (cur.length) runs.push(cur);
    return runs
      .map((pts) => {
        if (pts.length === 1) return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} l0.1,0`;
        let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
        for (let k = 0; k < pts.length - 1; k++) {
          const p0 = pts[k - 1] || pts[k];
          const p1 = pts[k];
          const p2 = pts[k + 1];
          const p3 = pts[k + 2] || p2;
          const c1x = p1[0] + (p2[0] - p0[0]) / 6;
          const c1y = p1[1] + (p2[1] - p0[1]) / 6;
          const c2x = p2[0] - (p3[0] - p1[0]) / 6;
          const c2y = p2[1] - (p3[1] - p1[1]) / 6;
          d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
        }
        return d;
      })
      .join(" ");
  };

  const band = (loV: number[], hiV: number[]) => {
    const idxs = loV.map((_, i) => i).filter((i) => loV[i] > 0 && hiV[i] > 0);
    if (idxs.length < 2) return "";
    const top: [number, number][] = idxs.map((i) => [xr(i), y(hiV[i])]);
    const bot: [number, number][] = [...idxs].reverse().map((i) => [xr(i), y(loV[i])]);
    return `${smooth(top)} ${smooth(bot, false)} Z`;
  };

  // Area under a line spans only the reported days without breaking.
  const area = (vals: number[]) => {
    const validIdxs = vals.map((v, i) => i).filter((i) => vals[i] > 0);
    if (validIdxs.length < 2) return "";
    const first = validIdxs[0];
    const last = validIdxs[validIdxs.length - 1];
    return `${path(vals)} L${xr(last).toFixed(1)},${lineBottom} L${xr(first).toFixed(1)},${lineBottom} Z`;
  };

  const getYForIdx = (vals: number[], targetIdx: number) => {
    if (vals[targetIdx] > 0) return y(vals[targetIdx]);
    if (!connectGaps) return null;
    let prevIdx = -1;
    for (let k = targetIdx - 1; k >= 0; k--) {
      if (vals[k] > 0) { prevIdx = k; break; }
    }
    let nextIdx = -1;
    for (let k = targetIdx + 1; k < vals.length; k++) {
      if (vals[k] > 0) { nextIdx = k; break; }
    }
    if (prevIdx >= 0 && nextIdx >= 0) {
      const ratio = (targetIdx - prevIdx) / (nextIdx - prevIdx);
      const interpVal = vals[prevIdx] + (vals[nextIdx] - vals[prevIdx]) * ratio;
      return y(interpVal);
    }
    if (prevIdx >= 0) return y(vals[prevIdx]);
    if (nextIdx >= 0) return y(vals[nextIdx]);
    return null;
  };

  const pick = (clientX: number) => {
    if (!onIdx || !svgRef.current || n < 1) return;
    const rect = svgRef.current.getBoundingClientRect();
    let rel = ((clientX - rect.left) / rect.width) * W;
    rel = f.ur ? plotW - (rel - axisW) : rel;
    const i = Math.max(0, Math.min(n - 1, Math.round((rel / plotW) * (n - 1))));
    if (i !== lastIdx.current) {
      lastIdx.current = i;
      try {
        navigator.vibrate?.(4); // tiny tick on Android; ignored elsewhere
      } catch {
        /* no haptics */
      }
    }
    onIdx(i);
  };

  const axis = yUnit && !compact ? axisSpec(f, yUnit, hi) : null;
  const fmtY = yFormat ?? axis?.format ?? f.num;
  const ticks = compact ? [] : barsOnly ? niceTicks(hi) : [0.2, 0.5, 0.8].map((p) => lo + (hi - lo) * p);
  const labelIdx = n > 1 ? [...new Set([0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1])] : [0];
  const barMax = bars ? Math.max(...bars, 1) : 1;
  const bw = Math.max(3, Math.min(barsOnly ? 14 : 8, (plotW / Math.max(n, 1)) * 0.6));
  const main = series[0];
  // Replays the draw-in animation whenever the data itself changes.
  const drawKey =
    animKey ?? `${n}|${series.map((s) => `${s.color}:${s.values.find((v) => v > 0) || 0}:${s.values[s.values.length - 1] || 0}`).join(",")}|${bars ? bars.length : 0}`;
  const cw = Math.max(3, Math.min(10, (plotW / Math.max(n, 1)) * 0.56));

  const tip = touching && tooltip ? tooltip(idx) : null;
  const tipLeft = Math.min(Math.max((xr(idx) / W) * 100, 16), 84);
  const dotY = barsOnly ? (bars && bars[idx] > 0 ? y(bars[idx]) : null) : main ? getYForIdx(main.values, idx) : null;
  // Sit just above the point; flip below it when the point is near the top.
  const tipBelow = dotY !== null && dotY < 56;
  const tipTop = dotY === null ? 0 : tipBelow ? dotY + 14 : dotY - 14;

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
      {tip && (
        <div
          className={tipBelow ? "zm-tip zm-tip-below" : "zm-tip"}
          style={{
            position: "absolute",
            top: tipTop,
            left: `${tipLeft}%`,
            transform: tipBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
            padding: "5px 9px",
            borderRadius: 9,
            background: C.ink,
            color: "#fff",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 5,
            boxShadow: "0 8px 20px rgba(15,26,23,0.22)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.7 }}>{tip.title}</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{tip.value}</div>
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={ariaLabel}
        style={{ display: "block", touchAction: onIdx ? "pan-y" : undefined, WebkitTapHighlightColor: "transparent", userSelect: "none" }}
        onPointerDown={(e) => {
          if (!onIdx && !onPanDays) return;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* capture unsupported */
          }
          const g = gesture.current;
          g.x = e.clientX;
          g.y = e.clientY;
          g.applied = 0;
          // Wait to see what the finger does: sideways or hold = scrub (or pan),
          // quick tap = pick that day, vertical = page scroll/pull (ignored).
          g.mode = "pending";
          g.timer = window.setTimeout(() => {
            if (gesture.current.mode !== "pending") return;
            gesture.current.mode = "scrub";
            setTouching(true);
            try {
              navigator.vibrate?.(8);
            } catch {
              /* no haptics */
            }
            pick(gesture.current.x);
          }, onPanDays ? 260 : 180);
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (g.mode === "pending") {
            const dx = Math.abs(e.clientX - g.x);
            const dy = Math.abs(e.clientY - g.y);
            if (dy >= 8 && dy > dx) {
              // Vertical: leave it to the page.
              if (g.timer) window.clearTimeout(g.timer);
              g.mode = "idle";
              g.timer = null;
              return;
            }
            if (dx < 8) return;
            if (g.timer) window.clearTimeout(g.timer);
            if (onPanDays) g.mode = "pan";
            else {
              g.mode = "scrub";
              setTouching(true);
            }
          }
          if (g.mode === "pan" && onPanDays && svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const pxPerDay = ((rect.width * plotW) / W) / Math.max(n - 1, 1);
            const days = Math.round((e.clientX - g.x) / pxPerDay) * (f.ur ? -1 : 1);
            if (days !== g.applied) {
              onPanDays(days - g.applied);
              g.applied = days;
            }
          } else if (g.mode === "scrub") {
            g.x = e.clientX;
            pick(e.clientX);
          }
        }}
        onPointerUp={(e) => endGesture(e.clientX)}
        onPointerCancel={() => endGesture()}
        onLostPointerCapture={() => gesture.current.mode !== "idle" && endGesture()}
      >
        <defs>
          <filter id={`shadow-${gid}`} x="-5%" y="-30%" width="110%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={main?.color || C.brand} floodOpacity="0.28" />
          </filter>
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={main?.color || C.brand} stopOpacity={0.2} />
            <stop offset="100%" stopColor={main?.color || C.brand} stopOpacity="0" />
          </linearGradient>
        </defs>

        {axis && (
          <text
            x={f.ur ? 2 : W - 2}
            y={13}
            textAnchor={f.ur ? "start" : "end"}
            fontSize="11"
            fontWeight="700"
            fill={C.muted}
            letterSpacing="0.02em"
          >
            {axis.title}
          </text>
        )}
        {ticks.map((v) => {
          const ty = y(v);
          if (axis && Math.abs(ty - 13) < 14) return null;
          return (
            <g key={v}>
              <line x1={f.ur ? axisW : 0} x2={f.ur ? W : plotW} y1={ty} y2={ty} stroke="#EEF1EF" strokeDasharray="3 4" />
              <text x={f.ur ? 2 : W - 2} y={ty + 4} textAnchor={f.ur ? "start" : "end"} fontSize="11.5" fontWeight="500" fill={C.faint} style={{ fontVariantNumeric: "tabular-nums" }}>
                {fmtY(v)}
              </text>
            </g>
          );
        })}

        <g key={`bars-${drawKey}`}>
          {bars &&
            bars.map((b, i) => {
              if (b <= 0) return null;
              const top = barsOnly ? y(b) : lineBottom + 10 + barH - (b / barMax) * barH;
              const bottom = barsOnly ? lineBottom : lineBottom + 10 + barH;
              if (!barsOnly && !barH) return null;
              return (
                <rect
                  key={i}
                  className="zm-grow"
                  style={{ animationDelay: `${Math.min(i, 30) * 12}ms` }}
                  x={xr(i) - bw / 2}
                  y={top}
                  width={bw}
                  height={Math.max(1, bottom - top)}
                  rx={2}
                  fill={i === idx ? barActive : barColor}
                />
              );
            })}
        </g>

        {!barsOnly && (
          <g key={`lines-${drawKey}`}>
            {candles && series.length === 1 && series[0].lo && series[0].hi ? (
              // Candles: wick = min–max, body = previous day's average → today's.
              series[0].values.map((mid, i) => {
                const loV = series[0].lo![i];
                const hiV = series[0].hi![i];
                if (!(loV > 0 && hiV > 0 && mid > 0)) return null;
                let prev = 0;
                for (let k = i - 1; k >= 0; k--) if (series[0].values[k] > 0) { prev = series[0].values[k]; break; }
                const open = prev || mid;
                const upDay = mid >= open;
                const col = mid === open ? C.muted : upDay ? C.up : C.down;
                const top = y(Math.max(open, mid));
                const bot = y(Math.min(open, mid));
                return (
                  <g key={i} className="zm-grow" style={{ animationDelay: `${Math.min(i, 30) * 12}ms`, opacity: i === idx || !touching ? 1 : 0.55 }}>
                    <line x1={xr(i)} x2={xr(i)} y1={y(hiV)} y2={y(loV)} stroke={col} strokeWidth={1.4} strokeLinecap="round" />
                    <rect x={xr(i) - cw / 2} y={top} width={cw} height={Math.max(1.6, bot - top)} rx={1.2} fill={col} />
                  </g>
                );
              })
            ) : series.map((s, k) => (
              <g key={k}>
                {s.lo && s.hi && <path className="zm-fadein" d={band(s.lo, s.hi)} fill={s.color} fillOpacity={0.1} />}
                {series.length === 1 && (
                  <path className="zm-fadein" d={area(s.values)} fill={`url(#area-${gid})`} />
                )}
                <path
                  className="zm-draw"
                  pathLength={1}
                  d={path(s.values)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={compact ? 2.4 : 2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={series.length === 1 ? `url(#shadow-${gid})` : undefined}
                />
              </g>
            ))}
          </g>
        )}

        {n > 0 && (
          <>
            <line x1={xr(idx)} x2={xr(idx)} y1={4} y2={H - bottomAxis} stroke={C.ink} strokeDasharray="2 3" opacity={touching ? 0.45 : 0.22} />
            {barsOnly
              ? dotY !== null && <circle cx={xr(idx)} cy={dotY} r={5} fill={barActive} stroke="#fff" strokeWidth={2.5} />
              : candles
                ? null
                : series.map((s, k) => {
                  const ptY = getYForIdx(s.values, idx);
                  return ptY !== null ? (
                    <g key={k}>
                      {k === 0 && <circle className="zm-pulse" cx={xr(idx)} cy={ptY} r={9} fill={s.color} opacity={0.18} />}
                      <circle cx={xr(idx)} cy={ptY} r={touching ? 6 : 5} fill={s.color} stroke="#fff" strokeWidth={2.5} />
                    </g>
                  ) : null;
                })}
          </>
        )}

        {!compact &&
          labelIdx.map((i, k) => (
            <text
              key={i}
              x={xr(i)}
              y={H - 5}
              textAnchor={k === 0 ? (f.ur ? "end" : "start") : k === labelIdx.length - 1 ? (f.ur ? "start" : "end") : "middle"}
              fontSize="11.5"
              fontWeight="500"
              fill={C.faint}
            >
              {f.day(dates[i])}
            </text>
          ))}
      </svg>

      {onIdx && n > 1 && !compact && (
        <label className={hideSlider ? "zm-sr-only" : undefined} style={{ display: "flex", flexDirection: "column" }}>
          <input
            type="range"
            className="zm-scrub"
            min={0}
            max={n - 1}
            value={idx}
            dir={f.dir}
            onChange={(e) => onIdx(Number(e.target.value))}
            aria-label={f.tx("Select day", "دن منتخب کریں")}
            style={{ width: "100%" }}
          />
        </label>
      )}
    </div>
  );
}
