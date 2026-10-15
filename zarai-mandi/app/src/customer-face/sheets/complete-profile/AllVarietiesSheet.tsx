// "View all" varieties of a season package.

import {
  getVarietyIcon,
  MONTH_NAMES_EN,
  MONTH_NAMES_UR,
} from "../../../data/seasonProductData";
import { toUrduDigits, URDU_FONT } from "../../shared/i18n/LangProvider";
import { type CompleteProfileState } from "./useCompleteProfile";

export function AllVarietiesSheet({ s }: { s: CompleteProfileState }) {
  const { lang, demoMonthIdx, allVarietiesModalPkg, setAllVarietiesModalPkg } =
    s;
  return (
    <div
      className="fixed inset-0 z-[400] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={() => setAllVarietiesModalPkg(null)}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-h-[80vh] w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAF9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E2EBE6] p-1 flex items-center justify-center shadow-xs">
              <img
                src={allVarietiesModalPkg.icon}
                alt=""
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h3
                className="font-black text-base text-[#143B33]"
                style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
              >
                {lang === "ur"
                  ? allVarietiesModalPkg.nameUr
                  : allVarietiesModalPkg.name}
              </h3>
              <p
                className="text-xs text-[#52635F]"
                style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
              >
                {lang === "ur"
                  ? `${MONTH_NAMES_UR[demoMonthIdx]} میں تمام ${toUrduDigits(allVarietiesModalPkg.varietyCount)} اقسام`
                  : `All ${allVarietiesModalPkg.varietyCount} varieties in ${MONTH_NAMES_EN[demoMonthIdx]}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAllVarietiesModalPkg(null)}
            className="tap-target w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-sm font-bold text-[#374151]"
          >
            ✕
          </button>
        </div>

        {/* Varieties List */}
        <div
          className="p-4 overflow-y-auto flex-1 flex flex-col gap-2"
          style={{ scrollbarWidth: "thin" }}
        >
          {allVarietiesModalPkg.activeVarieties.map((v: any) => (
            <div
              key={v.name}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#F8FAF9] border border-[#E5EBE8] hover:bg-white hover:border-[#BDE7D9] transition-all"
            >
              <img
                src={getVarietyIcon(allVarietiesModalPkg.id, v.name)}
                alt={v.name}
                className="w-8 h-8 object-contain rounded-xl flex-shrink-0"
              />
              <span
                className="font-bold text-[14px] text-[#183B34] truncate"
                style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
              >
                {lang === "ur" ? v.nameUr || v.name : v.name}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E5E7EB] bg-[#F8FAF9] flex justify-end">
          <button
            type="button"
            onClick={() => setAllVarietiesModalPkg(null)}
            className="px-5 py-2 rounded-xl bg-[#087F63] text-white font-bold text-sm shadow-sm hover:bg-[#066A52]"
            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
          >
            {lang === "ur" ? "ٹھیک ہے" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
