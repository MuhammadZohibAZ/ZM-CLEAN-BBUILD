import { useState } from "react";
import pakistanFlagImg from "../../assets/pakistan_flag.png";

import { LOCATIONS, PROVINCE_CARD_BG } from "../shared/data/mandis";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type LocationScope } from "../shared/types";
import { speakText } from "../shared/voice";

// ─── MULTI-LOCATION SHEET WITH ACCORDION LAYOUT & WHOLE COUNTRY OPTION ──────
export function MultiLocSheet({
  selected,
  onApply,
  onClose,
  singleSelect = false,
  multiProvince = false,
  dataMandiNames,
}: {
  selected: { kind: LocationScope["kind"]; label: string }[];
  onApply: (locs: { kind: LocationScope["kind"]; label: string }[]) => void;
  onClose: () => void;
  singleSelect?: boolean;
  /** Several provinces can be selected together (used by Compare). */
  multiProvince?: boolean;
  // Real mandi/district names (lowercased) that have data for whatever
  // by-product this picker was opened from. When provided, locations with
  // data are listed first and ones without are pushed down and marked --
  // never hidden, so a user can still pick one and see it's empty.
  dataMandiNames?: Set<string>;
}) {
  const { lang, voiceEnabled, tm: tmL } = useLang();
  const [draft, setDraft] = useState(selected);
  const [selectedProvince, setSelectedProvince] = useState<string>("Punjab");
  const [distSearch, setDistSearch] = useState("");
  const [expandedDistricts, setExpandedDistricts] = useState<
    Record<string, boolean>
  >({
    Lahore: true,
    Multan: true,
    Faisalabad: true,
  });

  const isWholeCountrySelected =
    draft.length === 0 || draft.some((x) => x.kind === "pakistan");

  const mandiHasData = (mName: string) =>
    !dataMandiNames || dataMandiNames.has(mName.toLowerCase().trim());
  const districtHasData = (province: string, d: string) =>
    !dataMandiNames ||
    dataMandiNames.has(d.toLowerCase().trim()) ||
    (LOCATIONS[province]?.[d] || []).some((m) => mandiHasData(m));

  const provinces = Object.keys(LOCATIONS);
  const availableDistricts = Object.keys(LOCATIONS[selectedProvince] || {});
  const filteredDistricts = availableDistricts
    .filter((d) => {
      if (!distSearch) return true;
      const q = distSearch.toLowerCase();
      if (d.toLowerCase().includes(q)) return true;
      const mandis = LOCATIONS[selectedProvince]?.[d] || [];
      return mandis.some((m) => m.toLowerCase().includes(q));
    })
    // Districts reporting this by-product first, districts with none pushed
    // to the bottom (still shown -- picking one confirms "no data" rather
    // than pretending the option doesn't exist).
    .sort((a, b) => {
      const ad = districtHasData(selectedProvince, a) ? 0 : 1;
      const bd = districtHasData(selectedProvince, b) ? 0 : 1;
      return ad - bd;
    });

  const toggleWholeCountry = () => {
    setDraft([{ kind: "pakistan", label: "All Pakistan" }]);
    if (voiceEnabled) {
      speakText(
        lang === "ur"
          ? "پورا پاکستان منتخب کیا گیا۔"
          : "Whole country selected.",
      );
    }
  };

  const toggleProvince = (p: string) => {
    if (singleSelect) {
      setDraft([{ kind: "province", label: p }]);
      if (voiceEnabled) {
        speakText(lang === "ur" ? `صوبہ ${tmL(p)} منتخب کیا گیا` : `${p} Province selected`);
      }
      setSelectedProvince(p);
      return;
    }
    const isAlready = draft.some(
      (x) => x.kind === "province" && x.label === p,
    );
    if (multiProvince) {
      const next = isAlready
        ? draft.filter((x) => !(x.kind === "province" && x.label === p))
        : [...draft.filter((x) => x.kind !== "pakistan"), { kind: "province" as const, label: p }];
      setDraft(next.length ? next : [{ kind: "pakistan", label: "All Pakistan" }]);
      if (voiceEnabled) {
        speakText(lang === "ur" ? `صوبہ ${tmL(p)}` : `${p} Province ${isAlready ? "removed" : "added"}`);
      }
      setSelectedProvince(p);
      return;
    }
    if (isAlready) {
      setDraft([{ kind: "pakistan", label: "All Pakistan" }]);
      if (voiceEnabled) {
        speakText(lang === "ur" ? "پورا پاکستان منتخب کیا گیا۔" : "All Pakistan selected.");
      }
    } else {
      setDraft([{ kind: "province", label: p }]);
      if (voiceEnabled) {
        speakText(lang === "ur" ? `صوبہ ${tmL(p)} منتخب کیا گیا` : `${p} Province selected`);
      }
    }
    setSelectedProvince(p);
  };

  const toggleDistrictAccordion = (d: string) => {
    setExpandedDistricts((prev) => ({ ...prev, [d]: !prev[d] }));
    if (voiceEnabled) {
      speakText(lang === "ur" ? `ضلع ${tmL(d)}` : `${d} District`);
    }
  };

  const toggleMandi = (mName: string, _distName: string) => {
    const formattedName = mName.toLowerCase().includes("mandi") ? mName : `${mName} Mandi`;
    if (singleSelect) {
      setDraft([{ kind: "mandi", label: formattedName }]);
      if (voiceEnabled) {
        speakText(lang === "ur" ? `${tmL(mName)} منڈی` : `${mName} Mandi`);
      }
      return;
    }
    const isAlready = draft.some((x) => x.label === mName || x.label === formattedName);
    if (isAlready) {
      setDraft((prev) => prev.filter((x) => x.label !== mName && x.label !== formattedName));
      if (voiceEnabled) {
        speakText(lang === "ur" ? `${tmL(mName)} منڈی ہٹا دی گئی` : `${mName} Mandi unselected`);
      }
    } else {
      setDraft((prev) => [
        ...prev.filter((x) => x.kind !== "pakistan"),
        { kind: "mandi", label: formattedName },
      ]);
      if (voiceEnabled) {
        speakText(lang === "ur" ? `${tmL(mName)} منڈی` : `${mName} Mandi`);
      }
    }
  };

  const toggleSelectAllInDistrict = (
    distName: string,
    mandiList: string[],
  ) => {
    if (singleSelect) return;
    const allSelected = mandiList.every((m) =>
      draft.some((x) => x.label === m || x.label === `${m} Mandi`),
    );
    if (allSelected) {
      setDraft((prev) => prev.filter((x) => !mandiList.includes(x.label) && !mandiList.some((m) => x.label === `${m} Mandi`)));
      if (voiceEnabled) {
        speakText(lang === "ur" ? `ضلع ${tmL(distName)} کی منڈیاں غیر منتخب` : `Mandis in ${distName} unselected`);
      }
    } else {
      const toAdd = mandiList
        .filter((m) => !draft.some((x) => x.label === m || x.label === `${m} Mandi`))
        .map((m) => ({ kind: "mandi" as const, label: `${m} Mandi` }));
      setDraft((prev) => [
        ...prev.filter((x) => x.kind !== "pakistan"),
        ...toAdd,
      ]);
      if (voiceEnabled) {
        speakText(lang === "ur" ? `ضلع ${tmL(distName)} کی تمام منڈیاں منتخب` : `All mandis in ${distName} selected`);
      }
    }
  };

  const isMandiSelected = (mName: string) => {
    const cleanTarget = mName.toLowerCase().replace(/\s*(mandi|منڈی)$/i, "").trim();
    return draft.some((x) => {
      if (x.kind !== "mandi") return false;
      const cleanX = x.label.toLowerCase().replace(/\s*(mandi|منڈی)$/i, "").trim();
      return cleanX === cleanTarget || cleanX === mName.toLowerCase().trim();
    });
  };
  const isProvSelected = (p: string) =>
    draft.some((x) => x.kind === "province" && x.label.toLowerCase().trim() === p.toLowerCase().trim());

  return (
    <div
      className="zm-sheet-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        background: "rgba(5, 25, 18, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="zm-sheet-high"
        style={{
          background: "#F4FAF7",
          maxHeight: "72vh",
          height: "auto",
          width: "100%",
          maxWidth: "448px",
          display: "flex",
          flexDirection: "column",
          borderRadius: "26px 26px 0 0",
          boxShadow: "0 -10px 36px rgba(6,77,64,0.25)",
          position: "relative",
          zIndex: 10000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + title */}
        <div
          className="px-4 pt-3 pb-2 flex-shrink-0"
          style={{ borderBottom: "1px solid #D5E2DD" }}
        >
          <div
            className="w-10 h-1 rounded-full mx-auto mb-2"
            style={{ background: "#C7D6D0" }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p
                className="font-extrabold text-[16px]"
                style={{ color: "#183B34" }}
              >
                {lang === "ur" ? "مقام کا فلٹر" : "Location Filter"}
              </p>
            </div>
            {draft.length > 0 && !isWholeCountrySelected && (
              <button
                onClick={() => {
                  toggleWholeCountry();
                }}
                className="tap-target text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: "#E8EFEC", color: "#087F63" }}
              >
                {lang === "ur" ? "ری سیٹ" : "Reset"}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Universal Search Bar at TOP */}
          <div style={{ marginBottom: 10 }}>
            <label
              style={{
                display: "block",
                fontSize: 10.5,
                fontWeight: 700,
                color: "#52635F",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {lang === "ur"
                ? "منڈی یا ضلع تلاش کریں"
                : "Search Any Mandi or District"}
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                border: "1.5px solid #D5E2DD",
                borderRadius: 12,
                padding: "7px 10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <span style={{ fontSize: 15, color: "#087F63" }}>⌕</span>
              <input
                type="text"
                placeholder={
                  lang === "ur"
                    ? "مثال: جڑانوالہ، بادامی باغ، فیصل آباد..."
                    : "e.g. Badami Bagh, Faisalabad, Multan..."
                }
                value={distSearch}
                onChange={(e) => setDistSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: 12.5,
                  color: "#183B34",
                  background: "transparent",
                }}
              />
              {distSearch && (
                <button
                  type="button"
                  onClick={() => setDistSearch("")}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#80918B",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Select: Whole Country (All Pakistan) Card with Cultural Flag */}
          <div style={{ marginBottom: 10 }}>
            <button
              type="button"
              onClick={toggleWholeCountry}
              className="tap-target relative overflow-hidden w-full text-left"
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: isWholeCountrySelected
                  ? "2px solid #087F63"
                  : "1.5px solid #D5E2DD",
                backgroundImage: `linear-gradient(${isWholeCountrySelected ? "rgba(6,77,64,0.85), rgba(8,127,99,0.9)" : "rgba(255,255,255,0.88), rgba(240,249,245,0.92)"}), url(${pakistanFlagImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                boxShadow: isWholeCountrySelected
                  ? "0 4px 14px rgba(8,127,99,0.25)"
                  : "0 2px 6px rgba(0,0,0,0.04)",
                transition: "all 0.15s",
              }}
            >
              <div className="relative z-10 flex items-center gap-2.5">
                <img
                  src={pakistanFlagImg}
                  alt="Pakistan Flag"
                  className="w-6 h-4 rounded object-cover shadow-sm border border-white/40"
                />
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 900,
                      color: isWholeCountrySelected ? "#FFFFFF" : "#183B34",
                      fontFamily:
                        lang === "ur"
                          ? URDU_FONT
                          : "inherit",
                    }}
                  >
                    {lang === "ur"
                      ? "پورا پاکستان"
                      : "All Pakistan"}
                  </div>
                </div>
              </div>

              <div
                className="relative z-10"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: isWholeCountrySelected
                    ? "2px solid #FFFFFF"
                    : "1.5px solid #C7D6D0",
                  background: isWholeCountrySelected ? "#FFFFFF" : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#087F63",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {isWholeCountrySelected ? "✓" : ""}
              </div>
            </button>
          </div>

          {/* Unified Container Box for Province Tabs & Mandis/Districts */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #D5E2DD",
              borderRadius: 14,
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              boxShadow: "0 2px 8px rgba(6,77,64,0.04)",
              marginBottom: 10,
            }}
          >
            {/* Province Cultural Selector Cards in 2x2 Grid */}
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: "#52635F",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                {lang === "ur" ? "صوبہ منتخب کریں" : "Select Province"}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                {provinces.map((p) => {
                  const isSelectedInDraft = isProvSelected(p);
                  const pConfig: Record<string, {
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
                      type="button"
                      onClick={() => toggleProvince(p)}
                      className="tap-target relative overflow-hidden rounded-xl p-2.5 flex flex-col justify-between text-left transition active:scale-[0.98] shadow-sm"
                      style={{
                        backgroundImage: `linear-gradient(${isSelectedInDraft ? "rgba(0,0,0,0.18), rgba(0,0,0,0.50)" : "rgba(0,0,0,0.22), rgba(0,0,0,0.52)"}), url(${cfg.cardBg})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: isSelectedInDraft ? "2px solid #FFFFFF" : `1.2px solid ${cfg.borderColor}`,
                        boxShadow: isSelectedInDraft ? `0 0 0 2px ${cfg.accentColor}, 0 4px 12px rgba(0,0,0,0.25)` : "0 2px 6px rgba(0,0,0,0.1)",
                        minHeight: 56,
                        cursor: "pointer",
                      }}
                    >
                      {/* Header with Province Title and White Circle Checkmark */}
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: "#FFFFFF",
                            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                            fontFamily:
                              lang === "ur"
                                ? URDU_FONT
                                : "inherit",
                          }}
                        >
                          {tmL(p)}
                        </span>

                        {/* White Circular Checkbox: Ticked only if selected */}
                        <div
                          style={{
                            width: 19,
                            height: 19,
                            borderRadius: "50%",
                            background: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                            color: cfg.accentColor,
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          {isSelectedInDraft ? "✓" : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 1, background: "#E8EFEC" }} />

            {/* Districts & Mandis inside Unified Box */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: "#52635F",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {lang === "ur"
                    ? "اضلاع اور منڈیاں"
                    : "Districts & Mandis"}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: "#087F63",
                    fontWeight: 700,
                    fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                  }}
                >
                  {isWholeCountrySelected
                    ? (lang === "ur" ? "پورا پاکستان فعال" : "All Pakistan active")
                    : (lang === "ur"
                      ? `${draft.length} فلٹر فعال`
                      : `${draft.length} filter${draft.length !== 1 ? "s" : ""} active`)}
                </span>
              </div>

              <div
                style={{
                  maxHeight: 280,
                  minHeight: 160,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  scrollbarWidth: "thin",
                  paddingRight: 2,
                }}
              >
                {filteredDistricts.map((d) => {
                  const isDistExpanded = !!expandedDistricts[d];
                  const distProvince =
                    Object.keys(LOCATIONS).find((p) => LOCATIONS[p]?.[d]) ||
                    selectedProvince ||
                    "Punjab";

                  const PROV_COLOR_CONFIG: Record<string, {
                    nameUr: string;
                    nameEn: string;
                    accent: string;
                    gradientStrip: string;
                    lightBg: string;
                    cardTint: string;
                    selectedBg: string;
                    borderNormal: string;
                    borderActive: string;
                    badgeBg: string;
                  }> = {
                    Punjab: {
                      nameUr: "پنجاب",
                      nameEn: "Punjab",
                      accent: "#087F63",
                      gradientStrip: "linear-gradient(90deg, #033D31 0%, #087F63 50%, #033D31 100%)",
                      lightBg: "#F0F8F4",
                      cardTint: "rgba(8, 127, 99, 0.08)",
                      selectedBg: "#E2F5EC",
                      borderNormal: "rgba(8, 127, 99, 0.35)",
                      borderActive: "#087F63",
                      badgeBg: "rgba(8, 127, 99, 0.14)",
                    },
                    Sindh: {
                      nameUr: "سندھ",
                      nameEn: "Sindh",
                      accent: "#DC2626",
                      gradientStrip: "linear-gradient(90deg, #5C0B14 0%, #DC2626 50%, #5C0B14 100%)",
                      lightBg: "#FEF2F2",
                      cardTint: "rgba(220, 38, 38, 0.08)",
                      selectedBg: "#FEE2E2",
                      borderNormal: "rgba(220, 38, 38, 0.35)",
                      borderActive: "#DC2626",
                      badgeBg: "rgba(220, 38, 38, 0.14)",
                    },
                    KPK: {
                      nameUr: "خیبر پختونخوا",
                      nameEn: "KPK",
                      accent: "#0284C7",
                      gradientStrip: "linear-gradient(90deg, #0C4A6E 0%, #0284C7 50%, #0C4A6E 100%)",
                      lightBg: "#F0F9FF",
                      cardTint: "rgba(2, 132, 199, 0.08)",
                      selectedBg: "#E0F2FE",
                      borderNormal: "rgba(2, 132, 199, 0.35)",
                      borderActive: "#0284C7",
                      badgeBg: "rgba(2, 132, 199, 0.14)",
                    },
                    Balochistan: {
                      nameUr: "بلوچستان",
                      nameEn: "Balochistan",
                      accent: "#EA580C",
                      gradientStrip: "linear-gradient(90deg, #7C2D12 0%, #EA580C 50%, #7C2D12 100%)",
                      lightBg: "#FFF7ED",
                      cardTint: "rgba(234, 88, 12, 0.08)",
                      selectedBg: "#FFEDD5",
                      borderNormal: "rgba(234, 88, 12, 0.35)",
                      borderActive: "#EA580C",
                      badgeBg: "rgba(234, 88, 12, 0.14)",
                    },
                  };

                  const pTheme = PROV_COLOR_CONFIG[distProvince] || PROV_COLOR_CONFIG.Punjab;
                  // Mandis with data for this by-product first, ones
                  // without pushed to the bottom (still selectable).
                  const mandiList = [...(LOCATIONS[distProvince]?.[d] || LOCATIONS[selectedProvince]?.[d] || [])].sort(
                    (a, b) => (mandiHasData(a) ? 0 : 1) - (mandiHasData(b) ? 0 : 1)
                  );
                  const selectedInDistrictCount = mandiList.filter((m) =>
                    isMandiSelected(m),
                  ).length;
                  const allInDistrictSelected =
                    mandiList.length > 0 &&
                    selectedInDistrictCount === mandiList.length;

                  return (
                    <div
                      key={d}
                      style={{
                        flexShrink: 0,
                        background: selectedInDistrictCount > 0 ? pTheme.selectedBg : pTheme.lightBg,
                        border:
                          selectedInDistrictCount > 0
                            ? `1.8px solid ${pTheme.borderActive}`
                            : `1.2px solid ${pTheme.borderNormal}`,
                        borderLeft: `5px solid ${pTheme.accent}`,
                        borderRadius: 14,
                        overflow: "hidden",
                        boxShadow: selectedInDistrictCount > 0 ? `0 3px 10px ${pTheme.borderNormal}` : "0 1.5px 4px rgba(0,0,0,0.03)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Top Accent Strip with Province Deeper View Gradient */}
                      <div
                        style={{
                          height: 3,
                          width: "100%",
                          background: pTheme.gradientStrip,
                        }}
                      />

                      {/* District Accordion Header */}
                      <div
                        onClick={() => toggleDistrictAccordion(d)}
                        style={{
                          padding: "10px 12px",
                          background:
                            selectedInDistrictCount > 0
                              ? pTheme.selectedBg
                              : `linear-gradient(135deg, ${pTheme.cardTint} 0%, #FFFFFF 100%)`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          userSelect: "none",
                          borderBottom:
                            isDistExpanded && mandiList.length > 0
                              ? `1px solid ${pTheme.borderNormal}`
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color:
                                  selectedInDistrictCount > 0
                                    ? pTheme.accent
                                    : "#183B34",
                                fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                              }}
                            >
                              {tmL(d)}
                            </div>
                            <div
                              style={{
                                fontSize: 10.5,
                                color: "#52635F",
                                marginTop: 1,
                                fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                              }}
                            >
                              {mandiList.length}{" "}
                              {mandiList.length === 1
                                ? (lang === "ur" ? "منڈی" : "Mandi")
                                : (lang === "ur" ? "منڈیاں" : "Mandis")}
                              {selectedInDistrictCount > 0 &&
                                (lang === "ur"
                                  ? ` · ${selectedInDistrictCount} منتخب`
                                  : ` · ${selectedInDistrictCount} Selected`)}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {/* Select All in District Button */}
                          {!singleSelect && mandiList.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectAllInDistrict(d, mandiList);
                              }}
                              style={{
                                fontSize: lang === "ur" ? 11 : 10,
                                fontWeight: 800,
                                color: allInDistrictSelected
                                  ? "#FFFFFF"
                                  : pTheme.accent,
                                background: allInDistrictSelected
                                  ? pTheme.accent
                                  : pTheme.badgeBg,
                                border: `1px solid ${pTheme.accent}`,
                                padding: "3px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                              }}
                            >
                              {allInDistrictSelected
                                ? (lang === "ur" ? "✓ سب منتخب" : "✓ All Selected")
                                : (lang === "ur" ? "سب منتخب کریں" : "Select All")}
                            </button>
                          )}

                          {/* Accordion Expand / Collapse Indicator */}
                          <span
                            style={{
                              color: isDistExpanded ? pTheme.accent : "#80918B",
                              fontSize: 12,
                              fontWeight: 800,
                              transform: isDistExpanded
                                ? "rotate(0deg)"
                                : "rotate(-90deg)",
                              transition: "transform 0.2s",
                            }}
                          >
                            ▼
                          </span>
                        </div>
                      </div>

                      {/* Mandis List for this District */}
                      {isDistExpanded && mandiList.length > 0 && (
                        <div
                          style={{
                            padding: "8px 10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            background: pTheme.lightBg,
                          }}
                        >
                          {mandiList.map((mName) => {
                            const isSelected = isMandiSelected(mName);
                            const hasData = mandiHasData(mName);
                            return (
                              <button
                                key={mName}
                                type="button"
                                onClick={() => toggleMandi(mName, d)}
                                className="tap-target"
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  border: isSelected
                                    ? `1.5px solid ${pTheme.accent}`
                                    : `1px solid ${pTheme.borderNormal}`,
                                  borderLeft: `3.5px solid ${hasData ? pTheme.accent : "#B9C4BF"}`,
                                  background: isSelected
                                    ? pTheme.selectedBg
                                    : hasData
                                      ? "#FFFFFF"
                                      : "#F5F7F6",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                                  opacity: hasData ? 1 : 0.7,
                                }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: isSelected ? 800 : 600,
                                      color: isSelected ? pTheme.accent : hasData ? "#183B34" : "#7A8D85",
                                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                    }}
                                  >
                                    {tmL(mName)}
                                  </span>
                                  {!hasData && (
                                    <span
                                      style={{
                                        fontSize: 9,
                                        fontWeight: 800,
                                        color: "#7A8D85",
                                        background: "#E4EFE9",
                                        borderRadius: 6,
                                        padding: "1.5px 6px",
                                        flexShrink: 0,
                                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                                      }}
                                    >
                                      {lang === "ur" ? "کوئی ڈیٹا نہیں" : "No data"}
                                    </span>
                                  )}
                                </span>
                                <div
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    border: isSelected
                                      ? `1.5px solid ${pTheme.accent}`
                                      : `1.5px solid ${pTheme.borderNormal}`,
                                    background: isSelected
                                      ? pTheme.accent
                                      : "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#FFFFFF",
                                    fontSize: 11,
                                    fontWeight: 900,
                                  }}
                                >
                                  {isSelected ? "✓" : ""}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredDistricts.length === 0 && (
                  <div
                    style={{
                      padding: "20px 14px",
                      textAlign: "center",
                      background: "#FAFCFB",
                      borderRadius: 12,
                      border: "1.5px dashed #D5E2DD",
                      color: "#52635F",
                      fontSize: 12.5,
                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                    }}
                  >
                    <div>
                      {lang === "ur"
                        ? `🔍 کوئی مقام نہیں ملا "${distSearch}"`
                        : `🔍 No locations matching "${distSearch}"`}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDistSearch("")}
                      className="tap-target px-3 py-1 rounded-lg text-xs font-bold mt-2"
                      style={{
                        background: "#087F63",
                        color: "#fff",
                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                      }}
                    >
                      {lang === "ur" ? "تلاش صاف کریں" : "Clear Search"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Apply Button */}
        <div
          className="px-4 pb-4 pt-2.5 flex-shrink-0"
          style={{ borderTop: "1px solid #D5E2DD" }}
        >
          <button
            onClick={() => onApply(draft)}
            className="tap-target w-full rounded-xl font-extrabold text-white transition active:scale-[0.98]"
            style={{
              background: "#087F63",
              minHeight: 44,
              padding: "10px 14px",
              fontSize: 14.5,
              boxShadow: "0 3px 12px rgba(8,127,99,0.25)",
            }}
          >
            {isWholeCountrySelected
              ? lang === "ur"
                ? "پورا پاکستان لاگو کریں"
                : "Apply All Pakistan"
              : draft.length === 1
                ? lang === "ur"
                  ? `${tmL(draft[0].label)} لاگو کریں`
                  : `Apply ${draft[0].label}`
                : lang === "ur"
                  ? `${draft.length} مقامات لاگو کریں`
                  : `Apply ${draft.length} Selected Locations`}
          </button>
        </div>
      </div>
    </div>
  );
}
