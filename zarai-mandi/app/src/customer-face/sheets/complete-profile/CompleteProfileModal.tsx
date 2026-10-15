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

  return (
    <div
      className="zm-sheet-overlay"
      style={{
        zIndex: 350,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
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
          transition: "all 0.25s ease-out",
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
