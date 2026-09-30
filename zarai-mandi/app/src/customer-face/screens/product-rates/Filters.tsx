import type { Fmt } from "./format";
import type { AttrKey } from "./types";

export function attrLabel(f: Fmt, k: AttrKey) {
  const L: Record<AttrKey, [string, string]> = {
    newOld: ["Crop", "فصل"],
    variety: ["Variety", "قسم"],
    moisture: ["Moisture", "نمی"],
    color: ["Color", "رنگ"],
    spec: ["Specification", "خصوصیت"],
    origin: ["Origin", "علاقہ"],
  };
  return f.tx(L[k][0], L[k][1]);
}

export function attrValue(f: Fmt, t: (s: string) => string, k: AttrKey, v: string) {
  if (k === "moisture") return f.digits(v.includes("%") ? v : `${v}%`);
  return t(v);
}
