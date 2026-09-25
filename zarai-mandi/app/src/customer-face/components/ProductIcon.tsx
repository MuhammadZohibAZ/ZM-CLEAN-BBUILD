import React from "react";

import { getproductIconSrc } from "../shared/data/icons";

export function SpriteIcon({
  spriteKey,
  size = 44,
  className,
  style,
}: {
  spriteKey: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const src = getproductIconSrc(spriteKey);
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt={spriteKey}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export function ProductIcon({
  name,
  vertical,
  size = 44,
  className,
  style,
}: {
  name: string;
  vertical?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const src = getproductIconSrc(name, vertical);
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
