import React from "react";

export type ProvincePattern = "phulkari" | "ajrak" | "khyber" | "baloch" | "pakistan";

const TILES: Record<ProvincePattern, { size: number; body: React.ReactNode }> = {
  phulkari: {
    size: 40,
    body: (
      <>
        <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="4" fill="#fff" />
        <circle cx="2" cy="2" r="2" fill="#fff" />
        <circle cx="38" cy="2" r="2" fill="#fff" />
        <circle cx="2" cy="38" r="2" fill="#fff" />
        <circle cx="38" cy="38" r="2" fill="#fff" />
      </>
    ),
  },
  ajrak: {
    size: 36,
    body: (
      <>
        <circle cx="18" cy="18" r="10" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="4" fill="#fff" />
        <circle cx="18" cy="4" r="2" fill="#fff" />
        <circle cx="18" cy="32" r="2" fill="#fff" />
        <circle cx="4" cy="18" r="2" fill="#fff" />
        <circle cx="32" cy="18" r="2" fill="#fff" />
      </>
    ),
  },
  khyber: {
    size: 32,
    body: (
      <>
        <polyline points="0,24 16,8 32,24" fill="none" stroke="#fff" strokeWidth="1.8" />
        <polyline points="0,28 16,12 32,28" fill="none" stroke="#fff" strokeWidth="1" />
        <circle cx="16" cy="6" r="2" fill="#fff" />
      </>
    ),
  },
  baloch: {
    size: 28,
    body: (
      <>
        <polygon points="14,2 26,14 14,26 2,14" fill="none" stroke="#fff" strokeWidth="1.5" />
        <polygon points="14,7 21,14 14,21 7,14" fill="#fff" opacity="0.6" />
      </>
    ),
  },
  pakistan: {
    size: 48,
    body: (
      <>
        <path d="M 28 16 A 10 10 0 1 1 20 32 A 8 8 0 1 0 28 16 Z" fill="#fff" />
        <polygon points="32,18 33.5,22 37.5,22 34.5,24.5 35.5,28.5 32,26 28.5,28.5 29.5,24.5 26.5,22 30.5,22" fill="#fff" />
      </>
    ),
  },
};

/** Traditional provincial motif, drawn as a repeating tile. */
export function ProvincePatternSvg({ pattern, opacity = 0.3 }: { pattern: ProvincePattern; opacity?: number }) {
  const tile = TILES[pattern] || TILES.phulkari;
  const id = `zm-pattern-${pattern}`;
  return (
    <svg width="100%" height="100%" aria-hidden="true" style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <pattern id={id} width={tile.size} height={tile.size} patternUnits="userSpaceOnUse">
          {tile.body}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
