import { useEffect, useRef, useState } from "react";
import IPhoneMockup, { DEVICE_SPECS } from "./components/ui/iphone-mockup";
import { onDeviceOrientationRequest, type DeviceOrientation } from "./lib/device-orientation";
import {
  DEVICE_STATUS_BAR,
  onDevControls,
  onScreenVariants,
  sendDevCommand,
  sendScreenVariantPick,
  type DevControls,
  type ScreenVariants,
} from "./lib/device-bridge";

/**
 * Desktop preview: shows the app inside an iPhone 15 Pro (393×852).
 * The app runs in an iframe of this same URL, so it gets a real phone-sized
 * viewport — its 100dvh layouts, fixed overlays and responsive sizing behave
 * exactly as on a phone. main.tsx decides when to use this (wide screens,
 * top-level window, not disabled with ?device=off).
 *
 * The status bar takes on the colour of whatever the app shows beneath it, and
 * a full-bleed screen (Home's photo hero, lib/device-bridge.ts) runs under it,
 * so the app reads as running on the phone rather than pasted into a frame.
 * The testing pill (Skip / Reset) sits outside the phone, on the desk.
 *
 * The app can ask for landscape (lib/device-orientation.ts): the frame turns
 * 90° while the screen content stays upright and re-lays out in landscape,
 * like iOS (status bar hidden, side safe areas for the Dynamic Island).
 */

const MODEL = "15-pro" as const;
const spec = DEVICE_SPECS[MODEL];
const BEZEL = 9;
const BAND = 4;
const SCREEN_W = spec.w;
const SCREEN_H = spec.h;
const OUTER_W = SCREEN_W + (BEZEL + BAND) * 2;
const OUTER_H = SCREEN_H + (BEZEL + BAND) * 2;
const LANDSCAPE_INSET = 48; // Dynamic Island side / symmetric safe area
const ROTATE_MS = 650;
const APP_BG = "#F1F7F4";
const INK = "#0B1F1A";

function fitScale(orientation: DeviceOrientation) {
  const margin = 32;
  const [w, h] = orientation === "portrait" ? [OUTER_W, OUTER_H] : [OUTER_H, OUTER_W];
  return Math.min(1, (window.innerHeight - margin * 2) / h, (window.innerWidth - margin * 2) / w);
}

function useClock() {
  const format = () => new Date().toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
  const [time, setTime] = useState(format);
  useEffect(() => {
    const id = setInterval(() => setTime(format()), 15_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

type StatusBar = { bg: string; light: boolean };

function parseRgba(css: string): [number, number, number, number] | null {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = "1"] = m[1].split(/[\s,/]+/).filter(Boolean);
  return [Number(r), Number(g), Number(b), Number(a)];
}

const isDark = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b < 150;

/**
 * What the app paints at (x, y): the first solid background colour, or a
 * photo / video / gradient (taken to be dark, as heroes carry a dark scrim).
 */
function sampleStatusBar(doc: Document, x: number, y: number): StatusBar {
  for (const el of doc.elementsFromPoint(x, y)) {
    const hint = el.closest("[data-zm-statusbar]")?.getAttribute("data-zm-statusbar");
    if (hint === "light" || hint === "dark") return { bg: hint === "light" ? "#000" : APP_BG, light: hint === "light" };
    if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el instanceof HTMLCanvasElement) {
      return { bg: "#000", light: true };
    }
    const style = doc.defaultView!.getComputedStyle(el);
    const rgba = parseRgba(style.backgroundColor);
    if (rgba && rgba[3] >= 0.5) return { bg: `rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`, light: isDark(rgba) };
    if (style.backgroundImage.includes("url(")) return { bg: "#000", light: true };
    if (style.backgroundImage.includes("gradient(")) {
      const stop = parseRgba(style.backgroundImage); // computed gradients list rgb() stops
      if (stop && stop[3] >= 0.5) return { bg: `rgb(${stop[0]}, ${stop[1]}, ${stop[2]})`, light: isDark(stop) };
    }
  }
  return { bg: APP_BG, light: false };
}

/** Tracks the app inside `frame`: full-bleed state and status bar colour. */
function useAppChrome(frame: React.RefObject<HTMLIFrameElement | null>, active: boolean) {
  const [bleed, setBleed] = useState(false);
  const [bar, setBar] = useState<StatusBar>({ bg: APP_BG, light: false });

  useEffect(() => {
    if (!active) return;
    let observer: MutationObserver | undefined;
    const doc = () => frame.current?.contentDocument ?? null;
    const readBleed = () => setBleed(Boolean(doc()?.documentElement.hasAttribute("data-zm-bleed")));
    const attach = () => {
      observer?.disconnect();
      const d = doc();
      if (!d) return;
      readBleed();
      observer = new MutationObserver(readBleed);
      observer.observe(d.documentElement, { attributes: true, attributeFilter: ["data-zm-bleed"] });
    };
    const sample = () => {
      const d = doc();
      if (!d?.body) return;
      const bleeding = d.documentElement.hasAttribute("data-zm-bleed");
      // Under the clock: inside the status bar when full-bleed, else the app's top edge.
      const next = sampleStatusBar(d, d.documentElement.clientWidth * 0.18, bleeding ? DEVICE_STATUS_BAR / 2 : 1);
      setBar((prev) => (prev.bg === next.bg && prev.light === next.light ? prev : next));
    };
    const iframe = frame.current;
    iframe?.addEventListener("load", attach);
    attach();
    const id = setInterval(sample, 160);
    return () => {
      iframe?.removeEventListener("load", attach);
      observer?.disconnect();
      clearInterval(id);
    };
  }, [frame, active]);

  return { bleed, bar };
}

/* iOS-style status bar glyphs, drawn in currentColor. */
function SignalGlyph() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  );
}

function WifiGlyph() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
      <path d="M8 2.3c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.8 10.8 0 0 0 8 .5C5.2.5 2.6 1.6.5 3.5l1.2 1.3A9 9 0 0 1 8 2.3Z" />
      <path d="M8 5.6c1.5 0 2.9.6 4 1.6l1.2-1.3A7.6 7.6 0 0 0 8 3.8c-2 0-3.8.8-5.2 2.1L4 7.2a5.8 5.8 0 0 1 4-1.6Z" />
      <path d="M8 8.9c.7 0 1.3.3 1.8.7L8 11.5 6.2 9.6c.5-.4 1.1-.7 1.8-.7Z" />
    </svg>
  );
}

function BatteryGlyph() {
  return (
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" strokeOpacity="0.4" />
      <rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor" />
      <path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}

function StatusBarView({ time, bar, bleed }: { time: string; bar: StatusBar; bleed: boolean }) {
  const ear = (SCREEN_W - (spec.island?.w ?? 126)) / 2;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between"
      style={{
        height: DEVICE_STATUS_BAR,
        paddingTop: 5,
        // Full-bleed: the app shows through; otherwise continue its top colour.
        background: bleed ? "transparent" : bar.bg,
        color: bar.light ? "#fff" : INK,
        transition: "background-color 220ms ease, color 220ms ease",
        fontFamily: "-apple-system, 'SF Pro Text', 'Inter', system-ui, sans-serif",
      }}
    >
      <span className="flex justify-center pl-4 text-[17px] font-semibold tracking-[-0.01em]" style={{ width: ear }}>
        {time}
      </span>
      <span className="flex items-center justify-center gap-[6px] pr-4" style={{ width: ear }}>
        <SignalGlyph />
        <WifiGlyph />
        <BatteryGlyph />
      </span>
    </div>
  );
}

/** Testing controls (was a pill over the app), on the desk beside the phone. */
function DevPill({ controls, onAction }: { controls: DevControls | null; onAction: () => void }) {
  if (!controls) return null;
  return (
    <div
      className="fixed right-5 top-5 z-20 flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5"
      style={{
        background: "rgba(7, 51, 47, 0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 10px 28px rgba(7,51,47,0.25)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7FB8A8]">Testing</span>
      <span className="text-[13px] font-semibold text-[#E3F4EC]">{controls.label}</span>
      <button
        type="button"
        onClick={onAction}
        title={controls.title}
        className="cursor-pointer rounded-full border-0 px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:brightness-110 active:scale-95"
        style={{ background: "#2FAE68" }}
      >
        {controls.action}
      </button>
    </div>
  );
}

/** Testing: the current screen's alternative versions, on the desk below the testing pill. */
function VariantPanel({ variants, onPick }: { variants: ScreenVariants | null; onPick: (id: string) => void }) {
  if (!variants) return null;
  return (
    <div
      className="fixed right-5 top-[68px] z-20 flex w-[236px] flex-col gap-1 rounded-2xl p-2"
      style={{
        background: "rgba(7, 51, 47, 0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 10px 28px rgba(7,51,47,0.25)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <span className="px-2 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7FB8A8]">{variants.title}</span>
      {variants.options.map((o) => {
        const on = o.id === variants.active;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id)}
            aria-pressed={on}
            className="cursor-pointer rounded-xl border-0 px-3 py-2 text-left text-[12.5px] font-semibold transition hover:brightness-110 active:scale-[0.98]"
            style={{ background: on ? "#2FAE68" : "rgba(255,255,255,0.06)", color: on ? "#fff" : "#E3F4EC" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function DevicePreview() {
  const [orientation, setOrientation] = useState<DeviceOrientation>("portrait");
  const [scale, setScale] = useState(() => fitScale("portrait"));
  const [controls, setControls] = useState<DevControls | null>(null);
  const [variants, setVariants] = useState<ScreenVariants | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const time = useClock();
  const landscape = orientation === "landscape";
  const { bleed, bar } = useAppChrome(frameRef, !landscape);

  useEffect(() => onDeviceOrientationRequest(setOrientation), []);
  useEffect(() => onDevControls(setControls), []);
  useEffect(() => onScreenVariants(setVariants), []);
  useEffect(() => {
    const onResize = () => setScale(fitScale(orientation));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [orientation]);

  // Content box in the frame's (portrait) coordinates. In landscape it is a
  // 852×393 box rotated +90° so it stays upright while the frame turns −90°.
  const content = landscape
    ? {
        width: SCREEN_H,
        height: SCREEN_W,
        left: (SCREEN_W - SCREEN_H) / 2,
        top: (SCREEN_H - SCREEN_W) / 2,
        transform: "rotate(90deg)",
      }
    : { width: SCREEN_W, height: SCREEN_H, left: 0, top: 0, transform: "none" };

  // The app sits below the status bar, or under it when full-bleed.
  const appTop = landscape || bleed ? 0 : DEVICE_STATUS_BAR;

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 35%, #EEF5F1 0%, #D5E3DC 55%, #BFD1C9 100%)" }}
    >
      <DevPill controls={controls} onAction={() => sendDevCommand(frameRef.current)} />
      <VariantPanel variants={variants} onPick={(id) => sendScreenVariantPick(frameRef.current, id)} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: OUTER_W,
          height: OUTER_H,
          marginLeft: -OUTER_W / 2,
          marginTop: -OUTER_H / 2,
          transform: `rotate(${landscape ? -90 : 0}deg) scale(${scale})`,
          transition: `transform ${ROTATE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
        }}
      >
        <IPhoneMockup
          model={MODEL}
          color="natural-titanium"
          bezel={BEZEL}
          band={BAND}
          buttons
          screenBg={APP_BG}
          innerShadow={false}
          safeArea={false}
          showHomeIndicator={false}
          shadow="0 40px 80px -12px rgba(7,51,47,0.35), 0 18px 36px -18px rgba(7,51,47,0.4), 0 2px 6px rgba(7,51,47,0.15)"
        >
          <div
            className="absolute"
            style={{ ...content, background: landscape ? APP_BG : bar.bg }}
          >
            {!landscape && <StatusBarView time={time} bar={bar} bleed={bleed} />}
            <iframe
              ref={frameRef}
              title="Zarai Mandi app"
              src={window.location.href}
              className="absolute block border-0"
              style={{
                top: appTop,
                bottom: 0,
                left: landscape ? LANDSCAPE_INSET : 0,
                right: landscape ? LANDSCAPE_INSET : 0,
                width: `calc(100% - ${landscape ? LANDSCAPE_INSET * 2 : 0}px)`,
                height: `calc(100% - ${appTop}px)`,
                background: APP_BG,
              }}
              allow="fullscreen; microphone; autoplay; clipboard-write"
            />
            {/* Home indicator along the bottom of whichever way is up. */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 left-1/2 z-10 h-[5px] w-[134px] -translate-x-1/2 rounded-full"
              style={{ background: "rgba(11,31,26,0.6)" }}
            />
          </div>
        </IPhoneMockup>
      </div>
    </div>
  );
}
