import { SpriteIcon } from "./ProductIcon";
import { getSpriteKey } from "../shared/data/icons";

//  CIRCLE TILE

export function CircleTile({
  src,
  product,
  vertical,
  alt,
  label,
  selected,
  onPress,
  size = 72,
  starred,
  onStar,
}: {
  src?: string;
  product?: string;
  vertical?: string;
  alt: string;
  label: string;
  selected?: boolean;
  onPress: () => void;
  size?: number;
  starred?: boolean;
  onStar?: () => void;
}) {
  const iconSize = Math.round(size * 0.65);
  const spriteKey = product ? getSpriteKey(product, vertical) : null;
  return (
    <button
      onClick={onPress}
      className="tap-target flex flex-col items-center gap-1.5"
      style={{ minWidth: size + 16 }}
    >
      <div
        className="relative flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          background: selected ? "#E4F2EC" : "#F1F7F4",
          border: selected ? `3px solid #087F63` : "2px solid #D5E2DD",
          flexShrink: 0,
        }}
      >
        {spriteKey ? (
          <SpriteIcon spriteKey={spriteKey} size={iconSize} />
        ) : src ? (
          <img
            src={src}
            alt={alt}
            style={{ width: iconSize, height: iconSize, objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              width: iconSize,
              height: iconSize,
              background: "#D5E2DD",
              borderRadius: 4,
            }}
          />
        )}
        {selected && (
          <div className="absolute inset-0 flex items-end justify-end pb-1 pr-1">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#087F63" }}
            >
              <span
                className="text-white font-bold"
                style={{ fontSize: 10 }}
              ></span>
            </div>
          </div>
        )}
        {onStar && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onStar();
            }}
            className="absolute top-0 left-0 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              fontSize: 13,
              background: starred ? "#087F63" : "rgba(255,255,255,0.92)",
              border: "1.5px solid " + (starred ? "#087F63" : "#D5E2DD"),
              color: starred ? "#fff" : "#B9822E",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            }}
          >
            {starred ? "" : ""}
          </span>
        )}
      </div>
      <span
        className="text-center leading-tight"
        style={{
          fontSize: 11,
          fontFamily: "'Inter', sans-serif",
          fontWeight: selected ? 700 : 500,
          color: selected ? "#087F63" : "#183B34",
          maxWidth: size + 16,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {label}
      </span>
    </button>
  );
}
