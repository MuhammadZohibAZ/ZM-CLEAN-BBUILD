import React, { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MicSVG } from "../components/icons";
import { useLang } from "../shared/i18n/LangProvider";
import { type NavTab } from "../shared/types";

// BOTTOM NAV

export function BottomNav({
  active,
  onNav,
  onVoiceTap,
  onVoiceHold,
  voiceActive,
}: {
  active: NavTab;
  onNav: (t: NavTab) => void;
  onVoiceTap: () => void;
  onVoiceHold: () => void;
  voiceActive: boolean;
}) {
  const { t } = useLang();

  // Tap = orientation, Hold (≥380ms) = voice query
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHoldRef = useRef(false);
  const pointerDownRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const handleVoiceDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;

    pointerDownRef.current = true;
    didHoldRef.current = false;
    setIsPressing(true);
    triggerHaptic(8);

    holdTimerRef.current = setTimeout(() => {
      didHoldRef.current = true;
      pointerDownRef.current = false;
      setIsPressing(false);
      triggerHaptic([15, 35, 15]);
      onVoiceHold();
    }, 380);
  };

  const handleVoiceUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Fallback if pointer capture was already released
      }
      pointerIdRef.current = null;
    }

    setIsPressing(false);
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (!didHoldRef.current) {
      triggerHaptic(12);
      onVoiceTap();
    }
  };

  const handleVoiceCancel = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setIsPressing(false);
    pointerDownRef.current = false;
    pointerIdRef.current = null;
  };

  const tabIndexMap: Record<string, number> = {
    home: 0,
    compare: 1,
    news: 2,
    voice: 3,
  };

  const currentActiveIndex = voiceActive ? 3 : (tabIndexMap[active] ?? 0);

  const tabs: {
    id: NavTab;
    label: string;
    brandColor: string;
    icon: (isActive: boolean) => React.ReactNode;
  }[] = [
      {
        id: "home",
        label: t("nav.home"),
        brandColor: "#087F63",
        icon: (isActive) => (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={isActive ? "#ffffff" : "#183B34"}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
            <path
              d="M9 21V12h6v9"
              fill={isActive ? "#087F63" : "#C7D8D1"}
            />
          </svg>
        ),
      },
      {
        id: "compare",
        label: t("nav.compare"),
        brandColor: "#2FAE68",
        icon: (isActive) => (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="7"
              height="18"
              rx="2"
              stroke={isActive ? "#ffffff" : "#183B34"}
              strokeWidth="2"
            />
            <rect
              x="14"
              y="3"
              width="7"
              height="18"
              rx="2"
              fill={isActive ? "#ffffff" : "#183B34"}
            />
            <path
              d="M6 8h1M6 13h1"
              stroke={isActive ? "#2FAE68" : "#ffffff"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        id: "news",
        label: t("nav.news"),
        brandColor: "#0E645C",
        icon: (isActive) => (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="5"
              stroke={isActive ? "#ffffff" : "#183B34"}
              strokeWidth="2"
            />
            <path
              d="M7 3L10.5 8M13.5 3L17 8M3 8H21"
              stroke={isActive ? "#ffffff" : "#183B34"}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <polygon
              points="10,11 16,14.5 10,18"
              fill={isActive ? "#ffffff" : "#183B34"}
            />
          </svg>
        ),
      },
    ];

  return (
    <nav
      className="zm-bottom-nav-shell flex-shrink-0 relative z-50 ltr-only w-full px-3 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] mb-2 flex justify-center items-center gap-2.5"
      style={{ direction: "ltr" }}
    >
      {/* Navigation Cockpit */}
      <div className="relative flex items-center h-[50px] p-1 bg-white/95 dark:bg-[#0c1f1a]/95 backdrop-blur-xl rounded-full border border-[#087F63]/15 dark:border-emerald-500/20 shadow-[0_8px_24px_-4px_rgba(8,127,99,0.12)]">
        <div className="flex items-center gap-1 h-full">
          {tabs.map((tab, idx) => {
            const isTabActive = currentActiveIndex === idx;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic(8);
                  onNav(tab.id);
                }}
                className="relative flex items-center justify-center h-[40px] px-3.5 rounded-full outline-none select-none group transition-transform active:scale-95"
              >
                {/* Brand-Colored Sliding Capsule */}
                {isTabActive && (
                  <motion.div
                    layoutId="exactBrandPill"
                    transition={{
                      type: "spring",
                      stiffness: 480,
                      damping: 32,
                      mass: 0.55,
                    }}
                    style={{ backgroundColor: tab.brandColor }}
                    className="absolute inset-0 rounded-full shadow-[0_2px_10px_rgba(8,127,99,0.28)]"
                  />
                )}

                {/* Tab Icon (22px) & Label */}
                <div className="relative z-10 flex items-center gap-1.5">
                  <motion.div
                    animate={{
                      scale: isTabActive ? 1.05 : 1,
                      y: isTabActive ? -0.5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-center justify-center"
                  >
                    {tab.icon(isTabActive)}
                  </motion.div>

                  <span
                    className={`text-[11px] tracking-tight font-medium transition-colors duration-150 ${isTabActive
                      ? "text-white font-semibold"
                      : "text-[#183B34] dark:text-[#C7D8D1] group-hover:text-[#087F63]"
                      }`}
                  >
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Satellite Button (Exact w-10 h-10 Sizing) */}
      <div className="relative flex items-center justify-center w-10 h-10 flex-shrink-0">
        {/* Real-time Hold Charging Ring calibrated for 40px */}
        <svg
          className="absolute -inset-1 w-12 h-12 -rotate-90 pointer-events-none z-20"
          viewBox="0 0 48 48"
        >
          <motion.circle
            cx="24"
            cy="24"
            r="21"
            fill="none"
            stroke="url(#emeraldHoldExactGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="132"
            initial={{ strokeDashoffset: 132 }}
            animate={{
              strokeDashoffset: isPressing ? 0 : 132,
            }}
            transition={{
              duration: isPressing ? 0.38 : 0.1,
              ease: "linear",
            }}
          />
          <defs>
            <linearGradient id="emeraldHoldExactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="50%" stopColor="#2FAE68" />
              <stop offset="100%" stopColor="#087F63" />
            </linearGradient>
          </defs>
        </svg>

        {/* The Exact w-10 h-10 Voice Button */}
        <motion.button
          aria-label={t("nav.voice")}
          onPointerDown={handleVoiceDown}
          onPointerUp={handleVoiceUp}
          onPointerCancel={handleVoiceCancel}
          onContextMenu={(e) => e.preventDefault()}
          animate={{
            scale: isPressing ? 0.92 : voiceActive ? 1.1 : 1,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 outline-none select-none cursor-pointer ${voiceActive
            ? "bg-[#FEE2E2] border-2 border-[#EF4444] shadow-md animate-pulse"
            : isPressing
              ? "bg-[#087F63] border-2 border-[#86EFAC] shadow-md scale-95"
              : "bg-[#E4F4EC] border border-[#86EFAC] shadow-sm hover:scale-105 active:scale-95"
            }`}
        >
          {voiceActive ? (
            /* Kinetic Mini Equalizer when active */
            <div className="flex items-center gap-[2px] h-3.5 pointer-events-none">
              {[0.4, 1, 0.55, 0.85].map((scale, i) => (
                <motion.span
                  key={i}
                  className="w-[2px] bg-[#DC2626] rounded-full"
                  animate={{
                    height: ["3px", `${14 * scale}px`, "3px"],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.52,
                    delay: i * 0.1,
                    ease: [0.33, 1, 0.68, 1],
                  }}
                />
              ))}
            </div>
          ) : (
            <MicSVG
              size={20}
              color={isPressing ? "#FFFFFF" : "#087F63"}
            />
          )}
        </motion.button>
      </div>
    </nav>
  );
}