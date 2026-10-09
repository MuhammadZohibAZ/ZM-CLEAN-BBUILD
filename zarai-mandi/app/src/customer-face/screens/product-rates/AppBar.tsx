import { ProductIcon } from "../../components/ProductIcon";
import type { Fmt } from "./format";
import { C } from "./theme";
import { Icon, IconButton, Tabs } from "./ui";

export type Tab = "overview" | "trends";

export function AppBar({
  f,
  title,
  subtitle,
  vertical,
  iconName,
  picked,
  onBack,
  onToggleFav,
  tab,
  onTab,
  compact,
}: {
  f: Fmt;
  title: string;
  subtitle?: string;
  vertical: string;
  iconName: string;
  picked: boolean;
  onBack: () => void;
  onToggleFav: () => void;
  tab: Tab;
  onTab: (t: Tab) => void;
  /** Shown in place of the subtitle once the price card scrolls away. */
  compact?: { price: string; change: string; dir: number } | null;
}) {
  return (
    <header style={{ flexShrink: 0, background: C.surface }}>
      {/* Stays visible above sheets that open with revealHeader (BottomSheet). */}
      <div
        data-zm-sheet-reveal=""
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 16px 6px",
          paddingTop: "max(10px, env(safe-area-inset-top, 10px))",
        }}
      >
        <IconButton label={f.tx("Back", "واپس")} onClick={onBack}>
          <Icon name="back" size={20} width={2.4} flip={f.ur} />
        </IconButton>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: C.chip, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          <ProductIcon name={iconName} vertical={vertical} size={30} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              lineHeight: f.ur ? 1.5 : 1.2,
              letterSpacing: "-0.01em",
              color: C.ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h1>
          {(subtitle || compact) && (
            <div style={{ position: "relative", height: f.ur ? 20 : 16 }}>
              {subtitle && (
                <p
                  aria-hidden={!!compact}
                  style={{ position: "absolute", inset: 0, margin: 0, fontSize: 12, fontWeight: 500, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: f.lh, transition: "opacity 200ms ease, transform 200ms ease", opacity: compact ? 0 : 1, transform: compact ? "translateY(-6px)" : "none" }}
                >
                  {subtitle}
                </p>
              )}
              {compact && (
                <p
                  aria-hidden={!compact}
                  style={{ position: "absolute", inset: 0, margin: 0, fontSize: 12.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: f.lh, transition: "opacity 200ms ease, transform 200ms ease", opacity: compact ? 1 : 0, transform: compact ? "none" : "translateY(6px)", fontVariantNumeric: "tabular-nums" }}
                >
                  {compact?.price}{" "}
                  <span style={{ color: compact && compact.dir > 0 ? C.up : compact && compact.dir < 0 ? C.down : C.muted, direction: "ltr", unicodeBidi: "isolate" }}>{compact?.change}</span>
                </p>
              )}
            </div>
          )}
        </div>
        <IconButton
          label={picked ? f.tx("Remove from favourites", "پسندیدہ سے ہٹائیں") : f.tx("Add to favourites", "پسندیدہ میں شامل کریں")}
          onClick={onToggleFav}
          active={picked}
          activeBg={C.favTint}
          activeBorder={C.favTint}
        >
          <Icon name="heart" size={19} width={2.2} color={picked ? C.fav : C.ink2} fill={picked ? C.fav : "none"} />
        </IconButton>
      </div>
      <Tabs<Tab>
        value={tab}
        onChange={onTab}
        font={f.font}
        options={[
          { id: "overview", label: f.tx("Overview", "جائزہ") },
          { id: "trends", label: f.tx("Trends", "رجحانات") },
        ]}
      />
    </header>
  );
}
