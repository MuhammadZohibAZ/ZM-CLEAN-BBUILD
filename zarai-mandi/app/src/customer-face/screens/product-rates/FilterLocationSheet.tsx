import { useMemo, useState } from "react";

import type { LocationScope } from "../../shared/types";
import { normLoc, stripMandi, type Fmt } from "./format";
import { C } from "./theme";
import type { MarketRow } from "./types";
import { BottomSheet, Icon, Segmented } from "./ui";

type Level = "province" | "district" | "mandi";
type Place = { kind: Level; label: string; name: string; meta: string; search: string };

const PAKISTAN: LocationScope = { kind: "pakistan", label: "All Pakistan" };

/**
 * The filter rail's location picker, in the same list style as its rate and
 * day pickers: All Pakistan, then provinces, districts or mandis that reported
 * this by-product, with a search across all three.
 */
export function FilterLocationSheet({
  f,
  tm,
  rows,
  value,
  onPick,
  onClose,
}: {
  f: Fmt;
  tm: (s: string) => string;
  rows: MarketRow[];
  value: LocationScope;
  onPick: (scope: LocationScope) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level>(value.kind === "pakistan" ? "province" : value.kind);

  const places = useMemo(() => {
    const prov = new Map<string, Set<string>>();
    const dist = new Map<string, { province: string; mandis: Set<string> }>();
    const mandi = new Map<string, { district: string; province: string }>();
    for (const r of rows) {
      if (!r.mandiName) continue;
      if (r.province) prov.set(r.province, (prov.get(r.province) || new Set()).add(r.mandiName));
      if (r.district) {
        const d = dist.get(r.district) || { province: r.province, mandis: new Set<string>() };
        d.mandis.add(r.mandiName);
        dist.set(r.district, d);
      }
      if (!mandi.has(r.mandiName)) mandi.set(r.mandiName, { district: r.district, province: r.province });
    }
    const count = (n: number) => f.tx(`${n} mandi${n === 1 ? "" : "s"}`, `${f.digits(n)} منڈیاں`);
    const byName = (a: Place, b: Place) => a.name.localeCompare(b.name);
    const list = (xs: Place[]) => xs.sort(byName);
    return {
      province: list(
        [...prov].map(([p, ms]) => ({ kind: "province" as const, label: p, name: tm(p), meta: count(ms.size), search: `${p} ${tm(p)}` })),
      ),
      district: list(
        [...dist].map(([d, x]) => ({
          kind: "district" as const,
          label: d,
          name: tm(d),
          meta: `${tm(x.province)} · ${count(x.mandis.size)}`,
          search: `${d} ${tm(d)}`,
        })),
      ),
      mandi: list(
        [...mandi].map(([m, x]) => ({
          kind: "mandi" as const,
          label: m,
          name: tm(stripMandi(m)),
          meta: [tm(x.district), tm(x.province)].filter(Boolean).join(" · "),
          search: `${m} ${tm(m)} ${x.district}`,
        })),
      ),
    };
  }, [rows, f, tm]);

  const q = query.trim().toLowerCase();
  const levelName = (k: Level) => (k === "province" ? f.tx("Province", "صوبہ") : k === "district" ? f.tx("District", "ضلع") : f.tx("Mandi", "منڈی"));
  const shown: Place[] = q
    ? [...places.province, ...places.district, ...places.mandi]
        .filter((p) => p.search.toLowerCase().includes(q))
        .map((p) => ({ ...p, meta: `${levelName(p.kind)} · ${p.meta}` }))
        .slice(0, 60)
    : places[level];
  const isOn = (kind: LocationScope["kind"], label: string) => value.kind === kind && normLoc(value.label) === normLoc(label);

  const choose = (scope: LocationScope) => {
    onPick(scope);
    onClose();
  };

  const row = (key: string, label: string, meta: string | undefined, on: boolean, onClick: () => void, k: number) => (
    <button
      key={key}
      type="button"
      role="option"
      aria-selected={on}
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 16px",
        border: "none",
        borderTop: k ? `1px solid ${C.lineSoft}` : "none",
        background: C.surface,
        textAlign: "start",
        fontFamily: f.font,
        color: C.ink,
      }}
    >
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1, padding: "8px 0" }}>
        <span style={{ fontSize: 15, fontWeight: on ? 700 : 500, lineHeight: f.lh }}>{label}</span>
        {meta && <span style={{ fontSize: 12.5, fontWeight: 500, color: C.muted, lineHeight: f.lh }}>{meta}</span>}
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: on ? "none" : `1.5px solid ${C.line}`,
          background: on ? C.brand : "transparent",
        }}
      >
        {on && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
    </button>
  );

  return (
    <BottomSheet onClose={onClose} title={f.tx("Location", "مقام")} dir={f.dir} font={f.font} display={f.display}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 46,
            padding: "0 14px",
            borderRadius: 14,
            background: C.surface,
            border: `1px solid ${C.line}`,
          }}
        >
          <Icon name="search" size={16} width={2.4} color={C.muted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={f.tx("Search province, district or mandi", "صوبہ، ضلع یا منڈی تلاش کریں")}
            aria-label={f.tx("Search locations", "مقام تلاش کریں")}
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 500, color: C.ink, fontFamily: f.font }}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label={f.tx("Clear", "صاف کریں")} style={{ border: "none", background: "transparent", padding: 4, display: "flex" }}>
              <Icon name="close" size={14} width={2.6} color={C.muted} />
            </button>
          )}
        </label>

        {!q && (
          <Segmented
            label={f.tx("Location level", "مقام کی سطح")}
            value={level}
            onChange={setLevel}
            font={f.font}
            options={(["province", "district", "mandi"] as Level[]).map((k) => ({ id: k, label: levelName(k), color: C.brand }))}
          />
        )}

        <div role="listbox" aria-label={f.tx("Location", "مقام")} style={{ borderRadius: 18, background: C.surface, overflow: "hidden" }}>
          {!q && row("pk", f.tx("All Pakistan", "پورا پاکستان"), undefined, value.kind === "pakistan", () => choose(PAKISTAN), 0)}
          {shown.map((p, k) => row(`${p.kind}|${p.label}`, p.name, p.meta, isOn(p.kind, p.label), () => choose({ kind: p.kind, label: p.label }), q ? k : k + 1))}
          {shown.length === 0 && (
            <p style={{ margin: 0, padding: "16px", fontSize: 14, color: C.muted }}>{f.tx("No location found", "کوئی مقام نہیں ملا")}</p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
