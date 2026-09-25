import { useRef } from "react";
import { AnimatedTabBar, type TabItem } from "../../components/ui/animated-tab-bar";

import { MicSVG } from "../components/icons";
import { useLang } from "../shared/i18n/LangProvider";
import { type NavTab } from "../shared/types";

//  BOTTOM NAV

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
  const { t, lang } = useLang();

  // Tap = orientation, Hold (≥380ms) = voice query
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHoldRef = useRef(false);
  const pointerDownRef = useRef(false);

  const handleVoiceDown = () => {
    pointerDownRef.current = true;
    didHoldRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      didHoldRef.current = true;
      pointerDownRef.current = false;
      onVoiceHold();
    }, 380);
  };
  const handleVoiceUp = () => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (!didHoldRef.current) onVoiceTap();
  };

  const tabIndexMap: Record<string, number> = {
    home: 0,
    compare: 1,
    news: 2,
    voice: 3,
  };

  const currentActiveIndex = voiceActive ? 3 : (tabIndexMap[active] ?? 0);

  const navItems: TabItem[] = [
    {
      id: "home",
      label: t("nav.home"),
      color: "#087F63",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill={currentActiveIndex === 0 ? "#ffffff" : "#183B34"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" fill={currentActiveIndex === 0 ? "#087F63" : "#C7D8D1"} />
        </svg>
      ),
      onClick: () => onNav("home"),
    },
    {
      id: "compare",
      label: t("nav.compare"),
      color: "#2FAE68",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="3" y="3" width="7" height="18" rx="2" stroke={currentActiveIndex === 1 ? "#ffffff" : "#183B34"} strokeWidth="2" />
          <rect x="14" y="3" width="7" height="18" rx="2" fill={currentActiveIndex === 1 ? "#ffffff" : "#183B34"} />
          <path d="M6 8h1M6 13h1" stroke={currentActiveIndex === 1 ? "#ffffff" : "#183B34"} strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => onNav("compare"),
    },
    {
      id: "news",
      label: t("nav.news"),
      color: "#0E645C",
      icon: (
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
            stroke={currentActiveIndex === 2 ? "#ffffff" : "#183B34"}
            strokeWidth="2"
          />
          <path
            d="M7 3L10.5 8M13.5 3L17 8M3 8H21"
            stroke={currentActiveIndex === 2 ? "#ffffff" : "#183B34"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <polygon
            points="10,11 16,14.5 10,18"
            fill={currentActiveIndex === 2 ? "#ffffff" : "#183B34"}
          />
        </svg>
      ),
      onClick: () => onNav("news"),
    },
    {
      id: "voice",
      label: t("nav.voice"),
      color: voiceActive ? "#C94A43" : "#087F63",
      icon: (
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${voiceActive
            ? "bg-[#FEE2E2] border-2 border-[#EF4444] scale-110 shadow-md animate-pulse"
            : "bg-[#E4F4EC] border border-[#86EFAC] shadow-sm"
            }`}
        >
          <MicSVG size={20} color={voiceActive ? "#DC2626" : "#087F63"} />
        </div>
      ),
      onPointerDown: handleVoiceDown,
      onPointerUp: handleVoiceUp,
      onPointerLeave: handleVoiceUp,
    },
  ];

  return (
    <nav
      className="zm-bottom-nav-shell flex-shrink-0 relative z-50 ltr-only w-full"
      style={{ direction: "ltr" }}
    >
      <AnimatedTabBar
        items={navItems}
        activeIndex={currentActiveIndex}
        onTabChange={(index) => {
          if (index === 0) onNav("home");
          else if (index === 1) onNav("compare");
          else if (index === 2) onNav("news");
        }}
      />
    </nav>
  );
}
