import { C } from "./theme";

/** Colour a sparkline by its own direction over the window. */
export function sparkTone(values: number[]) {
  const pts = values.filter((v) => v > 0);
  if (pts.length < 2) return C.faint;
  const d = ((pts[pts.length - 1] - pts[0]) / pts[0]) * 100;
  return d > 0.05 ? C.up : d < -0.05 ? C.down : C.faint;
}

/** Tiny trend line for list rows. Needs at least 2 reported days. */
export function Sparkline({ values, tone, flip, width = 52, height = 24 }: { values: number[]; tone?: string; flip: boolean; width?: number; height?: number }) {
  const pts = values.map((v, i) => ({ v, i })).filter((o) => o.v > 0);
  const W = width;
  const H = height;
  if (pts.length < 2) return <span style={{ width: W, flexShrink: 0 }} aria-hidden="true" />;
  const color = tone || sparkTone(values);
  const lo = Math.min(...pts.map((o) => o.v));
  const hi = Math.max(...pts.map((o) => o.v));
  const n = Math.max(values.length - 1, 1);
  const x = (i: number) => {
    const px = (i / n) * (W - 4) + 2;
    return flip ? W - px : px;
  };
  const y = (v: number) => (hi === lo ? H / 2 : 3 + (1 - (v - lo) / (hi - lo)) * (H - 6));
  const d = pts.map((o, k) => `${k ? "L" : "M"}${x(o.i).toFixed(1)},${y(o.v).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ flexShrink: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r={2} fill={color} />
    </svg>
  );
}
