import { useEffect, useRef, useState, type PointerEvent } from "react";

import { RadialMenu } from "../../../../components/ui/radial-menu";
import { toUrduDigits, URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";

// Controls under the Home carousel.
//  - ‹ / › step to the previous / next card; one dot per card shows how many
//    there are and where you are (tap a dot to go there).
//  - The pill names the product (big) and the card's by-product (small).
//    Tap it: the screen blurs and the by-products burst out around a circle
//    (verticals get product chips to switch the circle between products).
//    Press and hold it, slide onto a by-product and release: jumps there in
//    one gesture.

export type JumpItem = {
  key: string;
  label: string;
  iconSrc: string;
  /** Rendered dimmed (e.g. no data for the selected date). */
  muted?: boolean;
};

export type JumpGroup = {
  label: string;
  iconSrc: string;
  start: number;
  count: number;
};

const HOLD_MS = 320;

/** The app's phone-width column, so the overlay covers header and nav too. */
const shellElement = () => {
  const shells = document.querySelectorAll(".zm-shell");
  return shells.length ? shells[shells.length - 1] : document.body;
};

export function ByproductJumpIndicator({
  items,
  groups,
  activeIndex,
  onSelect,
  noun,
  loop = false,
  title,
}: {
  items: JumpItem[];
  groups?: JumpGroup[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Plural noun for the count, e.g. "by-products". */
  noun: { en: string; ur: string };
  /** The carousel loops: ‹ / › wrap from the last item to the first. */
  loop?: boolean;
  /** Product name shown big in the pill (the card's by-product is shown small). */
  title?: string;
}) {
  const { lang } = useLang();
  const isUr = lang === "ur";
  const font = isUr ? URDU_FONT : "inherit";
  const num = (n: number) => (isUr ? toUrduDigits(n) : String(n));

  const count = items.length;
  const active = items[activeIndex];
  const hasGroups = !!groups && groups.length > 1;
  const activeGroup = hasGroups ? groups!.findIndex((g) => activeIndex >= g.start && activeIndex < g.start + g.count) : -1;

  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  // Which product of a vertical the circle shows.
  const [ringGroup, setRingGroup] = useState(0);
  // Element the circle overlay covers; kept after closing so it can animate out.
  const [shell, setShell] = useState<Element | null>(null);

  const holdTimer = useRef<number | undefined>(undefined);
  const holdingRef = useRef(false);
  const suppressClick = useRef(false);
  const hoverRef = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const setHoverIdx = (i: number | null) => {
    hoverRef.current = i;
    setHover(i);
  };

  const openMenu = () => {
    setShell(shellElement());
    setRingGroup(Math.max(0, activeGroup));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setHoverIdx(null);
  };
  const choose = (i: number) => {
    close();
    if (i !== activeIndex) onSelect(i);
  };

  const hitTest = () => {
    const el = document
      .elementFromPoint(pointer.current.x, pointer.current.y)
      ?.closest<HTMLElement>("[data-jump-index]");
    setHoverIdx(el ? Number(el.dataset.jumpIndex) : null);
  };

  // ── Pill gestures ────────────────────────────────────────────────
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current = { x: e.clientX, y: e.clientY };
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      holdingRef.current = true;
      suppressClick.current = true;
      openMenu();
      setHolding(true);
      navigator.vibrate?.(12);
    }, HOLD_MS);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    pointer.current = { x: e.clientX, y: e.clientY };
    if (holdingRef.current) hitTest();
  };

  const endHold = (commit: boolean) => {
    window.clearTimeout(holdTimer.current);
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    const target = hoverRef.current;
    // Released over a by-product: jump. Released elsewhere: leave the circle open to tap.
    if (commit && target != null) choose(target);
    else setHoverIdx(null);
  };

  const onPillClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (open) close();
    else openMenu();
  };

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  // Keep the chip of the product on the circle centred in the chip row.
  const chipRowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const row = chipRowRef.current;
      const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!row || !chip) return;
      const offset = chip.getBoundingClientRect().left - row.getBoundingClientRect().left;
      row.scrollTo({ left: row.scrollLeft + offset - (row.clientWidth - chip.clientWidth) / 2, behavior: "smooth" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [open, ringGroup]);

  // ── Circle contents ───────────────────────────────────────────────
  const ring = hasGroups
    ? groups![Math.min(ringGroup, groups!.length - 1)]
    : { label: title ?? "", iconSrc: "", start: 0, count };
  const ringOptions = Array.from({ length: ring.count }, (_, k) => ring.start + k).map((i) => ({
    key: `${items[i].key}@${i}`,
    index: i,
    label: items[i].label,
    muted: items[i].muted,
    active: i === activeIndex,
    icon: (
      <img
        src={items[i].iconSrc}
        alt=""
        draggable={false}
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        style={{ width: "78%", height: "78%", objectFit: "contain" }}
      />
    ),
  }));

  // ── Step + dots ───────────────────────────────────────────────────
  const step = (d: 1 | -1) => {
    const next = activeIndex + d;
    if (loop) onSelect((next + count) % count);
    else if (next >= 0 && next < count) onSelect(next);
  };
  const canBack = loop || activeIndex > 0;
  const canForward = loop || activeIndex < count - 1;

  // One dot per card; long lists show a window of 11 that slides along, with
  // smaller dots at an edge that has more cards beyond it.
  const WINDOW = 11;
  const winStart = count <= WINDOW ? 0 : Math.min(Math.max(0, activeIndex - 5), count - WINDOW);
  const dots = Array.from({ length: Math.min(count, WINDOW) }, (_, k) => winStart + k);

  const stepButton = (d: 1 | -1, enabled: boolean) => (
    <button
      type="button"
      onClick={() => step(d)}
      disabled={!enabled}
      aria-label={d === 1 ? (isUr ? "اگلا" : "Next") : isUr ? "پچھلا" : "Previous"}
      className="tap-target flex-shrink-0 flex items-center justify-center rounded-full transition active:scale-90"
      style={{
        width: 36,
        height: 36,
        background: "#FFFFFF",
        boxShadow: "0 3px 10px rgba(18, 65, 48, 0.14)",
        opacity: enabled ? 1 : 0.35,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#183B34" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points={(d === 1) !== isUr ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
      </svg>
    </button>
  );

  if (count === 0) return null;

  return (
    <div className="relative flex flex-col items-center" style={{ zIndex: 6 }}>
      <RadialMenu
        open={open}
        onClose={close}
        options={ringOptions}
        onSelect={choose}
        hoverIndex={hover}
        container={shell}
        rtl={isUr}
        formatNumber={num}
        labels={{
          close: isUr ? "بند کریں" : "Close",
          previous: isUr ? "پچھلا صفحہ" : "Previous page",
          next: isUr ? "اگلا صفحہ" : "Next page",
        }}
        title={
          <span style={{ fontSize: isUr ? 26 : 24, fontWeight: 900, color: "#143B33", fontFamily: font, lineHeight: 1.1 }}>
            {ring.label || title}
          </span>
        }
        subtitle={
          <span style={{ fontSize: isUr ? 13.5 : 13, fontWeight: 700, color: "#52635F", fontFamily: font }}>
            {num(ring.count)} {isUr ? noun.ur : noun.en}
          </span>
        }
        header={
          hasGroups ? (
            <div
              ref={chipRowRef}
              className="flex gap-1.5 overflow-x-auto px-4 py-1"
              style={{ maxWidth: "min(100vw, 480px)", scrollbarWidth: "none" }}
            >
              {groups!.map((g, gi) => {
                const on = gi === ringGroup;
                return (
                  <button
                    key={`chip-${g.label}-${g.start}`}
                    type="button"
                    onClick={() => setRingGroup(gi)}
                    aria-pressed={on}
                    className="flex-shrink-0 flex items-center gap-1.5 rounded-full"
                    style={{
                      height: 34,
                      padding: "0 12px 0 4px",
                      background: on ? "#087F63" : "#FFFFFF",
                      border: on ? "1px solid #087F63" : "1px solid #DCEAE3",
                      color: on ? "#FFFFFF" : "#183B34",
                      fontSize: isUr ? 13.5 : 12.5,
                      fontWeight: 700,
                      fontFamily: font,
                      boxShadow: "0 2px 8px rgba(18, 65, 48, 0.08)",
                    }}
                  >
                    <span className="flex items-center justify-center rounded-full" style={{ width: 26, height: 26, background: "#FFFFFF" }}>
                      <img src={g.iconSrc} alt="" style={{ width: 19, height: 19, objectFit: "contain" }} />
                    </span>
                    {g.label}
                  </button>
                );
              })}
            </div>
          ) : undefined
        }
      />

      <div className="flex items-center justify-center gap-3">
        {stepButton(-1, canBack)}
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => endHold(true)}
          onPointerCancel={() => endHold(false)}
          onClick={onPillClick}
          onContextMenu={(e) => e.preventDefault()}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="tap-target flex flex-col items-center justify-center rounded-full"
          style={{
            minWidth: 132,
            maxWidth: "min(54vw, 230px)",
            height: 44,
            padding: "0 18px",
            background: "#0B5E4A",
            boxShadow: holding
              ? "0 0 0 5px rgba(8, 127, 99, 0.2), 0 8px 18px rgba(8, 94, 74, 0.35)"
              : "0 6px 16px rgba(8, 94, 74, 0.3)",
            transform: holding ? "scale(0.97)" : "none",
            transition: "box-shadow 0.15s ease, transform 0.15s ease",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
        >
          <span className="flex items-center gap-1.5 max-w-full">
            <span
              dir="auto"
              className="truncate"
              style={{ fontSize: isUr ? 17.5 : 16.5, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1, fontFamily: font }}
            >
              {title || active?.label}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
              style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
          {title && (
            <span
              dir="auto"
              className="max-w-full truncate"
              style={{ fontSize: isUr ? 11.5 : 11, fontWeight: 600, color: "#BFE6D6", lineHeight: 1.15, fontFamily: font }}
            >
              {active?.label}
            </span>
          )}
        </button>
        {stepButton(1, canForward)}
      </div>

      {/* One dot per card, with the position beside them */}
      <div className="flex items-center justify-center" style={{ marginTop: 5, height: 16 }}>
        {dots.map((i, k) => {
          const on = i === activeIndex;
          const edge =
            count > WINDOW && ((k === 0 && winStart > 0) || (k === dots.length - 1 && winStart + WINDOW < count));
          const size = on ? 11 : edge ? 5 : 8;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={items[i].label}
              aria-current={on || undefined}
              className="flex items-center justify-center"
              style={{ width: 17, height: 16 }}
            >
              <span
                style={{
                  width: size,
                  height: size,
                  borderRadius: 999,
                  background: on ? "#087F63" : "#C3D9CF",
                  transition: "all 0.2s ease",
                }}
              />
            </button>
          );
        })}
        <span style={{ marginInlineStart: 6, fontSize: 12, fontWeight: 700, color: "#52635F", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {num(activeIndex + 1)} / {num(count)}
        </span>
      </div>
    </div>
  );
}
