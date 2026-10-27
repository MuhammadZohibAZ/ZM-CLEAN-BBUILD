import type { Fmt } from "./format";
import { C } from "./theme";
import { Icon, IconButton, Tabs } from "./ui";

export type Tab = "overview" | "trends";

export function AppBar({
  f,
  title,
  subtitle,
  onTitleClick,
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
  /** Switch to another by-product of the same product (title shows a dropdown arrow). */
  onTitleClick?: () => void;
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
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ margin: 0, minWidth: 0, display: "flex" }}>
            {(() => {
              const text = (
                <span
                  style={{
                    overflowWrap: "break-word", fontSize: 18,
                    fontWeight: 700,
                    lineHeight: f.ur ? 1.5 : 1.2,
                    letterSpacing: "-0.01em",
                    color: C.ink,
                    whiteSpace: "normal",
                                                            minWidth: 0,
                  }}
                >
                  {title}
                </span>
              );
              return onTitleClick ? (
                <button
                  type="button"
                  onClick={onTitleClick}
                  aria-haspopup="listbox"
                  aria-label={f.tx(`${title}: change by-product`, `${title}: ضمنی مصنوع تبدیل کریں`)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0, maxWidth: "100%", padding: 0, border: "none", background: "transparent", fontFamily: f.font, textAlign: "start" }}
                >
                  {text}
                  <span style={{ width: 22, height: 22, borderRadius: 11, background: C.chip, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="chevDown" size={12} width={2.6} color={C.ink2} />
                  </span>
                </button>
              ) : (
                text
              );
            })()}
          </h1>
          {(subtitle || compact) && (
            // Both lines share one grid cell (cross-fade) and can wrap, so nothing is cut off.
            <div style={{ display: "grid" }}>
              {subtitle && (
                <p
                  aria-hidden={!!compact}
                  style={{ overflowWrap: "break-word", gridArea: "1 / 1", margin: 0, fontSize: 12, fontWeight: 500, color: C.muted, whiteSpace: "normal", lineHeight: f.lh, transition: "opacity 200ms ease, transform 200ms ease", opacity: compact ? 0 : 1, transform: compact ? "translateY(-6px)" : "none" }}
                >
                  {subtitle}
                </p>
              )}
              {compact && (
                <p
                  aria-hidden={!compact}
                  style={{ overflowWrap: "break-word", gridArea: "1 / 1", margin: 0, fontSize: 12.5, fontWeight: 600, color: C.ink, whiteSpace: "normal", lineHeight: f.lh, transition: "opacity 200ms ease, transform 200ms ease", opacity: compact ? 1 : 0, transform: compact ? "none" : "translateY(6px)", fontVariantNumeric: "tabular-nums" }}
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
          <Icon name="star" size={20} width={2} color={picked ? C.fav : C.ink2} fill={picked ? C.fav : "none"} />
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
