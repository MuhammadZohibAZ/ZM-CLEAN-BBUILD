import { useState, useMemo } from "react";
import pakistanFlagImg from "../../assets/pakistan_flag.png";

import { LOCATIONS, PROVINCE_CARD_BG } from "../shared/data/mandis";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type LocationScope } from "../shared/types";

//  DEEP VIEW LOCATION SHEET

export function DeepViewLocationSheet({
  current,
  onSelect,
  onClose,
  validMandis,
}: {
  current: LocationScope;
  onSelect: (scope: LocationScope) => void;
  onClose: () => void;
  validMandis?: string[];
}) {
  const { tm, lang } = useLang();
  const USER_DISTRICT = "Sahiwal";
  const USER_PROVINCE = "Punjab";

  type Level = "province" | "district" | "mandi";
  const [level, setLevel] = useState<Level>("province");
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const provinces = Object.keys(LOCATIONS);
  const districts = province ? Object.keys(LOCATIONS[province] || {}) : [];
  const allMandis =
    province && district ? LOCATIONS[province]?.[district] || [] : [];
  // If validMandis provided, only show mandis that have data
  const mandis = validMandis
    ? allMandis.filter((m) => validMandis.includes(m))
    : allMandis;

  // Flat search results across all levels
  const searchResults = useMemo(() => {
    if (search.length < 2) return [];
    const q = search.toLowerCase();
    const out: { kind: LocationScope["kind"]; label: string; hint: string }[] =
      [];
    provinces.forEach((p) => {
      if (p.toLowerCase().includes(q))
        out.push({ kind: "province", label: p, hint: "Province" });
      Object.keys(LOCATIONS[p] || {}).forEach((d) => {
        if (d.toLowerCase().includes(q))
          out.push({ kind: "district", label: d, hint: `${p}` });
        (LOCATIONS[p]?.[d] || []).forEach((m) => {
          if (m.toLowerCase().includes(q)) {
            if (!validMandis || validMandis.includes(m))
              out.push({ kind: "mandi", label: m, hint: `${p} › ${d}` });
          }
        });
      });
    });
    return out.slice(0, 12);
  }, [search, validMandis]);

  const goBack = () => {
    if (level === "mandi") {
      setLevel("district");
      return;
    }
    if (level === "district") {
      setLevel("province");
      setDistrict(null);
      return;
    }
    onClose();
  };

  const breadcrumb =
    level === "province"
      ? ""
      : level === "district"
        ? province || ""
        : `${province} › ${district}`;

  return (
    <div className="zm-sheet-overlay" style={{ zIndex: 200 }} onClick={onClose}>
      <div
        className="zm-sheet-high"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + header */}
        <div
          className="px-5 pt-4 pb-3 flex-shrink-0"
          style={{ borderBottom: "1px solid #D5E2DD" }}
        >
          <div className="zm-drag-handle" />
          <div className="flex items-center gap-2 mb-3">
            {level !== "province" && (
              <button
                onClick={goBack}
                className="tap-target w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#E8EFEC" }}
              >
                ←
              </button>
            )}
            <div className="flex-1">
              <p className="font-bold text-lg">Select Location</p>
              {breadcrumb && (
                <p className="text-xs" style={{ color: "#52635F" }}>
                  {breadcrumb}
                </p>
              )}
            </div>
          </div>
          {/* Quick-select options */}
          {level === "province" && (
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onSelect({ kind: "district", label: USER_DISTRICT })
                  }
                  className="tap-target flex-1 rounded-2xl flex items-center gap-2 px-3"
                  style={{
                    height: 48,
                    background:
                      current.kind === "district" &&
                        current.label === USER_DISTRICT
                        ? "#E4F2EC"
                        : "#F1F7F4",
                    border:
                      current.kind === "district" &&
                        current.label === USER_DISTRICT
                        ? "2px solid #087F63"
                        : "1px solid #D5E2DD",
                  }}
                >
                  <span style={{ fontSize: 18 }}></span>
                  <div className="text-left">
                    <p
                      className="font-bold text-xs"
                      style={{ color: "#075E4F" }}
                    >
                      My District
                    </p>
                    <p className="text-[10px]" style={{ color: "#52635F" }}>
                      {USER_DISTRICT}
                    </p>
                  </div>
                  {current.kind === "district" &&
                    current.label === USER_DISTRICT && (
                      <span
                        className="ml-auto"
                        style={{ color: "#087F63" }}
                      ></span>
                    )}
                </button>
                <button
                  onClick={() =>
                    onSelect({ kind: "province", label: USER_PROVINCE })
                  }
                  className="tap-target flex-1 rounded-2xl flex items-center gap-2 px-3"
                  style={{
                    height: 48,
                    background:
                      current.kind === "province" &&
                        current.label === USER_PROVINCE
                        ? "#E4F2EC"
                        : "#F1F7F4",
                    border:
                      current.kind === "province" &&
                        current.label === USER_PROVINCE
                        ? "2px solid #087F63"
                        : "1px solid #D5E2DD",
                  }}
                >
                  <span style={{ fontSize: 18 }}></span>
                  <div className="text-left">
                    <p
                      className="font-bold text-xs"
                      style={{ color: "#075E4F" }}
                    >
                      My Province
                    </p>
                    <p className="text-[10px]" style={{ color: "#52635F" }}>
                      {USER_PROVINCE}
                    </p>
                  </div>
                  {current.kind === "province" &&
                    current.label === USER_PROVINCE && (
                      <span
                        className="ml-auto"
                        style={{ color: "#087F63" }}
                      ></span>
                    )}
                </button>
              </div>
              <button
                onClick={() => {
                  onSelect({ kind: "pakistan", label: "All Pakistan" });
                  onClose();
                }}
                className="tap-target relative overflow-hidden w-full rounded-2xl flex items-center justify-between px-4 text-left"
                style={{
                  height: 48,
                  backgroundImage: `linear-gradient(${current.kind === "pakistan" ? "rgba(6,77,64,0.85), rgba(8,127,99,0.9)" : "rgba(255,255,255,0.9), rgba(240,249,245,0.92)"}), url(${pakistanFlagImg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: current.kind === "pakistan" ? "2px solid #087F63" : "1px solid #D5E2DD",
                  boxShadow: current.kind === "pakistan" ? "0 4px 14px rgba(8,127,99,0.25)" : "none",
                }}
              >
                <div className="relative z-10 flex items-center gap-3">
                  <img
                    src={pakistanFlagImg}
                    alt="Pakistan Flag"
                    className="w-7 h-5 rounded object-cover shadow-sm border border-white/40"
                  />
                  <span
                    className="font-black text-sm"
                    style={{
                      color: current.kind === "pakistan" ? "#FFFFFF" : "#075E4F",
                      fontFamily:
                        lang === "ur"
                          ? URDU_FONT
                          : "inherit",
                    }}
                  >
                    {lang === "ur" ? "پورا پاکستان" : "All Pakistan"}
                  </span>
                </div>
                {current.kind === "pakistan" && (
                  <div className="relative z-10 w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#087F63] font-bold text-xs">
                    ✓
                  </div>
                )}
              </button>
            </div>
          )}
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-2xl px-3"
            style={{ background: "#E8EFEC", height: 40 }}
          >
            <span style={{ fontSize: 14, opacity: 0.5 }}></span>
            <input
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder="Search province, district or mandi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ color: "#183B34" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="tap-target"
                style={{ fontSize: 14, opacity: 0.5 }}
              ></button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {/* Search results */}
          {search.length >= 2 ? (
            searchResults.length === 0 ? (
              <div
                className="p-6 text-center text-sm"
                style={{ color: "#80918B" }}
              >
                No results for "{search}"
              </div>
            ) : (
              searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelect({ kind: r.kind, label: r.label });
                    onClose();
                  }}
                  className="tap-target w-full flex items-center gap-3 px-5 py-3.5 text-left"
                  style={{ borderBottom: "1px solid #E8EFEC" }}
                >
                  <span style={{ fontSize: 16 }}>
                    {r.kind === "province"
                      ? ""
                      : r.kind === "district"
                        ? ""
                        : ""}
                  </span>
                  <div className="flex-1">
                    <p
                      className="font-semibold text-sm"
                      style={{ color: "#183B34" }}
                    >
                      {r.label}
                    </p>
                    <p className="text-[10px]" style={{ color: "#80918B" }}>
                      {r.hint}
                    </p>
                  </div>
                  {current.kind === r.kind && current.label === r.label && (
                    <span style={{ color: "#087F63" }}></span>
                  )}
                </button>
              ))
            )
          ) : level === "province" ? (
            <div className="px-4 pb-4 pt-2">
              <div className="px-1 pb-2">
                <p
                  className="text-[10.5px] font-extrabold uppercase tracking-wider"
                  style={{ color: "#52635F" }}
                >
                  {lang === "ur" ? "صوبہ اور روایت منتخب کریں" : "Select Province (Tradition & Region)"}
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {provinces.map((p) => {
                  const isSelected = current.kind === "province" && current.label === p;
                  const pConfig: Record<string, {
                    pattern?: "phulkari" | "ajrak" | "khyber" | "baloch";
                    traditionUr?: string;
                    traditionEn?: string;
                    cardBg: string;
                    borderColor: string;
                    accentColor: string;
                  }> = {
                    Punjab: {
                      cardBg: PROVINCE_CARD_BG.Punjab,
                      borderColor: "#087F63",
                      accentColor: "#087F63",
                    },
                    Sindh: {
                      cardBg: PROVINCE_CARD_BG.Sindh,
                      borderColor: "#DC2626",
                      accentColor: "#DC2626",
                    },
                    KPK: {
                      cardBg: PROVINCE_CARD_BG.KPK,
                      borderColor: "#0284C7",
                      accentColor: "#0284C7",
                    },
                    Balochistan: {
                      cardBg: PROVINCE_CARD_BG.Balochistan,
                      borderColor: "#EA580C",
                      accentColor: "#EA580C",
                    },
                  };
                  const cfg = pConfig[p] || pConfig.Punjab;

                  return (
                    <button
                      key={p}
                      onClick={() => {
                        onSelect({ kind: "province", label: p });
                        onClose();
                      }}
                      className="tap-target relative overflow-hidden rounded-2xl p-3 flex flex-col justify-between text-left transition active:scale-[0.98] shadow-md"
                      style={{
                        backgroundImage: `linear-gradient(${isSelected ? "rgba(0,0,0,0.18), rgba(0,0,0,0.50)" : "rgba(0,0,0,0.22), rgba(0,0,0,0.52)"}), url(${cfg.cardBg})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: isSelected ? "2.5px solid #FFFFFF" : `1.5px solid ${cfg.borderColor}`,
                        boxShadow: isSelected ? `0 0 0 2px ${cfg.accentColor}, 0 4px 14px rgba(0,0,0,0.25)` : "0 2px 8px rgba(0,0,0,0.12)",
                        minHeight: 68,
                        cursor: "pointer",
                      }}
                    >
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 900,
                            color: "#FFFFFF",
                            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                            fontFamily:
                              lang === "ur"
                                ? URDU_FONT
                                : "inherit",
                          }}
                        >
                          {tm(p)}
                        </span>

                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                            color: cfg.accentColor,
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {isSelected ? "✓" : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : level === "district" ? (
            <>
              {province && (
                <button
                  onClick={() => {
                    onSelect({ kind: "province", label: province });
                    onClose();
                  }}
                  className="tap-target w-full flex items-center gap-2 px-5 py-3 text-left"
                  style={{
                    background:
                      current.kind === "province" && current.label === province
                        ? "#E4F2EC"
                        : "#F1F7F4",
                    borderBottom: "1px solid #D5E2DD",
                  }}
                >
                  <span style={{ fontSize: 16 }}></span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: "#075E4F" }}
                  >
                    All of {tm(province || "")}
                  </span>
                  {current.kind === "province" &&
                    current.label === province && (
                      <span
                        className="ml-auto"
                        style={{ color: "#087F63" }}
                      ></span>
                    )}
                </button>
              )}
              {districts.map((d) => {
                const on = current.kind === "district" && current.label === d;
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setDistrict(d);
                      setLevel("mandi");
                    }}
                    className="tap-target w-full flex items-center gap-3 px-5 py-4 text-left"
                    style={{
                      borderBottom: "1px solid #E8EFEC",
                      background: on ? "#EAF5F1" : "transparent",
                    }}
                  >
                    <span
                      className="flex-1 font-semibold text-sm"
                      style={{ color: on ? "#147D72" : "#183B34" }}
                    >
                      {d}
                    </span>
                    <span style={{ color: "#80918B", fontSize: 18 }}>›</span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {district && (
                <button
                  onClick={() => {
                    onSelect({ kind: "district", label: district });
                    onClose();
                  }}
                  className="tap-target w-full flex items-center gap-2 px-5 py-3 text-left"
                  style={{
                    background:
                      current.kind === "district" && current.label === district
                        ? "#EAF5F1"
                        : "#F1F7F4",
                    borderBottom: "1px solid #D5E2DD",
                  }}
                >
                  <span style={{ fontSize: 16 }}></span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: "#147D72" }}
                  >
                    All of {tm(district || "")} District
                  </span>
                  {current.kind === "district" &&
                    current.label === district && (
                      <span
                        className="ml-auto"
                        style={{ color: "#147D72" }}
                      ></span>
                    )}
                </button>
              )}
              {mandis.map((m) => {
                const on = current.kind === "mandi" && current.label === m;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      onSelect({ kind: "mandi", label: m });
                      onClose();
                    }}
                    className="tap-target w-full flex items-center gap-3 px-5 py-4 text-left"
                    style={{
                      borderBottom: "1px solid #E8EFEC",
                      background: on ? "#EAF5F1" : "transparent",
                    }}
                  >
                    <span style={{ fontSize: 16 }}></span>
                    <span
                      className="flex-1 font-semibold text-sm"
                      style={{ color: on ? "#168A76" : "#183B34" }}
                    >
                      {m}
                    </span>
                    {on && <span style={{ color: "#168A76" }}></span>}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
