import { useEffect, useRef, useState, type RefObject } from "react";

import { FILTER_THEME as G, FilterFields, type FilterUiProps } from "./FilterDock";
import { C } from "./theme";
import { Icon } from "./ui";

const EASE = "cubic-bezier(.22,1,.36,1)";
const OPEN_AT = 72; // px of pull that opens (or, pulled back, closes) the drawer

/**
 * Pull-down filter drawer. A slim grip under the tabs shows WHERE · WHEN ·
 * RATE; pulling the page down from the top (or tapping the grip) unrolls the
 * filter panel, following the finger with a rubber-band feel. Changes apply
 * live. Dragging the open panel back up closes it.
 */
export function FilterDrawer({ scrollRef, ...p }: FilterUiProps & { scrollRef: RefObject<HTMLDivElement | null> }) {
  const { f, locationLabel, date, latest, rate, rates, filters, resultCount, onReset, isDefault } = p;
  const [open, setOpen] = useState(false);
  const [pull, setPull] = useState<number | null>(null); // live height while dragging
  const [hint, setHint] = useState(0); // one-time peek on first view
  const [natH, setNatH] = useState(0);
  const root = useRef<HTMLDivElement | null>(null);
  const body = useRef<HTMLDivElement | null>(null);
  const live = useRef({ open, natH, pull: null as number | null, armed: false });
  live.current.open = open;
  live.current.natH = natH;

  const qualityCount = Object.values(filters).filter(Boolean).length;
  const rateShort = rates.find((r) => r.id === rate)?.label || rate;
  const height = pull ?? (open ? natH : hint);
  const progress = natH ? Math.max(0, Math.min(1, height / natH)) : 0;

  const tick = () => {
    try {
      navigator.vibrate?.(6);
    } catch {
      /* no haptics */
    }
  };

  // Natural height of the panel.
  useEffect(() => {
    const el = body.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setNatH(el.offsetHeight));
    ro.observe(el);
    setNatH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // One-time hint: the drawer peeks open a little and springs back.
  useEffect(() => {
    try {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      if (sessionStorage.getItem("zm-drawer-hint")) return;
      sessionStorage.setItem("zm-drawer-hint", "1");
    } catch {
      /* storage blocked: still show the hint */
    }
    const a = setTimeout(() => setHint(30), 2000);
    const b = setTimeout(() => setHint(0), 2600);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  // Pull gesture on the page's scroll container.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let start: { x: number; y: number; axis: "x" | "y" | null; inPanel: boolean } | null = null;
    let pulling = false; // while true, the page content underneath gets no pointer events

    const rubber = (dy: number) => {
      const max = live.current.natH || 320;
      const r = dy * 0.6;
      return r <= max ? r : max + (r - max) * 0.2;
    };
    const setLive = (v: number | null) => {
      live.current.pull = v;
      setPull(v);
      const max = live.current.natH || 320;
      // Haptic tick when the drag crosses the open/close point.
      if (v !== null) {
        const past = live.current.open ? v < max - OPEN_AT : v > OPEN_AT;
        if (past !== live.current.armed) {
          live.current.armed = past;
          if (past) tick();
        }
      }
    };
    const begin = (x: number, y: number, target: EventTarget | null) => {
      const inPanel = !!root.current && target instanceof Node && root.current.contains(target);
      // Charts and sideways rails own their own gestures.
      const owned = target instanceof Element && !!target.closest("[data-zm-hscroll]");
      start = !owned && (el.scrollTop <= 0 || inPanel) ? { x, y, axis: null, inPanel } : null;
      live.current.armed = false;
    };
    // Returns true when the move was taken by the drawer.
    const move = (x: number, y: number) => {
      if (!start) return false;
      const dx = x - start.x;
      const dy = y - start.y;
      if (!start.axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return false;
        start.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
      }
      if (start.axis !== "y") return false;
      const { open: isOpen, natH: max } = live.current;
      if (!isOpen && dy > 0 && el.scrollTop <= 0) {
        pulling = true;
        setLive(rubber(dy));
        return true;
      }
      if (isOpen && dy < 0 && start.inPanel) {
        pulling = true;
        setLive(Math.max(0, max + dy));
        return true;
      }
      return false;
    };
    const finish = () => {
      const v = live.current.pull;
      start = null;
      // Let the trailing pointerup/click be swallowed, then hand events back.
      setTimeout(() => (pulling = false), 0);
      if (v === null) return;
      const { open: isOpen, natH: max } = live.current;
      const next = isOpen ? v > max - OPEN_AT : v > OPEN_AT;
      setOpen(next);
      setLive(null);
    };

    const ts = (e: TouchEvent) => begin(e.touches[0].clientX, e.touches[0].clientY, e.target);
    const tm = (e: TouchEvent) => {
      if (move(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault();
    };
    const pd = (e: PointerEvent) => e.pointerType === "mouse" && e.button === 0 && begin(e.clientX, e.clientY, e.target);
    const pm = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && move(e.clientX, e.clientY)) window.getSelection?.()?.removeAllRanges();
    };
    const pu = (e: PointerEvent) => e.pointerType === "mouse" && finish();
    // Capture-phase guard: a pull must not also tap/scrub the content under it.
    const guard = (e: Event) => {
      if (pulling) e.stopPropagation();
    };

    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", finish);
    el.addEventListener("touchcancel", finish);
    el.addEventListener("pointerdown", pd);
    window.addEventListener("pointermove", pm, true);
    window.addEventListener("pointerup", pu, true);
    el.addEventListener("pointermove", guard, true);
    el.addEventListener("pointerup", guard, true);
    el.addEventListener("click", guard, true);
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", finish);
      el.removeEventListener("touchcancel", finish);
      el.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointermove", pm, true);
      window.removeEventListener("pointerup", pu, true);
      el.removeEventListener("pointermove", guard, true);
      el.removeEventListener("pointerup", guard, true);
      el.removeEventListener("click", guard, true);
    };
  }, [scrollRef]);

  return (
    <div ref={root} dir={f.dir} style={{ position: "relative", background: C.surface, borderBottom: `1px solid ${C.lineSoft}`, fontFamily: f.font }}>
      {/* Grip: WHERE is its own button (opens the location list directly);
          the rest of the bar opens/closes the drawer. */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, height: 48, padding: "6px 12px 0 8px", paddingInlineStart: 8, paddingInlineEnd: 12 }}>
        <span aria-hidden style={{ position: "absolute", top: 6, left: "50%", width: 36, height: 4, marginLeft: -18, borderRadius: 2, background: progress > 0.05 ? C.brand : C.line, transition: "background 200ms" }} />
        <button
          type="button"
          onClick={p.onOpenLocation}
          aria-label={f.tx(`Location: ${locationLabel}. Change`, `مقام: ${locationLabel}۔ تبدیل کریں`)}
          style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, maxWidth: "46%", height: 36, padding: "0 10px", border: "none", borderRadius: 18, background: C.brandTint, color: C.brandDeep, fontFamily: f.font, fontSize: 13.5, fontWeight: 600, lineHeight: f.lh, flexShrink: 1 }}
        >
          <Icon name="pin" size={15} width={2.3} color={C.brand} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{locationLabel}</span>
          <Icon name="chevDown" size={12} width={2.6} color={C.brand} />
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-label={f.tx(`Filters: ${f.day(date)}, ${rateShort}`, `فلٹر: ${f.day(date)}، ${rateShort}`)}
          onClick={() => (tick(), setOpen((o) => !o))}
          style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, height: 40, padding: 0, border: "none", background: "transparent", color: C.ink, fontFamily: f.font, textAlign: "start" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, lineHeight: f.lh, whiteSpace: "nowrap", overflow: "hidden" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <Icon name="calendar" size={14} width={2.3} color={C.muted} />
              {f.day(date)}
              {date === latest && <span aria-hidden style={{ width: 6, height: 6, borderRadius: 3, background: C.brand, boxShadow: "0 0 8px rgba(8,127,99,0.6)" }} />}
            </span>
            <Dot />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, color: rate === rates[0]?.id ? C.muted : C.ink }}>{rateShort}</span>
          </span>
          {!!qualityCount && (
            <span style={{ height: 22, minWidth: 22, padding: "0 7px", borderRadius: 11, background: C.brand, color: "#FFFFFF", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0 }}>
              <Icon name="filter" size={11} width={2.6} color="#FFFFFF" />
              {f.digits(qualityCount)}
            </span>
          )}
          <span style={{ width: 30, height: 30, borderRadius: 15, background: C.chip, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ display: "flex", transform: `rotate(${progress * 180}deg)`, transition: pull === null ? `transform 420ms ${EASE}` : "none" }}>
              <Icon name="chevDown" size={14} width={2.6} color={C.ink2} />
            </span>
          </span>
        </button>
      </div>

      {/* The unrolling panel. */}
      <div
        aria-hidden={!open}
        inert={!open}
        style={{
          height,
          overflow: "hidden",
          transition: pull === null ? `height 460ms ${EASE}` : "none",
        }}
      >
        <div
          ref={body}
          style={{
            background: G.bg,
            opacity: 0.35 + 0.65 * progress,
            transform: `translateY(${(progress - 1) * 16}px)`,
            transition: pull === null ? `opacity 300ms ease, transform 460ms ${EASE}` : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 0" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted }}>{f.tx("Pull up or tap the bar to close", "بند کرنے کے لیے اوپر کھینچیں")}</span>
            {!isDefault && (
              <button type="button" onClick={onReset} style={{ height: 32, padding: "0 12px", border: "none", borderRadius: 16, background: C.chip, color: C.brandDeep, fontSize: 13, fontWeight: 600, fontFamily: f.font }}>
                {f.tx("Reset", "صاف کریں")}
              </button>
            )}
          </div>
          <FilterFields {...p} />
          <div style={{ padding: "10px 16px 16px" }}>
            <button
              type="button"
              onClick={() => (tick(), setOpen(false))}
              style={{ width: "100%", height: 50, border: "none", borderRadius: 16, background: C.brand, color: "#FFFFFF", fontSize: 15, fontWeight: 600, fontFamily: f.font, boxShadow: "0 8px 22px -8px rgba(8,127,99,0.7)" }}
            >
              {resultCount > 0
                ? f.tx(`Show ${resultCount} location${resultCount === 1 ? "" : "s"}`, `${f.digits(resultCount)} مقامات دکھائیں`)
                : f.tx("No locations match · adjust filters", "کوئی مقام نہیں · فلٹر بدلیں")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return <span aria-hidden style={{ width: 3, height: 3, borderRadius: 2, background: C.faint, flexShrink: 0 }} />;
}
