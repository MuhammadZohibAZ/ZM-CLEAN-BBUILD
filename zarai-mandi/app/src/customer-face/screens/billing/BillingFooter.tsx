// Billing footer: Back and Continue / Pay buttons.

import { type BillingState } from "./useBilling";

export function BillingFooter({ s }: { s: BillingState }) {
  const { onBack, lang, step, setStep, finalTotal, handlePaymentConfirmClick } =
    s;
  return (
    <div
      className="px-5 pt-3 pb-5 flex-shrink-0"
      style={{ borderTop: "1px solid #D5E2DD", background: "#F4FAF7" }}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={step === "pay" ? () => setStep("plan") : onBack}
          className="tap-target py-3 px-5 rounded-2xl font-bold text-xs"
          style={{ background: "#E8EFEC", color: "#183B34" }}
        >
          ← {lang === "ur" ? "پیچھے" : "Back"}
        </button>

        {step === "plan" ? (
          <button
            type="button"
            onClick={() => setStep("pay")}
            className="tap-target flex-1 py-3 rounded-2xl font-extrabold text-sm text-white"
            style={{
              background: "#087F63",
              boxShadow: "0 4px 14px rgba(8,127,99,0.3)",
            }}
          >
            {lang === "ur" ? "سبسکرائب" : "Subscribe"}
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
    </div>
  );
}
