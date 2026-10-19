// Pinch / wheel zoom on the full-screen charts moves between the period
// buttons (1W → 2W → 1M → 6M → 1Y and back) instead of to an arbitrary number
// of days, so the highlighted button always matches what the chart shows.

export const ZOOM_PRESETS = ["1W", "2W", "1M", "6M", "1Y"] as const;
export type ZoomPreset = (typeof ZOOM_PRESETS)[number];

/** A zoom gesture asks for `wanted` days while `span` are shown: the period to switch to, or null. */
export function stepPreset(span: number, wanted: number, days: Record<ZoomPreset, number>): ZoomPreset | null {
  if (wanted > span * 1.25) return ZOOM_PRESETS.find((p) => days[p] > span) ?? null;
  if (wanted < span / 1.25) return [...ZOOM_PRESETS].reverse().find((p) => days[p] < span) ?? null;
  return null;
}

/** One step per gesture burst: wheel and pinch fire many events. */
export function makeZoomThrottle(ms = 350) {
  let last = 0;
  return () => {
    const now = Date.now();
    if (now - last < ms) return false;
    last = now;
    return true;
  };
}
