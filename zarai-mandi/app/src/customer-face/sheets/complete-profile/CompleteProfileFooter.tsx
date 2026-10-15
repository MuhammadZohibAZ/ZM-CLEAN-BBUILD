// Complete Profile footer: selected count, Back / Next / Confirm payment buttons.

import { toUrduDigits, URDU_FONT } from "../../shared/i18n/LangProvider";
import { type CompleteProfileState } from "./useCompleteProfile";

export function CompleteProfileFooter({ s }: { s: CompleteProfileState }) {
  const {
    data,
    lang,
    totalSteps,
    currentStep,
    activeStepKey,
    finalTotal,
    handleNext,
    handlePrev,
    handlePaymentConfirmClick,
  } = s;
  return (
    <div
      className="px-5 pt-3 pb-5 flex-shrink-0 bg-white"
      style={{ borderTop: "1px solid #D5E2DD" }}
    >
      {activeStepKey === "products" ? (
        <div className="flex items-center justify-between gap-3">
          <span
            className="font-black text-[13.5px] text-[#143B33]"
            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
          >
            {lang === "ur"
              ? `${toUrduDigits(data.selectedProds.length)} مصنوعات منتخب`
              : `${data.selectedProds.length} product${data.selectedProds.length === 1 ? "" : "s"} selected`}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={data.selectedProds.length === 0}
            className={`tap-target px-5 py-3 rounded-2xl font-black text-sm text-white flex items-center gap-1.5 transition-all ${
              data.selectedProds.length === 0
                ? "bg-[#9CA3AF] opacity-60 cursor-not-allowed"
                : "bg-[#087F63] hover:bg-[#066A52] active:scale-95 shadow-md shadow-[#087F63]/25"
            }`}
            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
          >
            <span>{lang === "ur" ? "پلان منتخب کریں" : "Choose Plan"}</span>
            <span>›</span>
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="tap-target py-3 px-4 rounded-2xl font-bold text-xs"
              style={{ background: "#E8EFEC", color: "#183B34" }}
            >
              ← {lang === "ur" ? "پیچھے" : "Back"}
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="tap-target flex-1 py-3 rounded-2xl font-extrabold text-sm text-white"
              style={{
                background: "#087F63",
                boxShadow: "0 4px 14px rgba(8,127,99,0.3)",
              }}
            >
              {lang === "ur"
                ? "ادائیگی کی طرف جائیں →"
                : "Continue to Payment →"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePaymentConfirmClick}
              className="tap-target flex-1 py-3 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #087F63, #064D40)",
                boxShadow: "0 4px 16px rgba(8,127,99,0.4)",
              }}
            >
              <span>
                {lang === "ur"
                  ? `ادائیگی کی تصدیق کریں — PKR ${finalTotal.toLocaleString()}`
                  : `Confirm Payment — PKR ${finalTotal.toLocaleString()}`}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
