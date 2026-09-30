import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { Fmt } from "./format";
import { C } from "./theme";
import { Icon } from "./ui";

export type SwiperPage = { key: string; label: string; node: ReactNode };

const MARGIN = 6;
const GAP = 6;
const PEEK = 10;
const CONTENT_INSET = 6;
const EASE = "cubic-bezier(.22,1,.36,1)";
const SETTLE_MS = 420;

/**
 * Bounded 2-screen peeking carousel.
 * When on page 0 (Price & Mandis), page 1 (Best Places) peeks in from the right.
 * When on page 1 (Best Places), page 0 peeks in from the left.
 * Swiping is strictly one-way towards the other card.
 */
export function Swiper3D({
  f,
  pages,
  index,
  onIndex,
  label,
}: {
  f: Fmt;
  pages: SwiperPage[];
  index: number;
  onIndex: (i: number) => void;
  label: string;
  intro?: boolean;
}) {
  const n = pages.length;
  const dirSign = f.dir === "rtl" ? -1 : 1;
  const viewport = useRef<HTMLDivElement | null>(null);
  const paneEls = useRef<(HTMLDivElement | null)[]>([]);
  const dashEls = useRef<(HTMLSpanElement | null)[]>([]);
  const geo = useRef({ vw: 0, heights: [] as number[] });
  const [, force] = useState(0);
  const swipe = useRef<{
    id: number;
    x0: number;
    y0: number;
    axis: "x" | "y" | null;
    blocked: boolean;
    samples: { t: number; x: number }[];
  } | null>(null);
  const frame = useRef(0);
  const vpos = useRef(index);
  const indexRef = useRef(index);
  indexRef.current = index;

  const getGeometry = () => {
    const vw = geo.current.vw || 390;
    const paneW = Math.max(260, vw - MARGIN - GAP - PEEK);
    const step = paneW + GAP - (PEEK - MARGIN);
    return { vw, paneW, step };
  };

  // ── Paint one frame for a bounded position (0 .. n-1)
  const paint = useCallback(
    (pos: number, animate: boolean) => {
      const { vw, heights } = geo.current;
      if (!vw) return;
      const { paneW, step } = getGeometry();

      paneEls.current.slice(0, n).forEach((el, i) => {
        if (!el) return;
        const offsetPx = i * (paneW + GAP) - pos * step;
        el.style.transition = animate ? `transform ${SETTLE_MS}ms ${EASE}, opacity 320ms ease` : "none";
        el.style.transform = `translate3d(${offsetPx * dirSign}px, 0, 0)`;
        const dist = Math.abs(i - pos);
        el.style.opacity = String(Math.max(0.7, 1 - dist * 0.22));
        el.style.visibility = "visible";
        el.style.zIndex = i === Math.round(pos) ? "10" : "5";
      });

      // Viewport height follows the currently focused page
      const lo = Math.floor(Math.max(0, Math.min(n - 1, pos)));
      const hi = Math.ceil(Math.max(0, Math.min(n - 1, pos)));
      const t = pos - lo;
      const hLo = heights[lo] || 0;
      const hHi = heights[hi] || hLo;
      if (viewport.current && hLo) {
        viewport.current.style.transition = animate ? `height 360ms ${EASE}` : "none";
        viewport.current.style.height = `${hLo + (hHi - hLo) * t}px`;
      }

      dashEls.current.slice(0, n).forEach((el, i) => {
        if (!el) return;
        const active = Math.abs(i - pos) < 0.45;
        el.style.transition = animate ? `width 320ms ${EASE}, background 200ms, opacity 200ms` : "none";
        el.style.width = active ? "24px" : "8px";
        el.style.background = active ? C.brand : "#C9D1CE";
        el.style.opacity = active ? "1" : "0.5";
      });
    },
    [n, dirSign],
  );

  useLayoutEffect(() => {
    vpos.current = index;
    paint(index, true);
  }, [index, paint]);

  // Measure widths and heights on resize
  useEffect(() => {
    const v = viewport.current;
    if (!v || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const vw = v.clientWidth;
      const widthChanged = vw !== geo.current.vw;
      geo.current = { vw, heights: paneEls.current.slice(0, n).map((el) => el?.offsetHeight || 0) };
      if (widthChanged) force((x) => x + 1);
      if (!swipe.current?.axis) paint(vpos.current, !widthChanged);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(v);
    paneEls.current.slice(0, n).forEach((el) => el && ro.observe(el));
    measure();
    return () => ro.disconnect();
  }, [n, paint]);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(n - 1, next));
    if (clamped !== index) {
      try {
        navigator.vibrate?.(6);
      } catch {
        /* no haptics */
      }
      vpos.current = clamped;
      onIndex(clamped);
    } else {
      vpos.current = clamped;
      paint(clamped, true);
    }
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const blocked = !!(e.target as HTMLElement).closest?.("[data-zm-hscroll]");
    swipe.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      axis: null,
      blocked,
      samples: [{ t: e.timeStamp, x: e.clientX }],
    };
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s0 = swipe.current;
    if (!s0 || s0.blocked || e.pointerId !== s0.id) return;
    const dx = (e.clientX - s0.x0) * dirSign;
    const dy = e.clientY - s0.y0;
    if (!s0.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      s0.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (s0.axis === "x") {
        viewport.current?.setPointerCapture?.(e.pointerId);
        window.getSelection?.()?.removeAllRanges();
        if (viewport.current) viewport.current.style.userSelect = "none";
      }
    }
    if (s0.axis !== "x") return;
    s0.samples.push({ t: e.timeStamp, x: e.clientX });
    if (s0.samples.length > 6) s0.samples.shift();
    cancelAnimationFrame(frame.current);

    const { step } = getGeometry();
    const rawPos = indexRef.current - dx / step;
    // Over-drag resistance
    let p = rawPos;
    if (rawPos < 0) p = rawPos * 0.28;
    else if (rawPos > n - 1) p = n - 1 + (rawPos - (n - 1)) * 0.28;

    vpos.current = p;
    frame.current = requestAnimationFrame(() => paint(p, false));
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s0 = swipe.current;
    if (!s0 || e.pointerId !== s0.id) return;
    swipe.current = null;
    cancelAnimationFrame(frame.current);
    if (viewport.current) {
      try {
        viewport.current.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      viewport.current.style.userSelect = "";
    }
    if (s0.axis !== "x") {
      paint(indexRef.current, true);
      return;
    }

    const { step } = getGeometry();
    const dx = (e.clientX - s0.x0) * dirSign;
    const first = s0.samples[0] || { t: e.timeStamp, x: e.clientX };
    const dt = Math.max(1, e.timeStamp - first.t);
    const vx = ((e.clientX - first.x) * dirSign) / dt;

    let target = indexRef.current;
    if (dx < -45 || vx < -0.35) {
      target = Math.min(n - 1, indexRef.current + 1);
    } else if (dx > 45 || vx > 0.35) {
      target = Math.max(0, indexRef.current - 1);
    }
    goTo(target);
  };

  const { paneW } = getGeometry();

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden", paddingBottom: 16 }}>
      {/* Viewport container */}
      <div
        ref={viewport}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          position: "relative",
          width: "100%",
          minHeight: 0,
          touchAction: "pan-y",
          cursor: "grab",
        }}
      >
        {pages.map((p, i) => (
          <div
            key={p.key}
            ref={(el) => {
              paneEls.current[i] = el;
            }}
            style={{
              position: "absolute",
              top: 0,
              left: MARGIN,
              width: paneW || `calc(100% - ${MARGIN + GAP + PEEK}px)`,
              willChange: "transform",
            }}
          >
            <div style={{ margin: `0 -${CONTENT_INSET}px`, paddingBottom: 0 }}>{p.node}</div>
          </div>
        ))}
      </div>

      {/* Navigator controls */}
      {n > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8, padding: `2px ${MARGIN}px 0` }}>
          <div style={{ display: "flex", justifyContent: "flex-start", minWidth: 0 }}>
            {index > 0 && (
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label={f.tx(`Previous: ${pages[index - 1]?.label}`, `پچھلا: ${pages[index - 1]?.label}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  height: 26,
                  padding: "0 8px",
                  border: "none",
                  borderRadius: 13,
                  background: C.chip,
                  color: C.ink,
                  fontSize: 11.5,
                  fontWeight: 600,
                  fontFamily: f.font,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <Icon name="back" size={11} width={2.6} color={C.ink2} flip={dirSign === -1} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{pages[index - 1]?.label}</span>
              </button>
            )}
          </div>

          <div role="tablist" aria-label={label} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4 }}>
            {pages.map((p, i) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={index === i}
                aria-label={p.label}
                onClick={() => goTo(i)}
                style={{ padding: "4px 2px", border: "none", background: "transparent", display: "flex", cursor: "pointer" }}
              >
                <span
                  ref={(el) => {
                    dashEls.current[i] = el;
                  }}
                  style={{
                    display: "block",
                    width: index === i ? 20 : 6,
                    height: 3.5,
                    borderRadius: 2,
                    background: index === i ? C.brand : "#C9D1CE",
                  }}
                />
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
            {index < n - 1 && (
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label={f.tx(`Next: ${pages[index + 1]?.label}`, `اگلا: ${pages[index + 1]?.label}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  height: 26,
                  padding: "0 8px 0 10px",
                  border: "none",
                  borderRadius: 13,
                  background: C.brandTint,
                  color: C.brandDeep,
                  fontSize: 11.5,
                  fontWeight: 600,
                  fontFamily: f.font,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{pages[index + 1]?.label}</span>
                <Icon name="chevRight" size={11} width={2.8} color={C.brand} flip={dirSign === -1} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
