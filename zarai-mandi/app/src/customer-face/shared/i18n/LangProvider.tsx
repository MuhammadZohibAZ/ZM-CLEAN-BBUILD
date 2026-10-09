import React, { useState, createContext, useContext } from "react";

import { TRANS } from "./translations";
import { AUTO_URDU_DICT } from "./urduDictionary";
import { ZM_THEME_CSS } from "../theme";

export const URDU_FONT = "'Noto Sans Arabic', 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', sans-serif";

// ─── Numbers in Urdu text ─────────────────────────────────────
// Urdu screens use English digits (0-9): they read more clearly than the
// Urdu numeral glyphs in our Nastaliq font. Kept as a function so every
// number in Urdu text still goes through one place.
export function toUrduDigits(n: number | string): string {
  return String(n);
}

export type Lang = "en" | "ur";

export interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  tc: (name: string) => string;
  tm: (mandiName: string) => string;
  tr: (rateType: string) => string;
  /** A person's name in the current language (saved names can be in either script). */
  tn: (name: string) => string;
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;
}

export const LangContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => { },
  t: (k) => TRANS[k]?.en ?? (AUTO_URDU_DICT[k] || k),
  tc: (n) => n,
  tm: (m) => m,
  tr: (r) => r,
  tn: (n) => personName(n, "en"),
  voiceEnabled: false,
  setVoiceEnabled: () => { },
});

// Urdu -> English for names saved in Urdu, so they read in English too.
let URDU_TO_EN: Map<string, string> | null = null;
function personName(name: string, lang: Lang): string {
  const n = (name || "").trim();
  if (!n) return "";
  if (lang === "ur") return AUTO_URDU_DICT[n] || n;
  if (!/[\u0600-\u06FF]/.test(n)) return n;
  if (!URDU_TO_EN) {
    URDU_TO_EN = new Map();
    for (const [en, ur] of Object.entries(AUTO_URDU_DICT)) if (!URDU_TO_EN.has(ur)) URDU_TO_EN.set(ur, en);
  }
  return URDU_TO_EN.get(n) || n;
}

export function useLang() {
  return useContext(LangContext);
}

// Module-level lang for speakText (synced by LangProvider)
export let appLang: Lang = "en";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [voiceEnabled, setVoiceEnabledState] = useState(false);

  const setVoiceEnabled = (v: boolean) => {
    setVoiceEnabledState(v);
    if (!v && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const setLang = (l: Lang) => {
    setLangState(l);
    appLang = l;
  };

  const t = (key: string): string => {
    if (!key) return "";
    if (TRANS[key]?.[lang]) return TRANS[key][lang];
    if (lang === "ur") {
      return AUTO_URDU_DICT[key] || AUTO_URDU_DICT[key.trim()] || key;
    }
    return TRANS[key]?.en || key;
  };

  const tc = (name: string): string => {
    if (!name) return "";
    if (lang === "en") return name;
    return (
      TRANS[`c.${name}`]?.ur ||
      AUTO_URDU_DICT[name] ||
      AUTO_URDU_DICT[name.trim()] ||
      name
    );
  };

  const tm = (mandiName: string): string => {
    if (!mandiName) return "";
    if (lang === "en") return mandiName;
    const trimmed = mandiName.trim();
    if (AUTO_URDU_DICT[trimmed]) return AUTO_URDU_DICT[trimmed];

    const stripped = trimmed
      .replace(/\s*mandi\s*/gi, "")
      .replace(/\s*grain market\s*/gi, "")
      .replace(/\s*منڈی\s*/g, "")
      .trim();

    if (AUTO_URDU_DICT[stripped]) {
      const isMandi = /mandi/i.test(trimmed) || /منڈی/.test(trimmed);
      return isMandi ? `${AUTO_URDU_DICT[stripped]} منڈی` : AUTO_URDU_DICT[stripped];
    }
    return AUTO_URDU_DICT[trimmed] || trimmed;
  };

  const tr = (rateType: string): string => {
    if (!rateType) return "";
    if (lang === "en") return rateType;
    return (
      TRANS[`rate.${rateType}`]?.ur ||
      AUTO_URDU_DICT[rateType] ||
      AUTO_URDU_DICT[rateType.trim()] ||
      rateType
    );
  };

  const tn = (name: string): string => personName(name, lang);

  return (
    <>
      <style>{ZM_THEME_CSS}</style>
      <LangContext.Provider
        value={{ lang, setLang, t, tc, tm, tr, tn, voiceEnabled, setVoiceEnabled }}
      >
        {children}
      </LangContext.Provider>
    </>
  );
}
