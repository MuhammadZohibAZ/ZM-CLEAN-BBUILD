// Downloads the app's web fonts soon after start-up (App.tsx calls it once the
// first screen is up), before any other screen needs them.
//
// A browser only fetches a font when text first uses it, so a screen opened
// for the first time drew in the fallback font (looking bolder) and then
// swapped to the real one: the by-product screen even stayed on the fallback
// until a rates screen had been opened. The @font-face rules come from the
// stylesheet in index.html (and src/index.css for the local Urdu fonts).

// [family, weights] for every font the screens draw with.
const LATIN: [string, number[]][] = [
  ["Plus Jakarta Sans", [500, 600, 700, 800]], // by-product, rates, mandi screens
  ["Inter", [400, 500, 600, 700]], // Home, onboarding
  ["Poppins", [400, 500, 600, 700, 800]], // headings, buttons
];
const URDU: [string, number[]][] = [
  ["Noto Sans Arabic", [400, 700]],
  ["Noto Nastaliq Urdu", [400, 700]],
];

function load(fonts: [string, number[]][], sample: string) {
  return Promise.all(
    fonts.flatMap(([family, weights]) =>
      weights.map((w) => document.fonts.load(`${w} 16px "${family}"`, sample).catch(() => [])),
    ),
  );
}

/** The Google Fonts stylesheet from index.html, once its @font-face rules are in. */
function stylesheetReady(): Promise<void> {
  const link = document.querySelector<HTMLLinkElement>('link[href*="fonts.googleapis.com/css2"]');
  if (!link || link.sheet) return Promise.resolve();
  return new Promise((resolve) => {
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
  });
}

export function preloadFonts(): void {
  if (typeof document === "undefined" || !document.fonts) return;
  void stylesheetReady().then(() => {
    void load(LATIN, "Wheat Rs 4,584");
    // The Urdu fonts are large (the Arabic one ~0.8 MB): fetch them when the
    // browser is idle, so they don't compete with the first screen.
    window.setTimeout(() => void load(URDU, "گندم ۴۵۸۴ روپے"), 3000);
  });
}
