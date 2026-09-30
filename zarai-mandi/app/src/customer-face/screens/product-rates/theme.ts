// Design tokens for the Product Rates screen. One place for colour, type
// and shape so every section below reads as one system.

export const C = {
  ground: "#F3F4F3",
  surface: "#FFFFFF",
  surfaceAlt: "#F6F7F6",
  ink: "#0F1A17",
  ink2: "#3D4845",
  muted: "#667370",
  faint: "#8C9A95",
  line: "#E4E7E6",
  lineSoft: "#EEF0EF",
  track: "#ECEEED",
  brand: "#087F63",
  brandDeep: "#065A47",
  brandTint: "#E3F1EB",
  brandBorder: "#A9D5C3",
  up: "#067647",
  upTint: "#E3F5EC",
  down: "#C4320A",
  downTint: "#FDEDE8",
  arrival: "#0F1A17",
  arrivalSoft: "#D9DEDC",
  arrivalTint: "#F6F7F6",
  chip: "#F0F2F1",
  fav: "#C81E4A",
  favTint: "#FDEEF2",
};

export const DISPLAY_FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
export const BODY_FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

/** Province identity, carried over from the old racetrack card: colour +
 * traditional pattern, now shown as one calm band instead of 4 marquees. */
export const PROVINCE_THEME: Record<
  string,
  { color: string; pattern: "phulkari" | "ajrak" | "khyber" | "baloch" | "pakistan" }
> = {
  Punjab: { color: "#087F63", pattern: "phulkari" },
  Sindh: { color: "#A61B1B", pattern: "ajrak" },
  KPK: { color: "#0369A1", pattern: "khyber" },
  Balochistan: { color: "#B4470B", pattern: "baloch" },
  Pakistan: { color: "#064E3B", pattern: "pakistan" },
};

/** Only used when comparing rate types: tones that differ in lightness,
 * not a rainbow. Everywhere else rate types are plain text. */
export const COMPARE_TONES = ["#0F1A17", "#087F63", "#8A9894", "#5B7A9A"];

/** Compare lines on the dark emerald card. */
export const COMPARE_TONES_DARK = ["#7CF0C5", "#FFFFFF", "#9CC9F5", "#E9D8A6"];

export const PROVINCES = ["Punjab", "Sindh", "KPK", "Balochistan"] as const;

export const FONT_LINK_ID = "zm-product-rates-fonts";
export const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap";

/** Loads the screen's two web fonts once (falls back to system fonts). */
export function ensureFonts() {
  if (typeof document === "undefined" || document.getElementById(FONT_LINK_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  document.head.appendChild(link);
}
