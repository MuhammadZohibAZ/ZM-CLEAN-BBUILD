import { useEffect, useState } from "react";
import { BatteryFull, SignalHigh, Wifi } from "lucide-react";
import IPhoneMockup, { DEVICE_SPECS } from "./components/ui/iphone-mockup";
import { onDeviceOrientationRequest, type DeviceOrientation } from "./lib/device-orientation";

/**
 * Desktop preview: shows the app inside an iPhone 15 Pro Max (430×932).
 * The app runs in an iframe of this same URL, so it gets a real phone-sized
 * viewport — its 100dvh layouts, fixed overlays and responsive sizing behave
 * exactly as on a phone. main.tsx decides when to use this (wide screens,
 * top-level window, not disabled with ?device=off).
 *
 * The app can ask for landscape (lib/device-orientation.ts): the frame turns
 * 90° while the screen content stays upright and re-lays out in landscape,
 * like iOS (status bar hidden, side safe areas for the Dynamic Island).
 */

const MODEL = "15-pro-max" as const;
const spec = DEVICE_SPECS[MODEL];
const SCREEN_W = spec.w;
const SCREEN_H = spec.h;
const OUTER_W = SCREEN_W + spec.bezel * 2;
const OUTER_H = SCREEN_H + spec.bezel * 2;
const STATUS_BAR = 54;
const LANDSCAPE_INSET = 48; // Dynamic Island side / symmetric safe area
const ROTATE_MS = 650;

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

export default function DevicePreview() {
  const [orientation, setOrientation] = useState<DeviceOrientation>("portrait");
  const [scale, setScale] = useState(() => fitScale("portrait"));
  const time = useClock();
  const landscape = orientation === "landscape";

  useEffect(() => onDeviceOrientationRequest(setOrientation), []);
  useEffect(() => {
    const onResize = () => setScale(fitScale(orientation));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [orientation]);

  // Content box in the frame's (portrait) coordinates. In landscape it is a
  // 932×430 box rotated +90° so it stays upright while the frame turns −90°.
  const content = landscape
    ? {
        width: SCREEN_H,
        height: SCREEN_W,
        left: (SCREEN_W - SCREEN_H) / 2,
        top: (SCREEN_H - SCREEN_W) / 2,
        transform: "rotate(90deg)",
      }
    : { width: SCREEN_W, height: SCREEN_H, left: 0, top: 0, transform: "none" };

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #E4EFEA, #C7D6D0 70%)" }}
    >
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
          screenBg="#F4FAF7"
          safeArea={false}
          showHomeIndicator={false}
          shadow="0 30px 60px rgba(7,51,47,0.28), 0 8px 18px rgba(7,51,47,0.18)"
        >
          <div
            className="absolute flex flex-col"
            style={{
              ...content,
              paddingLeft: landscape ? LANDSCAPE_INSET : 0,
              paddingRight: landscape ? LANDSCAPE_INSET : 0,
            }}
          >
            {!landscape && (
              <div
                aria-hidden
                className="flex flex-shrink-0 items-center justify-between px-8 pt-1 text-[15px] font-semibold text-[#183B34]"
                style={{ height: STATUS_BAR, fontFamily: "-apple-system, 'Inter', sans-serif" }}
              >
                <span className="w-16">{time}</span>
                <span className="flex w-16 items-center justify-end gap-1.5">
                  <SignalHigh className="size-[17px]" strokeWidth={2.5} />
                  <Wifi className="size-[16px]" strokeWidth={2.5} />
                  <BatteryFull className="size-[22px]" strokeWidth={1.8} />
                </span>
              </div>
            )}
            <iframe
              title="Zarai Mandi app"
              src={window.location.href}
              className="block w-full flex-1 border-0"
              allow="fullscreen; microphone; autoplay; clipboard-write"
            />
            {/* Home indicator along the bottom of whichever way is up. */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[140px] -translate-x-1/2 rounded-full"
              style={{ background: "rgba(24,59,52,0.55)" }}
            />
          </div>
        </IPhoneMockup>
      </div>
    </div>
  );
}
