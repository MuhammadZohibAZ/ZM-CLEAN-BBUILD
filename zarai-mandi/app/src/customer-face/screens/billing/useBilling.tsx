// Billing screen state: step (plan / pay), duration, payment method and form fields, MPIN dialog, success dialog, and the handlers.

import { useState } from "react";
import {
  DURATION_MONTHS_BILLING,
  getMonthlyDiscount,
} from "../../shared/data/billing";
import { getVerticalForProduct } from "../../shared/data/catalog";
import { getproductIconSrc } from "../../shared/data/icons";
import { useLang } from "../../shared/i18n/LangProvider";
import { type Screen } from "../../shared/types";
import { getproductBasePrice } from "./pricing";

export type BillingProps = {
  product: string;
  vertical?: string;
  onBack: () => void;
  push: (s: Screen) => void;
  onSubscribeSuccess?: (productName: string) => void;
};

export function useBilling(props: BillingProps) {
  const { product, vertical, onBack, push, onSubscribeSuccess } = props;
  const { lang, tc, tm } = useLang();
  const [step, setStep] = useState<"plan" | "pay">("plan");
  const [dur, setDur] = useState(0); // 0: 1 Month, 1: 3 Months, 2: 6 Months, 3: 1 Year
  const [customMode, setCustomMode] = useState(false);
  const [customMonths, setCustomMonths] = useState<number>(3);

  // Payment method state
  const [paymentType, setPaymentType] = useState<"wallet" | "card" | "direct">(
    "wallet",
  );
  const [walletProvider, setWalletProvider] = useState<
    "jazzcash" | "easypaisa" | "sadapay" | "nayapay" | "upaisa"
  >("jazzcash");
  const [walletNumber, setWalletNumber] = useState("0300 1234567");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("Muhammad Arif");

  // Direct Method fields
  const [directMethod, setDirectMethod] = useState<
    "jazzcash" | "easypaisa" | "bank"
  >("jazzcash");
  const [hasReceipt, setHasReceipt] = useState(false);

  // MPIN Dialog State for Mobile Wallet
  const [mpinModalOpen, setMpinModalOpen] = useState(false);
  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [mpinError, setMpinError] = useState("");
  const [isProcessingMpin, setIsProcessingMpin] = useState(false);
  const [mpinSuccess, setMpinSuccess] = useState(false);
  const [subscribedModal, setSubscribedModal] = useState(false);

  const v = vertical || getVerticalForProduct(product) || "Grains";
  const iconSrc = getproductIconSrc(product, v);
  const basePrice = getproductBasePrice(product);

  const { months, discount, regularTotal, discountAmt, finalTotal } = customMode
    ? (() => {
        const m = customMonths || 1;
        const d = getMonthlyDiscount(m);
        const reg = basePrice * m;
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
        const m = DURATION_MONTHS_BILLING[dur] || 1;
        const d = getMonthlyDiscount(m);
        const reg = basePrice * m;
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

  const handleFinish = () => {
    onSubscribeSuccess?.(product);
    setSubscribedModal(true);
  };

  const handlePaymentConfirmClick = () => {
    if (paymentType === "wallet") {
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
    walletProviders.find((wp) => wp.id === walletProvider) ||
    walletProviders[0];

  return {
    product,
    vertical,
    onBack,
    push,
    onSubscribeSuccess,
    lang,
    tc,
    tm,
    step,
    setStep,
    dur,
    setDur,
    customMode,
    setCustomMode,
    customMonths,
    setCustomMonths,
    paymentType,
    setPaymentType,
    walletProvider,
    setWalletProvider,
    walletNumber,
    setWalletNumber,
    cardNumber,
    setCardNumber,
    expiry,
    setExpiry,
    cvv,
    setCvv,
    cardHolder,
    setCardHolder,
    directMethod,
    setDirectMethod,
    hasReceipt,
    setHasReceipt,
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
    subscribedModal,
    setSubscribedModal,
    v,
    iconSrc,
    basePrice,
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
    handleFinish,
    handlePaymentConfirmClick,
    handleMpinSubmit,
    selectedWp,
  };
}

export type BillingState = ReturnType<typeof useBilling>;
