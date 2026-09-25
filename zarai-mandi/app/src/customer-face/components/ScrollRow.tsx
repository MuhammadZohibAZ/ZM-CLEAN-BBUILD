import React, { useRef } from "react";

import { useLang } from "../shared/i18n/LangProvider";

export function ScrollRow({
  children,
  bg = "#F4FAF7",
  style,
}: {
  children: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { lang } = useLang();
  const isRtl = lang === "ur";

  const scrollLeft = () =>
    ref.current?.scrollBy({ left: isRtl ? 160 : -160, behavior: "smooth" });
  const scrollRight = () =>
    ref.current?.scrollBy({ left: isRtl ? -160 : 160, behavior: "smooth" });

  return (
    <div className="relative flex-shrink-0 w-full" style={style}>
      <div
        ref={ref}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          touchAction: "pan-x",
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 7,
          paddingBottom: 10,
          scrollbarWidth: "none",
        }}
      >
        {children}
      </div>
      <button
        onClick={scrollLeft}
        className="tap-target absolute left-0 top-0 bottom-0 flex items-center justify-start pl-1 z-10 opacity-70 hover:opacity-100"
        style={{
          width: 24,
          background: `linear-gradient(to right, ${bg} 70%, transparent)`,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "#087F63",
            lineHeight: 1,
          }}
        >
          ‹
        </span>
      </button>
      <button
        onClick={scrollRight}
        className="tap-target absolute right-0 top-0 bottom-0 flex items-center justify-end pr-1 z-10 opacity-70 hover:opacity-100"
        style={{
          width: 24,
          background: `linear-gradient(to left, ${bg} 70%, transparent)`,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "#087F63",
            lineHeight: 1,
          }}
        >
          ›
        </span>
      </button>
    </div>
  );
}
