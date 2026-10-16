import {
  type CompleteProfileProps,
  useCompleteProfile,
} from "./useCompleteProfile";
import { CompleteProfileHeader } from "./CompleteProfileHeader";
import { ProductsStep } from "./ProductsStep";
import { PlanStep } from "./PlanStep";
import { PaymentStep } from "./PaymentStep";
import { CompleteProfileFooter } from "./CompleteProfileFooter";
import { AllVarietiesSheet } from "./AllVarietiesSheet";
import { MpinDialog } from "./MpinDialog";

export function CompleteProfileModal(props: CompleteProfileProps) {
  const s = useCompleteProfile(props);
  const { onClose, activeStepKey, mpinModalOpen, allVarietiesModalPkg } = s;

  // One centred modal for every step: same size throughout (no jump when the
  // step changes) over a solid, softly tinted backdrop.
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 350,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(16px, env(safe-area-inset-top, 0px), calc(var(--zm-bleed-top) + 8px)) 12px max(16px, env(safe-area-inset-bottom))",
        background: "radial-gradient(120% 80% at 50% 0%, rgba(8, 95, 74, 0.94), rgba(3, 30, 24, 0.97))",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          height: "min(100%, 760px)",
          background: "#F4FAF7",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 26,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
          animation: "zmModalIn 0.22s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <CompleteProfileHeader s={s} />

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* STEP 1: INTERESTED PRODUCTS / PACKAGES */}
          {activeStepKey === "products" && <ProductsStep s={s} />}

          {/* STEP 2: SUBSCRIPTION PLAN */}
          {activeStepKey === "plan" && <PlanStep s={s} />}

          {/* STEP 3: PAYMENT SCREEN */}
          {activeStepKey === "payment" && <PaymentStep s={s} />}
        </div>

        {/* Footer Actions */}
        <CompleteProfileFooter s={s} />
      </div>

      {/* All Varieties Modal Sheet */}
      {allVarietiesModalPkg && <AllVarietiesSheet s={s} />}

      {/* MPIN Entry Modal for Mobile Wallet */}
      {mpinModalOpen && <MpinDialog s={s} />}
    </div>
  );
}
