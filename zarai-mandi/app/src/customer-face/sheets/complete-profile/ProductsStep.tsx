// Complete Profile step 1: pick the products / season packages you are interested in.

import {
  getPackagesForMonth,
  getVarietyIcon,
  MONTH_KEYS,
  MONTH_NAMES_EN,
} from "../../../data/seasonProductData";
import { URDU_FONT } from "../../shared/i18n/LangProvider";
import { type CompleteProfileState } from "./useCompleteProfile";

export function ProductsStep({ s }: { s: CompleteProfileState }) {
  const {
    data,
    lang,
    demoMonthIdx,
    setDemoMonthIdx,
    isMonthPickerOpen,
    setIsMonthPickerOpen,
    expandedPkgId,
    setExpandedPkgId,
    setAllVarietiesModalPkg,
    toggleProd,
  } = s;
  const availablePackages = getPackagesForMonth(MONTH_KEYS[demoMonthIdx]);
  const currentMonthNameEn = MONTH_NAMES_EN[demoMonthIdx];

  // Find expanded vertical package if one is currently expanded
  const expandedPkg = availablePackages.find(
    (p) => p.id === expandedPkgId && p.type === "vertical",
  );

  // The rest go in the 2-column grid: selected ones first, so a pick moves to
  // the top; otherwise the month's order (in-season first) is kept.
  const isPicked = (p: { name: string; id: string }) =>
    data.selectedProds.includes(p.name) || data.selectedProds.includes(p.id);
  const gridPackages = availablePackages
    .filter((p) => !(expandedPkg && p.id === expandedPkg.id))
    .map((p, i) => ({ p, i }))
    .sort((a, b) => Number(isPicked(b.p)) - Number(isPicked(a.p)) || a.i - b.i)
    .map(({ p }) => p);

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Title & Subtitle + Subtle Demo Month Switcher on Top Right */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2
            className="font-black text-[20px] sm:text-[22px] text-[#143B33] leading-tight"
            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
          >
            {lang === "ur" ? "اپنی مصنوعات منتخب کریں" : "Select Your Products"}
          </h2>
          <p
            className="text-[12px] font-medium text-[#52635F] mt-0.5"
            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
          >
            {lang === "ur"
              ? "اپنی سبسکرپشن مصنوعات منتخب کریں۔"
              : "Choose your subscription products."}
          </p>
        </div>

        {/* Subtle Demo Month Switcher */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            className="tap-target flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#D5E2DD] text-[#52635F] hover:border-[#087F63] hover:text-[#087F63] transition-all shadow-2xs"
            title="Change demonstration month"
          >
            <span className="text-[11px] font-bold">
              Demo:{" "}
              <span className="text-[#087F63] font-black">
                {currentMonthNameEn}
              </span>
            </span>
            <span className="text-[10px] text-[#9CA3AF]">▾</span>
          </button>

          {/* Floating Dropdown Month Menu */}
          {isMonthPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsMonthPickerOpen(false)}
              />
              <div
                className="absolute right-0 top-8 z-50 bg-white rounded-2xl p-2 shadow-2xl border border-[#E2E8F0] grid grid-cols-3 gap-1 w-[240px] animate-fadeIn"
                style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
              >
                {MONTH_NAMES_EN.map((mName, mIdx) => {
                  const isCur = demoMonthIdx === mIdx;
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => {
                        setDemoMonthIdx(mIdx);
                        setIsMonthPickerOpen(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition text-center ${
                        isCur
                          ? "bg-[#087F63] text-white"
                          : "text-[#374151] hover:bg-[#F3F4F6]"
                      }`}
                    >
                      {mName.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 1. EXPANDED VERTICAL CARD (FULL WIDTH) */}
      {expandedPkg &&
        (() => {
          const isSelected =
            data.selectedProds.includes(expandedPkg.name) ||
            data.selectedProds.includes(expandedPkg.id);
          return (
            <div
              key={expandedPkg.id}
              className="rounded-2xl border border-[#D5E2DD] bg-white p-3 shadow-xs transition-all flex flex-col gap-2.5"
            >
              {/* Top Row: Icon + Title + Chevron Up + Radio */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <img
                    src={expandedPkg.icon}
                    alt={expandedPkg.name}
                    className="w-9 h-9 object-contain flex-shrink-0"
                  />
                  <span
                    className="font-black text-[15px] text-[#143B33] break-words min-w-0"
                    style={{
                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                    }}
                  >
                    {lang === "ur" ? expandedPkg.nameUr : expandedPkg.name}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {/* Chevron Up */}
                  <button
                    type="button"
                    onClick={() => setExpandedPkgId(null)}
                    className="tap-target text-[#6B7280] hover:text-[#087F63] p-1"
                    title="Collapse"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>

                  {/* Radio circle */}
                  <button
                    type="button"
                    onClick={() => toggleProd(expandedPkg.name)}
                    className="tap-target focus:outline-none"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-[#087F63] bg-[#087F63] text-white"
                          : "border-[#9CA3AF] bg-white hover:border-[#087F63]"
                      }`}
                    >
                      {isSelected && (
                        <span className="text-[10px] font-black">✓</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Content Row: 3 Variety preview cards on left + View all link on right */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {expandedPkg.activeVarieties.slice(0, 3).map((v) => (
                    <div
                      key={v.name}
                      className="flex-1 bg-[#F8FAF9] border border-[#E5EBE8] rounded-xl p-1.5 flex flex-col items-center justify-center text-center gap-1 min-w-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center">
                        <img
                          src={getVarietyIcon(expandedPkg.id, v.name)}
                          alt={v.name}
                          className="w-7 h-7 object-contain rounded-md"
                        />
                      </div>
                      <span
                        className="text-[10px] font-bold text-[#183B34] break-words min-w-0 w-full"
                        style={{
                          fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                        }}
                      >
                        {lang === "ur" ? v.nameUr || v.name : v.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* View All button on the right */}
                <button
                  type="button"
                  onClick={() => setAllVarietiesModalPkg(expandedPkg as any)}
                  className="tap-target flex items-center gap-1 text-[#087F63] font-bold text-[12px] px-2 py-3 rounded-xl hover:bg-[#E8F8F3] transition flex-shrink-0"
                  style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                >
                  <span>{lang === "ur" ? "تمام دیکھیں" : "View all"}</span>
                  <span className="text-[14px] leading-none">›</span>
                </button>
              </div>
            </div>
          );
        })()}

      {/* 2. 2-COLUMN GRID FOR ALL OTHER PACKAGES AND PRODUCTS */}
      <div className="grid grid-cols-2 gap-2.5">
        {gridPackages.map((pkg) => {
          const isSelected =
            data.selectedProds.includes(pkg.name) ||
            data.selectedProds.includes(pkg.id);
          const isVertical = pkg.type === "vertical";

          return (
            <div
              key={pkg.id}
              onClick={() => {
                if (!isVertical) {
                  toggleProd(pkg.name);
                }
              }}
              className={`rounded-2xl p-2.5 flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? "border-2 border-[#087F63] bg-[#E8F8F3] shadow-xs"
                  : "border border-[#D5E2DD] bg-white hover:border-[#B5CEC5]"
              }`}
            >
              {/* Icon + Title */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <img
                  src={pkg.icon}
                  alt={pkg.name}
                  className="w-8 h-8 object-contain flex-shrink-0"
                />
                <span
                  className={`text-[13px] font-bold break-words min-w-0 ${
                    isSelected ? "text-[#087F63]" : "text-[#183B34]"
                  }`}
                  style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                >
                  {lang === "ur" ? pkg.nameUr : pkg.name}
                </span>
              </div>

              {/* Right side: Chevron for Verticals + Radio for all */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isVertical && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPkgId(pkg.id);
                    }}
                    className="tap-target text-[#9CA3AF] hover:text-[#087F63] p-0.5"
                    title="Expand varieties"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProd(pkg.name);
                  }}
                  className="tap-target focus:outline-none"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-[#087F63] bg-[#087F63] text-white"
                        : "border-[#9CA3AF] bg-white hover:border-[#087F63]"
                    }`}
                  >
                    {isSelected && (
                      <span className="text-[10px] font-black">✓</span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
