import { toUrduDigits, URDU_FONT } from "../../shared/i18n/LangProvider";
import { BODY_FONT, DISPLAY_FONT } from "./theme";

export type Lang = "en" | "ur";

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_EN_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_UR = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_EN_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_UR = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];

/** Language-aware formatting helpers, created once per render. */
export function makeFmt(lang: Lang) {
  const ur = lang === "ur";
  const digits = (v: string | number) => (ur ? toUrduDigits(v) : String(v));
  const num = (n: number) => digits(Math.round(n).toLocaleString("en-US"));
  const rs = (n: number) => (ur ? `روپے ${num(n)}` : `Rs ${num(n)}`);
  const pct = (n: number) => `${digits(Math.abs(n).toFixed(1))}%`;
  const parse = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const day = (iso: string, withWeekday = false) => {
    const d = parse(iso);
    const wd = withWeekday ? (ur ? `${DAYS_UR[d.getDay()]}، ` : `${DAYS_EN[d.getDay()]}, `) : "";
    return ur ? `${wd}${digits(d.getDate())} ${MONTHS_UR[d.getMonth()]}` : `${wd}${d.getDate()} ${MONTHS_EN[d.getMonth()]}`;
  };
  const dayYear = (iso: string) => `${day(iso, true)} ${digits(parse(iso).getFullYear())}`;
  const dayFullYear = (iso: string) => {
    const d = parse(iso);
    return ur ? `${digits(d.getDate())} ${MONTHS_UR[d.getMonth()]} ${digits(d.getFullYear())}` : `${d.getDate()} ${MONTHS_EN_FULL[d.getMonth()]} ${d.getFullYear()}`;
  };
  const dayFullWeekdayYear = (iso: string) => {
    const d = parse(iso);
    const wd = ur ? `${DAYS_UR[d.getDay()]}، ` : `${DAYS_EN_FULL[d.getDay()]}, `;
    return ur
      ? `${wd}${digits(d.getDate())} ${MONTHS_UR[d.getMonth()]} ${digits(d.getFullYear())}`
      : `${wd}${d.getDate()} ${MONTHS_EN_FULL[d.getMonth()]} ${d.getFullYear()}`;
  };
  return {
    ur,
    digits,
    num,
    rs,
    pct,
    day,
    dayYear,
    dayFullYear,
    dayFullWeekdayYear,
    /** Pick the English or Urdu string. */
    tx: (en: string, urText: string) => (ur ? urText : en),
    font: ur ? URDU_FONT : BODY_FONT,
    display: ur ? URDU_FONT : DISPLAY_FONT,
    /** Nastaliq needs far more line height than Latin text. */
    lh: ur ? 1.9 : 1.3,
    dir: (ur ? "rtl" : "ltr") as "rtl" | "ltr",
  };
}

export type Fmt = ReturnType<typeof makeFmt>;

export const stripMandi = (s?: string) => (s || "").replace(/\s*(mandi|منڈی)$/i, "").trim();
export const normLoc = (s?: string) => stripMandi(s).toLowerCase();
export const shortRate = (label: string) => (label || "").replace(/\s*(rates?|ریٹس?)$/i, "").trim();

export const signed = (n: number) => (n > 0.05 ? 1 : n < -0.05 ? -1 : 0);
export const arrow = (n: number) => (signed(n) > 0 ? "▲" : signed(n) < 0 ? "▼" : "●");

/**
 * Y-axis convention shared by every chart in the app: prices on a "Rupees"
 * axis; arrivals on a "Bags" axis, counted in thousands only once the scale
 * reaches above 99,999 (e.g. 120,000 bags reads "120" on a "Bags (k)" axis).
 * Otherwise the whole number is represented on the y-axis and "(k)" is omitted.
 */
export type AxisUnit = "rupees" | "bags";
export function axisSpec(f: Fmt, unit: AxisUnit, top: number): { title: string; format: (v: number) => string } {
  if (unit === "rupees") return { title: f.tx("Rs", "روپے"), format: (v) => f.num(v) };
  const k = top > 99999;
  return {
    title: k ? f.tx("Bags (k)", "بوریاں (ہزار)") : f.tx("Bags", "بوریاں"),
    format: (v) => (k ? f.digits(Number((v / 1000).toFixed(0))) : f.num(v)),
  };
}

/** Round tick values (1, 2, 5 × 10ⁿ steps) from 0 up to `top`, at most `count` of them. */
export function niceTicks(top: number, count = 3): number[] {
  if (!(top > 0)) return [];
  const raw = top / (count + 1);
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  const out: number[] = [];
  for (let v = step; v < top && out.length < count + 1; v += step) out.push(v);
  return out;
}
