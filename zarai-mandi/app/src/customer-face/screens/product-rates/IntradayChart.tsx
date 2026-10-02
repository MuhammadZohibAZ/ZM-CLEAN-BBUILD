import { axisSpec, niceTicks, type AxisUnit, type Fmt } from "./format";
import { C } from "./theme";

export type IntradayPoint = {
  /** Minutes after midnight the report came in; null = time not recorded. */
  minute: number | null;
  value: number;
  /** Price only: the day's lowest min and highest max, drawn as a range line. */
  lo?: number;
  hi?: number;
};

const DAY = 24 * 60;
const HOURS = [0, 6, 12, 18, 24];

/**
 * One day on a 24-hour axis: a bar where each report came in, topped with a
 * peak point at its rate (or bags). A report without a recorded time sits at
 * the day's close and is labelled as such.
 */
export function IntradayChart({
  f,
  unit,
  points,
  color = C.brand,
  height = 210,
  ariaLabel,
}: {
  f: Fmt;
  unit: AxisUnit;
  points: IntradayPoint[];
  color?: string;
  height?: number;
  ariaLabel: string;
}) {
  const W = 340;
  const axisW = 44;
  const plotW = W - axisW;
  const H = height;
  const top = 26;
  const bottom = H - 22;
  const shown = points.filter((p) => p.value > 0);
  const peak = Math.max(0, ...shown.map((p) => Math.max(p.value, p.hi || 0)));
  const hiV = peak * 1.15 || 1;
  const axis = axisSpec(f, unit, hiV);
  const y = (v: number) => top + (1 - v / hiV) * (bottom - top);
  const bw = 16;
  // Time → x, inset by half a bar so 00:00 / 24:00 bars stay inside the plot.
  const xAt = (minute: number) => {
    const px = bw / 2 + (minute / DAY) * (plotW - bw);
    return f.ur ? W - px : px;
  };
  const ticks = niceTicks(hiV);
  const peakIdx = shown.reduce((best, p, k) => (p.value > shown[best].value ? k : best), 0);
  const hh = (h: number) => (h === 24 ? `${f.digits("23")}:${f.digits("59")}` : `${f.digits(String(h).padStart(2, "0"))}:${f.digits("00")}`);
  const timeLabel = (m: number) => `${f.digits(String(Math.floor(m / 60)).padStart(2, "0"))}:${f.digits(String(m % 60).padStart(2, "0"))}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={ariaLabel} style={{ display: "block" }}>
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
                {axis.format(v)}
              </text>
            </g>
          );
        })}

        {/* 24-hour axis */}
        <line x1={f.ur ? axisW : 0} x2={f.ur ? W : plotW} y1={bottom} y2={bottom} stroke={C.line} />
        {HOURS.map((h, k) => (
          <g key={h}>
            <line x1={xAt(h * 60)} x2={xAt(h * 60)} y1={top - 8} y2={bottom + 3} stroke="#F1F3F2" />
            <text
              x={xAt(h * 60)}
              y={H - 5}
              textAnchor={k === 0 ? (f.ur ? "end" : "start") : k === HOURS.length - 1 ? (f.ur ? "start" : "end") : "middle"}
              fontSize="11.5"
              fontWeight="500"
              fill={C.faint}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {hh(h)}
            </text>
          </g>
        ))}

        {shown.map((p, k) => {
          const cx = xAt(p.minute ?? 12 * 60);
          const isPeak = k === peakIdx;
          const py = y(p.value);
          return (
            <g key={k} className="zm-grow">
              <rect x={cx - bw / 2} y={py} width={bw} height={Math.max(1, bottom - py)} rx={3} fill={color} opacity={isPeak ? 0.9 : 0.35} />
              {p.lo && p.hi && p.hi > p.lo ? (
                <line x1={cx} x2={cx} y1={y(p.hi)} y2={y(p.lo)} stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" opacity={0.45} />
              ) : null}
              {isPeak && (
                <>
                  <circle className="zm-pulse" cx={cx} cy={py} r={9} fill={color} opacity={0.18} />
                  <circle cx={cx} cy={py} r={5} fill={color} stroke="#fff" strokeWidth={2.5} />
                  <text
                    x={Math.min(Math.max(cx, f.ur ? axisW + 34 : 34), f.ur ? W - 34 : plotW - 34)}
                    y={Math.max(12, py - 12)}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill={C.ink}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                    paintOrder="stroke"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {unit === "rupees" ? f.rs(p.value) : `${f.num(p.value)} ${f.tx("bags", "بوریاں")}`}
                    {p.minute !== null ? ` · ${timeLabel(p.minute)}` : ""}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      {shown.length === 0 && (
        <p style={{ margin: 0, textAlign: "center", fontSize: 12, fontWeight: 500, color: C.muted }}>{f.tx("No report on this day", "اس دن کوئی رپورٹ نہیں")}</p>
      )}
    </div>
  );
}
