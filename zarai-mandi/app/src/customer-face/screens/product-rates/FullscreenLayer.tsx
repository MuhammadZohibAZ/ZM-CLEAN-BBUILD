import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { inDevicePreview, requestDeviceOrientation } from "../../../lib/device-orientation";
import type { Fmt } from "./format";
import { C } from "./theme";
import { Icon } from "./ui";

/**
 * Full-screen layer shared by the expandable views (mandi table, mandi detail
 * history table, trend charts): close button, title, optional actions and a
 * Portrait / Landscape switch. Mount it only while open.
 *
 * One rotation mechanism at a time:
 * - desktop phone mockup: ask the mockup to rotate (no CSS rotation);
 * - real phone: try the native orientation lock; if the screen is still
 *   portrait (lock unsupported / refused), rotate the layer with CSS.
 */
export function FullscreenLayer({
  f,
  title,
  subtitle,
  actions,
  onClose,
  defaultLandscape = false,
  children,
}: {
  f: Fmt;
  title: string;
  subtitle?: string;
  /** Buttons shown before the orientation switch (e.g. a calendar). */
  actions?: ReactNode;
  onClose: () => void;
  /** Opens in portrait unless set; the switch in the header changes it. */
  defaultLandscape?: boolean;
  /** Fills the rest of the layer (a flex column). */
  children: ReactNode;
}) {
  const [landscape, setLandscape] = useState(defaultLandscape);
  const preview = inDevicePreview();
  const [portraitScreen, setPortraitScreen] = useState(() => typeof window !== "undefined" && window.innerHeight > window.innerWidth);

  useEffect(() => {
    const check = () => setPortraitScreen(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const want = landscape ? "landscape" : "portrait";
    if (preview) {
      requestDeviceOrientation(want);
      return;
    }
    const o = typeof screen !== "undefined" ? (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }) : undefined;
    try {
      if (landscape) o?.lock?.("landscape").catch(() => { });
      else o?.unlock?.();
    } catch {
      /* orientation lock unsupported */
    }
  }, [landscape, preview]);

  // Closing puts the phone back to portrait.
  useEffect(() => () => {
    if (inDevicePreview()) requestDeviceOrientation("portrait");
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* ignore */
    }
  }, []);

  const rotated = landscape && !preview && portraitScreen;

  return createPortal(
    <div
      dir={f.dir}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="zm-product-rates zm-fadein"
      style={{
        position: "fixed",
        // Same layer as the bottom sheets: opened later, it sits above the sheet it
        // came from, and pickers opened from it sit above it.
        zIndex: 12000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: C.surface,
        color: C.ink,
        fontFamily: f.font,
        ...(rotated
          ? { top: "50%", left: "50%", width: "100dvh", height: "100dvw", transform: "translate(-50%, -50%) rotate(90deg)" }
          : { inset: 0 }),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: rotated
            ? "8px max(12px, env(safe-area-inset-bottom)) 8px max(12px, env(safe-area-inset-top))"
            : "max(8px, env(safe-area-inset-top), calc(var(--zm-bleed-top) + 4px)) max(12px, env(safe-area-inset-right)) 8px max(12px, env(safe-area-inset-left))",
          borderBottom: `1px solid ${C.line}`,
          background: C.surface,
          flexShrink: 0,
        }}
      >
        <button type="button" aria-label={f.tx("Close", "بند کریں")} onClick={onClose} style={{ width: 40, height: 40, borderRadius: 20, border: "none", background: C.chip, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="close" size={18} width={2.4} color={C.ink} />
        </button>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 700, fontSize: 15, lineHeight: f.lh, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
          {subtitle && (
            <span style={{ fontWeight: 500, fontSize: 12, color: C.muted, lineHeight: f.lh, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</span>
          )}
        </div>
        {actions}
        <div role="group" aria-label={f.tx("Orientation", "رخ")} style={{ display: "flex", gap: 2, padding: 3, borderRadius: 12, background: C.track, flexShrink: 0 }}>
          {([false, true] as const).map((l) => (
            <button
              key={String(l)}
              type="button"
              aria-pressed={landscape === l}
              aria-label={l ? f.tx("Landscape", "افقی") : f.tx("Portrait", "عمودی")}
              onClick={() => setLandscape(l)}
              style={{
                height: 32,
                minWidth: 38,
                justifyContent: "center",
                padding: landscape ? "0 10px" : 0,
                border: "none",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: f.font,
                color: landscape === l ? C.ink : C.muted,
                background: landscape === l ? C.surface : "transparent",
                boxShadow: landscape === l ? "0 1px 3px rgba(15,26,23,0.12)" : "none",
                transition: "background 200ms, color 200ms",
              }}
            >
              <span aria-hidden style={{ width: l ? 14 : 9, height: l ? 9 : 14, borderRadius: 2.5, border: `1.8px solid currentColor` }} />
              {landscape && (l ? f.tx("Landscape", "افقی") : f.tx("Portrait", "عمودی"))}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>,
    document.body,
  );
}

/** Small round "expand" button that opens a full-screen view. */
export function ExpandButton({ f, label, onClick, dark = false }: { f: Fmt; label: string; onClick: () => void; dark?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: 10,
        border: `1px solid ${C.line}`,
        background: dark ? "rgba(255,255,255,0.9)" : C.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: f.font,
      }}
    >
      <Icon name="expand" size={15} width={2.3} color={C.ink2} />
    </button>
  );
}

/** Live size of an element (pre-rotation layout size), for charts that fill a box. */
export function useBoxSize<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, size] as const;
}
