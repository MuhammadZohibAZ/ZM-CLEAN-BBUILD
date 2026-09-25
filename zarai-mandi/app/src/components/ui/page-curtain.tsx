import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

/**
 * Page curtain — a slanted clip-wipe transition that carries the incoming
 * page name across the screen (modelled on Motion UI's page-curtain).
 * Navigation stays with the host app's navbar: call `play()` and swap the page
 * in `onCovered`, which fires while the curtain fully covers the screen.
 */

export interface CurtainRequest {
  title: string;
  subtitle?: string;
  color: string;
  /** 1 = moving to a later tab (wipes right → left), -1 = earlier tab. */
  direction: 1 | -1;
}

interface CurtainRun extends CurtainRequest {
  id: number;
  onCovered: () => void;
}

export function usePageCurtain() {
  const [run, setRun] = useState<CurtainRun | null>(null);
  const [announce, setAnnounce] = useState("");
  const nextId = useRef(0);

  const play = useCallback((request: CurtainRequest, onCovered: () => void) => {
    nextId.current += 1;
    setAnnounce(`${request.title} page`);
    setRun({ ...request, id: nextId.current, onCovered });
  }, []);
  const finish = useCallback(() => setRun(null), []);

  return { run, announce, isPending: run !== null, play, finish };
}

type Controller = ReturnType<typeof usePageCurtain>;

const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];
const COVER_S = 0.5;
const HOLD_MS = 180;
const REVEAL_S = 0.5;

export function PageCurtain({ controller, angle = 9 }: { controller: Controller; angle?: number }) {
  const { run, announce, finish } = controller;
  const reduced = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Wipe progress: 0 → 1 covers, 1 → 2 reveals.
  const progress = useMotionValue(0);
  const opacity = useMotionValue(1);

  useLayoutEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const direction = run?.direction ?? 1;
  const clipPath = useTransform(progress, (p) => wipePolygon(p, size.w, size.h, angle, direction));
  const titleX = useTransform(progress, [0, 1, 2], [60 * direction, 0, -60 * direction]);

  useEffect(() => {
    if (!run) return;
    let cancelled = false;
    let hold: ReturnType<typeof setTimeout> | undefined;
    const controls: { stop: () => void }[] = [];

    const reveal = () => {
      if (cancelled) return;
      const done = () => { if (!cancelled) finish(); };
      controls.push(
        reduced
          ? animate(opacity, 0, { duration: 0.2, onComplete: done })
          : animate(progress, 2, { duration: REVEAL_S, ease: EASE, onComplete: done }),
      );
    };
    const covered = () => {
      if (cancelled) return;
      run.onCovered();
      hold = setTimeout(reveal, HOLD_MS);
    };

    if (reduced) {
      progress.set(1);
      opacity.set(0);
      controls.push(animate(opacity, 1, { duration: 0.15, onComplete: covered }));
    } else {
      opacity.set(1);
      progress.set(0);
      controls.push(animate(progress, 1, { duration: COVER_S, ease: EASE, onComplete: covered }));
    }

    return () => {
      cancelled = true;
      if (hold) clearTimeout(hold);
      controls.forEach((c) => c.stop());
    };
  }, [run?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={layerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 45 }}>
      {/* Persistent polite live region so screen readers announce every page change. */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </span>
      {run && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.14), transparent 60%), ${run.color}`,
            clipPath,
            WebkitClipPath: clipPath,
            opacity,
          }}
        >
          <motion.div className="flex flex-col items-center gap-2 px-6 text-center" style={{ x: titleX }}>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: 44,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {run.title}
            </span>
            {run.subtitle && (
              <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, fontWeight: 600 }}>
                {run.subtitle}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Polygon for a slanted wipe. The edge tilts by `angle` degrees; for direction 1
 * the curtain enters from the right, covers, then exits to the left.
 */
function wipePolygon(p: number, w: number, h: number, angle: number, direction: 1 | -1) {
  if (!w || !h) return p > 0 && p < 2 ? "none" : "inset(0 0 0 100%)";
  const skew = h * Math.tan((angle * Math.PI) / 180);
  const far = w + skew;
  // Edge centre travels from the right side (w + skew/2) to the left (-skew/2).
  const travel = (t: number) => w + skew / 2 - t * (w + skew);
  let pts: [number, number][];
  if (p <= 1) {
    const e = travel(p);
    pts = [[e + skew / 2, 0], [far, 0], [far, h], [e - skew / 2, h]];
  } else {
    const e = travel(p - 1);
    pts = [[-skew, 0], [e + skew / 2, 0], [e - skew / 2, h], [-skew, h]];
  }
  if (direction === -1) pts = pts.map(([x, y]) => [w - x, y]);
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y}px`).join(", ")})`;
}
