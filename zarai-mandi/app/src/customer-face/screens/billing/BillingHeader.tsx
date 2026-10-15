// Billing header: back, product, step title and stepper dots.

import { type BillingState } from "./useBilling";

export function BillingHeader({ s }: { s: BillingState }) {
  const { onBack, lang, step } = s;
  return (
    <div
      className="px-5 pt-4 pb-3 flex-shrink-0"
      style={{ borderBottom: "1px solid #D5E2DD" }}
    >
      <div
        className="w-10 h-1 rounded-full mx-auto mb-3"
        style={{ background: "#C7D6D0" }}
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="font-extrabold text-lg" style={{ color: "#183B34" }}>
            {lang === "ur"
              ? "پروفائل سیٹ اپ مکمل کریں"
              : "Complete Your Profile"}
          </p>
          <p className="text-xs font-semibold" style={{ color: "#52635F" }}>
            {lang === "ur"
              ? `مرحلہ ${step === "plan" ? 2 : 3} از 3: ${
                  step === "plan" ? "سبسکرپشن پلان" : "ادائیگی کی تفصیلات"
                }`
              : `Step ${step === "plan" ? 2 : 3} of 3: ${
                  step === "plan" ? "Subscription Plan" : "Card & Payment"
                }`}
          </p>
        </div>
        <button
          onClick={onBack}
          className="tap-target text-sm font-semibold px-3 py-1 rounded-full"
          style={{ background: "#E8EFEC", color: "#52635F" }}
          title="Close & Explore"
        >
          ✕
        </button>
      </div>

      {/* Stepper Dots */}
      <div className="flex gap-2 mt-3">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background:
                s <= (step === "plan" ? 2 : 3) ? "#087F63" : "#D5E2DD",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
