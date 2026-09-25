import React, { useState, createContext, useContext } from "react";

import { TRANS } from "./translations";
import { AUTO_URDU_DICT } from "./urduDictionary";
import { ZM_THEME_CSS } from "../theme";

export const URDU_FONT = "'Noto Sans Arabic', 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', sans-serif";

// ─── Urdu digit converter helper ──────────────────────────────
export function toUrduDigits(n: number | string): string {
  const urduDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/[0-9]/g, (w) => urduDigits[+w]);
}

export type Lang = "en" | "ur";

export interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  tc: (name: string) => string;
  tm: (mandiName: string) => string;
  tr: (rateType: string) => string;
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
  voiceEnabled: false,
  setVoiceEnabled: () => { },
});

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

  return (
    <>
      <style>{ZM_THEME_CSS}</style>
      <LangContext.Provider
        value={{ lang, setLang, t, tc, tm, tr, voiceEnabled, setVoiceEnabled }}
      >
        {children}
      </LangContext.Provider>
    </>
  );
}
