// Complete Profile header: back / close, title and the 3-step progress bar.

import { toUrduDigits, URDU_FONT } from "../../shared/i18n/LangProvider";
import { type CompleteProfileState } from "./useCompleteProfile";

export function CompleteProfileHeader({ s }: { s: CompleteProfileState }) {
  const { onClose, lang, totalSteps, currentStep, activeStepKey, handlePrev } =
    s;
  return (
    <div
      className="px-5 pt-4 pb-3 flex-shrink-0 bg-white"
      style={{ borderBottom: "1px solid #D5E2DD" }}
    >
      <div
        className="w-10 h-1 rounded-full mx-auto mb-3"
        style={{ background: "#C7D6D0" }}
      />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={currentStep > 1 ? handlePrev : onClose}
            className="tap-target w-8 h-8 rounded-full bg-[#E8EFEC] flex items-center justify-center text-[#183B34] font-bold text-sm hover:bg-[#D8E4E0] active:scale-95 transition"
            title={currentStep > 1 ? "Back" : "Close"}
          >
            ←
          </button>
          <div>
            <p
              className="font-black text-base sm:text-lg"
              style={{
                color: "#143B33",
                fontFamily: lang === "ur" ? URDU_FONT : "inherit",
              }}
            >
              {lang === "ur" ? "پروفائل مکمل کریں" : "Complete Your Profile"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tap-target text-sm font-semibold px-2.5 py-1 rounded-full text-[#52635F] hover:bg-[#E8EFEC]"
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Step Subtitle: Step 1 of 3: Interested Products */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[12px] font-bold text-[#183B34]"
          style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
        >
          {lang === "ur"
            ? `مرحلہ ${toUrduDigits(currentStep)} از ${toUrduDigits(totalSteps)}: ${
                activeStepKey === "products"
                  ? "دلچسپی کی مصنوعات"
                  : activeStepKey === "plan"
                    ? "سبسکرپشن پلان"
                    : "ادائیگی کی تفصیلات"
              }`
            : `Step ${currentStep} of ${totalSteps}: ${
                activeStepKey === "products"
                  ? "Interested Products"
                  : activeStepKey === "plan"
                    ? "Subscription Plan"
                    : "Card & Payment"
              }`}
        </span>
      </div>

      {/* Full-width 3-segment Progress Bar */}
      <div className="flex gap-2 w-full">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 999,
              background: s <= currentStep ? "#087F63" : "#D5E2DD",
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
