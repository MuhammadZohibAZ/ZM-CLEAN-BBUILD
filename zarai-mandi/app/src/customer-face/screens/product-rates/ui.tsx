import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { C } from "./theme";

// ─── Icons (stroke, currentColor) ─────────────────────────────
const P = {
  back: "M15 18l-6-6 6-6",
  chevDown: "M6 9l6 6 6-6",
  chevRight: "M9 6l6 6-6 6",
  close: "M6 6l12 12M18 6L6 18",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  calendar: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M3 10h18 M8 3v4 M16 3v4",
  filter: "M4 6h16 M7 12h10 M10 18h4",
  sort: "M7 4v16 M3 16l4 4 4-4 M17 20V4 M13 8l4-4 4 4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
  speaker: "M11 5L6 9H3v6h3l5 4V5z M15.5 8.5a5 5 0 0 1 0 7 M18.5 5.5a9 9 0 0 1 0 13",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z",
  lock: "M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z M8 11V8a4 4 0 0 1 8 0v3",
  landscape: "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z M6 10v4",
  rotate: "M21.5 2v6h-6 M21.3 15.6a10 10 0 1 1-.6-8.4l.8.8",
  compare: "M3 17l6-6 4 4 8-8 M3 11l6 2 4-3 8 1",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z M9 4v14 M15 6v14",
  list: "M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01",
  table: "M4 4h16v16H4z M4 10h16 M10 4v16",
  layers: "M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
};
export type IconName = keyof typeof P;

export function Icon({
  name,
  size = 18,
  color = "currentColor",
  width = 2.2,
  fill = "none",
  flip = false,
}: {
  name: IconName;
  size?: number;
  color?: string;
  width?: number;
  fill?: string;
  flip?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, transform: flip ? "scaleX(-1)" : undefined }}
    >
      <path d={P[name]} />
    </svg>
  );
}

// ─── Buttons & chips ─────────────────────────────────────────
export function IconButton({
  label,
  onClick,
  children,
  active = false,
  activeBg = C.brandTint,
  activeBorder = C.brandBorder,
  size = 40,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  active?: boolean;
  activeBg?: string;
  activeBorder?: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="transition active:scale-95"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size / 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: active ? `1px solid ${activeBorder}` : "none",
        background: active ? activeBg : C.chip,
        color: C.ink,
      }}
    >
      {children}
    </button>
  );
}

export function Chip({
  on,
  color = C.ink,
  onClick,
  children,
  dot,
  disabled,
  font,
  height = 36,
}: {
  on: boolean;
  color?: string;
  onClick?: () => void;
  children: React.ReactNode;
  dot?: string;
  disabled?: boolean;
  font?: string;
  height?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className="transition active:scale-95"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        height,
        padding: "0 14px",
        flexShrink: 0,
        borderRadius: height / 2,
        whiteSpace: "nowrap",
        fontSize: 13,
        fontWeight: on ? 600 : 500,
        fontFamily: font,
        border: "none",
        background: on ? color : C.chip,
        color: on ? "#FFFFFF" : disabled ? C.faint : C.ink2,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {dot && <span style={{ width: 7, height: 7, borderRadius: 4, flexShrink: 0, background: on ? "#FFFFFF" : dot }} />}
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  font,
  label,
  height = 40,
}: {
  value: T;
  options: { id: T; label: string; color?: string }[];
  onChange: (v: T) => void;
  font?: string;
  label: string;
  height?: number;
}) {
  return (
    <div role="group" aria-label={label} style={{ display: "flex", gap: 3, padding: 3, borderRadius: 14, background: C.track }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            style={{
              flex: 1,
              height,
              padding: "0 12px",
              border: "none",
              borderRadius: 11,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: font,
              whiteSpace: "nowrap",
              background: on ? C.surface : "transparent",
              color: on ? C.ink : C.muted,
              boxShadow: on ? "0 1px 3px rgba(16,35,30,0.12)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function HScroll({ children, pad = "0 16px 10px 16px" }: { children: React.ReactNode; pad?: string }) {
  return (
    <div className="zm-hide-scrollbar" style={{ display: "flex", gap: 8, padding: pad, overflowX: "auto", scrollbarWidth: "none", minWidth: 0, maxWidth: "100%" }}>
      {children}
    </div>
  );
}

// ─── Bottom sheet ────────────────────────────────────────────
export function BottomSheet({
  onClose,
  title,
  subtitle,
  action,
  footer,
  children,
  dir,
  font,
  display,
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  dir: "ltr" | "rtl";
  font: string;
  display: string;
}) {
  if (typeof document === "undefined") return null;
  // Portalled to <body> so the sheet always rises from the bottom of the
  // screen, whatever animated/transformed containers the screen sits in.
  return createPortal(
    <div className="zm-sheet-overlay zm-sheet-anim zm-product-rates" style={{ zIndex: 12000 }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        dir={dir}
        className="zm-sheet-high"
        style={{ background: C.ground, maxHeight: "92vh", fontFamily: font, color: C.ink }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "#C3CFC9", margin: "10px auto 0", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 16px 10px" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: display, fontSize: 20, fontWeight: 700, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
            {subtitle && (
              <span
                style={{
                  fontSize: "clamp(11px, 2.8vw, 12.5px)",
                  fontWeight: 500,
                  color: C.muted,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.3,
                }}
                title={typeof subtitle === "string" ? subtitle : undefined}
              >
                {subtitle}
              </span>
            )}
          </div>
          {action}
          <IconButton label={dir === "rtl" ? "بند کریں" : "Close"} onClick={onClose}>
            <Icon name="close" size={18} width={2.4} />
          </IconButton>
        </div>
        <div className="zm-hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 16px 16px" }}>
          {children}
        </div>
        {footer && (
          <div style={{ display: "flex", gap: 8, padding: "12px 16px 20px", borderTop: `1px solid ${C.line}`, background: C.surface, flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 20,
        background: C.surface,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ChangePill({ value, text }: { value: number; text: string }) {
  const s = value > 0.05 ? 1 : value < -0.05 ? -1 : 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 26,
        padding: "0 8px",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        background: s > 0 ? C.upTint : s < 0 ? C.downTint : C.lineSoft,
        color: s > 0 ? C.up : s < 0 ? C.down : C.ink2,
      }}
    >
      {text}
    </span>
  );
}

export function Tabs<T extends string>({
  value,
  options,
  onChange,
  font,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  font?: string;
}) {
  const n = Math.max(options.length, 1);
  const active = Math.max(0, options.findIndex((o) => o.id === value));
  const go = (i: number) => {
    const next = options[(i + n) % n];
    if (!next || next.id === value) return;
    try {
      navigator.vibrate?.(5); // light tick on Android
    } catch {
      /* no haptics */
    }
    onChange(next.id);
  };
  return (
    <div
      role="tablist"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + (document.dir === "rtl" ? -1 : 1));
        if (e.key === "ArrowLeft") go(active + (document.dir === "rtl" ? 1 : -1));
      }}
      style={{ position: "relative", display: "flex", padding: "0 8px", borderBottom: `1px solid ${C.line}` }}
    >
      {options.map((o, i) => {
        const on = i === active;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => go(i)}
            style={{
              flex: 1,
              height: 46,
              padding: 0,
              border: "none",
              background: "transparent",
              fontSize: 15,
              fontWeight: on ? 600 : 500,
              fontFamily: font,
              color: on ? C.ink : C.muted,
              transition: "color 200ms ease",
            }}
          >
            {o.label}
          </button>
        );
      })}
      {/* Sliding indicator: glides under the active tab (mirrors in RTL) */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -1,
          insetInlineStart: `calc(8px + (100% - 16px) * ${active / n})`,
          width: `calc((100% - 16px) / ${n})`,
          height: 3,
          display: "flex",
          justifyContent: "center",
          transition: "inset-inline-start 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: "none",
        }}
      >
        <span style={{ width: 44, height: 3, borderRadius: 3, background: C.brand, boxShadow: "0 1px 6px rgba(8,127,99,0.35)" }} />
      </span>
    </div>
  );
}

/** Eases a number from its previous value to the new one (~450ms).
 * Jumps straight to the value when the user prefers reduced motion. */
export function useCountUp(target: number, ms = 450) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !Number.isFinite(target) || from.current === target) {
      from.current = target;
      setVal(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(a + (target - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = target;
    };
  }, [target, ms]);
  return val;
}
