import { type BillingProps, useBilling } from "./useBilling";
import { BillingHeader } from "./BillingHeader";
import { BillingPlanStep } from "./BillingPlanStep";
import { BillingPaymentStep } from "./BillingPaymentStep";
import { BillingFooter } from "./BillingFooter";
import { BillingMpinDialog } from "./BillingMpinDialog";
import { SubscribedDialog } from "./SubscribedDialog";

export function BillingScreen(props: BillingProps) {
  const s = useBilling(props);
  const { onBack, step, mpinModalOpen, subscribedModal } = s;

  return (
    <div
      className="zm-sheet-overlay"
      style={{
        zIndex: 350,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onBack}
    >
      <div
        className="zm-sheet-high"
        style={{
          background: "#F4FAF7",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -10px 40px rgba(6,77,64,0.22)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <BillingHeader s={s} />

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "plan" ? (
            <BillingPlanStep s={s} />
          ) : (
            /* STEP 2: PAYMENT SCREEN */
            <BillingPaymentStep s={s} />
          )}
        </div>

        {/* Footer Actions Bar (Matches Image 2 & Complete Profile) */}
        <BillingFooter s={s} />
      </div>

      {/* MPIN Entry Modal for Mobile Wallet */}
      {mpinModalOpen && <BillingMpinDialog s={s} />}

      {/* Subscription Success Modal */}
      {subscribedModal && <SubscribedDialog s={s} />}
    </div>
  );
}
