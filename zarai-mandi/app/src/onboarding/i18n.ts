// Onboarding language: the app-wide language (LangProvider in App.tsx), set on
// the first screen. `L(en, ur)` picks the text; digits stay English in both.
import { URDU_FONT, useLang } from "../customer-face/shared/i18n/LangProvider";

export function useObLang() {
  const { lang, setLang } = useLang();
  const isUr = lang === "ur";
  const L = (en: string, ur: string) => (isUr ? ur : en);
  return { lang, setLang, isUr, L, dir: (isUr ? "rtl" : "ltr") as "rtl" | "ltr", font: isUr ? URDU_FONT : undefined };
}

/** Urdu overrides for the onboarding theme: Urdu font, right-to-left layout. */
export const OB_URDU_CSS = `
  .phone-shell[dir="rtl"], .phone-shell[dir="rtl"] * { font-family: ${URDU_FONT} !important; }
  .phone-shell[dir="rtl"] .headline { line-height: 1.6; }
  .phone-shell[dir="rtl"] input[type="tel"], .phone-shell[dir="rtl"] .ltr { direction: ltr; unicode-bidi: isolate; }
`;
