// Complete Profile flow state: current step, picked products, plan, payment, MPIN dialog, and the step handlers.

import { useState } from "react";
import {
  DURATION_MONTHS_BILLING,
  getMonthlyDiscount,
} from "../../shared/data/billing";
import { VERTICALS } from "../../shared/data/catalog";
import { useLang } from "../../shared/i18n/LangProvider";
import { type AppProps, type ProfileSetupData } from "../../shared/types";
import { getSeasonPackageBasePrice } from "./packages";

export type CompleteProfileProps = {
  data: ProfileSetupData;
  onUpdateData: (partial: Partial<ProfileSetupData>) => void;
  onClose: () => void;
  onComplete: (
    selectedProducts: string[],
    locationData?: { province: string; district: string; city: string },
  ) => void;
  initialUserData?: AppProps["initialUserData"];
};

export function useCompleteProfile(props: CompleteProfileProps) {
  const { data, onUpdateData, onClose, onComplete, initialUserData } = props;
  const { lang, tc, tm } = useLang();

  // Step mapping: 3 steps (1: Interested Products, 2: Choose Plan, 3: Payment)
  const totalSteps = 3;
  const currentStep = Math.min(Math.max(data.step || 1, 1), totalSteps);

  const activeStepKey: "products" | "plan" | "payment" =
    currentStep === 1 ? "products" : currentStep === 2 ? "plan" : "payment";

  // MPIN Dialog State for Mobile Wallet
  const [mpinModalOpen, setMpinModalOpen] = useState(false);
  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [mpinError, setMpinError] = useState("");
  const [isProcessingMpin, setIsProcessingMpin] = useState(false);
  const [mpinSuccess, setMpinSuccess] = useState(false);

  // Demonstration month index (0=Jan ... 8=Sep ... 11=Dec) - default to September (8)
  const [demoMonthIdx, setDemoMonthIdx] = useState(8);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>("fruits");
  const [allVarietiesModalPkg, setAllVarietiesModalPkg] = useState<any | null>(
    null,
  );

  const monthlyTotal = data.selectedProds.reduce(
    (sum, p) => sum + getSeasonPackageBasePrice(p),
    0,
  );

  const { months, discount, regularTotal, discountAmt, finalTotal } =
    data.customMode
      ? (() => {
          const m = data.customMonths || 1;
          const d = getMonthlyDiscount(m);
          const reg = monthlyTotal * m;
          const da = Math.round(reg * d);
          return {
            months: m,
            discount: d,
            regularTotal: reg,
            discountAmt: da,
            finalTotal: reg - da,
          };
        })()
      : (() => {
          const m = DURATION_MONTHS_BILLING[data.dur] || 1;
          const d = getMonthlyDiscount(m);
          const reg = monthlyTotal * m;
          const da = Math.round(reg * d);
          return {
            months: m,
            discount: d,
            regularTotal: reg,
            discountAmt: da,
            finalTotal: reg - da,
          };
        })();

  const walletProviders = [
    {
      id: "jazzcash",
      label: "JazzCash",
      color: "#E83D2B",
      iconSrc: "/src/icons/jazz.png",
      sub: "Instant mobile MPIN prompt",
    },
    {
      id: "easypaisa",
      label: "EasyPaisa",
      color: "#4CAF50",
      iconSrc: "/src/icons/easypaisa.png",
      sub: "Instant approval MPIN",
    },
    {
      id: "sadapay",
      label: "SadaPay",
      color: "#00A389",
      iconSrc: "/src/icons/sadapay.png",
      sub: "In-app transfer request",
    },
    {
      id: "nayapay",
      label: "NayaPay",
      color: "#FF6F00",
      iconSrc: "/src/icons/nayapay.png",
      sub: "Fast wallet checkout",
    },
    {
      id: "upaisa",
      label: "UPaisa",
      color: "#F57F17",
      iconSrc: "/src/icons/upaisa.png",
      sub: "USSD / Mobile prompt",
    },
  ] as const;

  const directMethods = [
    {
      id: "jazzcash",
      label: "JazzCash Manual",
      color: "#E83D2B",
      iconSrc: "/src/icons/jazz.png",
      sub: "Send to Till / Account",
    },
    {
      id: "easypaisa",
      label: "EasyPaisa Manual",
      color: "#4CAF50",
      iconSrc: "/src/icons/easypaisa.png",
      sub: "Send to EasyPaisa Account",
    },
    {
      id: "bank",
      label: "Bank Transfer",
      color: "#1565C0",
      iconSrc: "/src/icons/banktransfer.png",
      sub: "Direct IBFT transfer",
    },
  ] as const;

  const directDetails: Record<string, { rows: [string, string][] }> = {
    jazzcash: {
      rows: [
        ["Account", "03058107777"],
        ["Account Name", "Muhammad Ghasharib Ali Shaukat"],
        ["Amount", `PKR ${finalTotal.toLocaleString()}`],
      ],
    },
    easypaisa: {
      rows: [
        ["Account", "03048107777"],
        ["Account Name", "Abdul Raafey Shaukat"],
        ["Amount", `PKR ${finalTotal.toLocaleString()}`],
      ],
    },
    bank: {
      rows: [
        ["Bank", "HBL"],
        ["Account Title", "Zarai Mandi Private Limited"],
        ["Account No.", "5000-7909-9814-03"],
        ["IBAN", "PK04HABB05000079089814030"],
        ["Amount", `PKR ${finalTotal.toLocaleString()}`],
      ],
    },
  };

  function formatCardNumber(v: string) {
    return v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2
      ? digits.slice(0, 2) + "/" + digits.slice(2)
      : digits;
  }
  function formatPhoneInput(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 4) return digits;
    return digits.slice(0, 4) + " " + digits.slice(4);
  }

  const toggleProd = (name: string) => {
    const updated = data.selectedProds.includes(name)
      ? data.selectedProds.filter((p) => p !== name)
      : [...data.selectedProds, name];
    // Keep at least 1 product
    onUpdateData({ selectedProds: updated.length > 0 ? updated : [name] });
  };

  const getVerticalForModalProduct = (productName: string) => {
    return (
      Object.entries(VERTICALS).find(
        ([, vd]) => vd.products[productName],
      )?.[0] || "Grains"
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      onUpdateData({
        step: nextStep,
        furthestStep: Math.max(data.furthestStep || 1, nextStep),
      });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      onUpdateData({ step: currentStep - 1 });
    }
  };

  const handleFinish = () => {
    onComplete(data.selectedProds, {
      province: data.province || "Punjab",
      district: data.district || "Pakpattan",
      city: data.city || "Pakpattan Mandi",
    });
  };

  const handlePaymentConfirmClick = () => {
    if (data.paymentType === "wallet") {
      setMpin(["", "", "", ""]);
      setMpinError("");
      setMpinSuccess(false);
      setMpinModalOpen(true);
    } else {
      handleFinish();
    }
  };

  const handleMpinSubmit = () => {
    const pinStr = mpin.join("");
    if (pinStr.length < 4) {
      setMpinError("Please enter complete 4-digit MPIN");
      return;
    }
    setMpinError("");
    setIsProcessingMpin(true);
    setTimeout(() => {
      setIsProcessingMpin(false);
      setMpinSuccess(true);
      setTimeout(() => {
        setMpinModalOpen(false);
        handleFinish();
      }, 700);
    }, 800);
  };

  const selectedWp =
    walletProviders.find(
      (wp) => wp.id === (data.walletProvider || "jazzcash"),
    ) || walletProviders[0];

  return {
    data,
    onUpdateData,
    onClose,
    onComplete,
    initialUserData,
    lang,
    tc,
    tm,
    totalSteps,
    currentStep,
    activeStepKey,
    mpinModalOpen,
    setMpinModalOpen,
    mpin,
    setMpin,
    mpinError,
    setMpinError,
    isProcessingMpin,
    setIsProcessingMpin,
    mpinSuccess,
    setMpinSuccess,
    demoMonthIdx,
    setDemoMonthIdx,
    isMonthPickerOpen,
    setIsMonthPickerOpen,
    expandedPkgId,
    setExpandedPkgId,
    allVarietiesModalPkg,
    setAllVarietiesModalPkg,
    monthlyTotal,
    months,
    discount,
    regularTotal,
    discountAmt,
    finalTotal,
    walletProviders,
    directMethods,
    directDetails,
    formatCardNumber,
    formatExpiry,
    formatPhoneInput,
    toggleProd,
    getVerticalForModalProduct,
    handleNext,
    handlePrev,
    handleFinish,
    handlePaymentConfirmClick,
    handleMpinSubmit,
    selectedWp,
  };
}

export type CompleteProfileState = ReturnType<typeof useCompleteProfile>;
