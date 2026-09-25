import { useState } from "react";

import { DURATION_MONTHS_BILLING, getMonthlyDiscount } from "../shared/data/billing";
import { getVerticalForProduct } from "../shared/data/catalog";
import { getproductIconSrc } from "../shared/data/icons";
import { useLang } from "../shared/i18n/LangProvider";
import { type Screen } from "../shared/types";

export const product_BASE_PRICES: Record<string, number> = {
  wheat: 3000,
  maize: 3000,
  sesame: 3000,
  millet: 3000,
  cotton: 3000,
  paddy: 3000,
  rice: 3000,
  edibleoil: 5000,
  "edible oil": 5000,
  fertilizer: 5000,
  livestock: 5000,
  livemarket: 3000,
  "live market": 3000,
  dates: 3000,
  mustard: 3000,
  spices: 3000,
  pulses: 3000,
  kiryana: 5000,
  sugar: 3000,
  sugarcane: 3000,
  fruits: 5000,
  fruit: 5000,
  vegetables: 5000,
  vegetable: 5000,
  dryfruit: 3000,
  "dry fruit": 3000,
  herbs: 3000,
  herbals: 3000,
};

export function getproductBasePrice(product: string): number {
  const k = (product || "").toLowerCase().trim();
  if (product_BASE_PRICES[k] !== undefined) return product_BASE_PRICES[k];
  for (const [key, price] of Object.entries(product_BASE_PRICES)) {
    if (k.includes(key) || key.includes(k)) return price;
  }
  return 3000;
}

export function BillingScreen({
  product,
  vertical,
  onBack,
  push,
  onSubscribeSuccess,
}: {
  product: string;
  vertical?: string;
  onBack: () => void;
  push: (s: Screen) => void;
  onSubscribeSuccess?: (productName: string) => void;
}) {
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
              <p
                className="font-extrabold text-lg"
                style={{ color: "#183B34" }}
              >
                {lang === "ur"
                  ? "پروفائل سیٹ اپ مکمل کریں"
                  : "Complete Your Profile"}
              </p>
              <p className="text-xs font-semibold" style={{ color: "#52635F" }}>
                {lang === "ur"
                  ? `مرحلہ ${step === "plan" ? 2 : 3} از 3: ${step === "plan" ? "سبسکرپشن پلان" : "ادائیگی کی تفصیلات"
                  }`
                  : `Step ${step === "plan" ? 2 : 3} of 3: ${step === "plan" ? "Subscription Plan" : "Card & Payment"
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

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "plan" ? (
            <div>
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#183B34" }}>
                  {lang === "ur"
                    ? "اپنا سبسکرپشن پلان منتخب کریں"
                    : "Choose Your ZM Plan"}
                </h2>
              </div>

              {/* Standard Duration Tabs */}
              <div
                style={{
                  display: "flex",
                  background: "rgba(15,138,95,0.07)",
                  borderRadius: 12,
                  padding: 4,
                  gap: 3,
                  marginBottom: 10,
                }}
              >
                {[
                  { label: "1 Mo", durIdx: 0, badge: "Standard" },
                  { label: "3 Mos", durIdx: 1, badge: "10% off" },
                  { label: "6 Mos", durIdx: 2, badge: "15% off" },
                  { label: "12 Mos", durIdx: 3, badge: "25% off" },
                ].map((item) => {
                  const active = !customMode && dur === item.durIdx;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`dur-tab${active ? " active" : ""}`}
                      onClick={() => {
                        setCustomMode(false);
                        setDur(item.durIdx);
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 2px",
                        borderRadius: 10,
                        border: "none",
                        background: active ? "#087F63" : "transparent",
                        color: active ? "#fff" : "#183B34",
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <span>{item.label}</span>
                      <span
                        style={{
                          fontSize: 8.5,
                          opacity: active ? 0.95 : 0.65,
                          fontWeight: 800,
                        }}
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Customize Mode Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setCustomMode(!customMode);
                  if (!customMode) setCustomMonths(3);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: customMode
                    ? "2px solid #087F63"
                    : "1.5px dashed #D5E2DD",
                  background: customMode ? "#E4F2EC" : "#fff",
                  color: customMode ? "#087F63" : "#52635F",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span>
                    {lang === "ur"
                      ? "اپنی مرضی کے مہینے منتخب کریں (1 تا 12)"
                      : "Customize Specific Months"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: customMode ? "#087F63" : "#80918B",
                  }}
                >
                  {customMode ? "Hide Picker ▴" : "Show Picker ▾"}
                </span>
              </button>

              {/* Custom Duration Fluid Month Picker */}
              {customMode && (
                <div
                  style={{
                    border: "1.5px solid #087F63",
                    borderRadius: 16,
                    padding: "14px",
                    marginBottom: 12,
                    background: "#fff",
                    boxShadow: "0 2px 10px rgba(8,127,99,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#183B34",
                      }}
                    >
                      {customMonths} Month{customMonths > 1 ? "s" : ""} Plan
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#16A34A",
                        background: "rgba(22,163,74,0.12)",
                        borderRadius: 20,
                        padding: "2px 9px",
                      }}
                    >
                      {getMonthlyDiscount(customMonths) > 0
                        ? `${Math.round(getMonthlyDiscount(customMonths) * 100)}% Discount`
                        : "Regular Rate"}
                    </span>
                  </div>

                  {/* 12 Months Grid Chips */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                      const sel = customMonths === m;
                      const disc = getMonthlyDiscount(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCustomMonths(m)}
                          style={{
                            padding: "6px 2px",
                            borderRadius: 8,
                            border: sel
                              ? "2px solid #087F63"
                              : "1.5px solid #D5E2DD",
                            background: sel ? "#087F63" : "#F4FAF7",
                            color: sel ? "#fff" : "#183B34",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <span style={{ fontSize: 11.5, fontWeight: 800 }}>
                            {m} mo
                          </span>
                          <span
                            style={{
                              fontSize: 8.5,
                              fontWeight: 700,
                              color: sel
                                ? "#D1FAE5"
                                : disc > 0
                                  ? "#16A34A"
                                  : "#80918B",
                            }}
                          >
                            {disc > 0 ? `-${disc * 100}%` : "0%"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Pricing Breakdown Card (Matches Image 2) */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  border: "1.4px solid #D5E2DD",
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "8px 14px 6px",
                    borderBottom: "1px solid #D5E2DD",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#B9822E",
                    fontWeight: 700,
                  }}
                >
                  SELECTED PRODUCTS (1 ITEMS)
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 14px",
                      borderBottom: "1px solid rgba(15,138,95,0.06)",
                      fontSize: 12.5,
                      color: "#52635F",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 700,
                        color: "#183B34",
                      }}
                    >
                      <img
                        src={iconSrc}
                        alt=""
                        style={{
                          width: 22,
                          height: 22,
                          objectFit: "contain",
                        }}
                      />
                      {tc(product)}
                    </span>
                    <span style={{ fontWeight: 600, color: "#183B34" }}>
                      PKR {basePrice.toLocaleString()}/mo
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    borderTop: "1.5px solid rgba(15,138,95,0.1)",
                    background: "#E4F2EC",
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#52635F",
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      Total/mo × {months} month{months > 1 ? "s" : ""}
                    </span>
                    <span>PKR {regularTotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "#16A34A",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      <span>Discount ({discount * 100}% off)</span>
                      <span>− PKR {discountAmt.toLocaleString()}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 6,
                      borderTop: "1px solid rgba(15,138,95,0.1)",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13.5,
                        color: "#183B34",
                      }}
                    >
                      Your Total
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: "#087F63",
                        }}
                      >
                        PKR {finalTotal.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#52635F" }}>
                        PKR {Math.round(finalTotal / months).toLocaleString()}/mo
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: PAYMENT SCREEN */
            <div>
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#183B34" }}>
                  {lang === "ur"
                    ? "ادائیگی مکمل کریں"
                    : "Complete Your Payment"}
                </h2>
              </div>

              {/* 3 Payment Type Selector Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {[
                  {
                    id: "wallet",
                    iconSrc: "/src/icons/mobilewallet.png",
                    label: "Mobile Wallet",
                    sub: "JazzCash, EasyPaisa",
                  },
                  {
                    id: "card",
                    iconSrc: "/src/icons/cardpayment.png",
                    label: "Card Payment",
                    sub: "Debit / Credit",
                  },
                  {
                    id: "direct",
                    iconSrc: "/src/icons/directtransfer.png",
                    label: "Direct Transfer",
                    sub: "Bank IBFT",
                  },
                ].map((opt) => {
                  const active = paymentType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentType(opt.id as any)}
                      style={{
                        padding: "10px 4px",
                        borderRadius: 14,
                        border: active
                          ? "2px solid #087F63"
                          : "1.5px solid #D5E2DD",
                        background: active ? "#E4F2EC" : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 24,
                          marginBottom: 4,
                        }}
                      >
                        <img
                          src={opt.iconSrc}
                          alt=""
                          style={{
                            width: 22,
                            height: 22,
                            objectFit: "contain",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: active ? "#087F63" : "#183B34",
                          lineHeight: 1.2,
                        }}
                      >
                        {opt.label}
                      </div>
                      <div
                        style={{
                          fontSize: 8.5,
                          color: "#52635F",
                          marginTop: 2,
                        }}
                      >
                        {opt.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Option 1: Mobile Wallet */}
              {paymentType === "wallet" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#52635F",
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      Select Wallet Provider
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {walletProviders.map((wp) => {
                        const sel = walletProvider === wp.id;
                        return (
                          <button
                            key={wp.id}
                            type="button"
                            onClick={() => setWalletProvider(wp.id as any)}
                            style={{
                              padding: "8px 4px",
                              borderRadius: 10,
                              border: sel
                                ? `2px solid ${wp.color}`
                                : "1.5px solid #D5E2DD",
                              background: sel ? `${wp.color}15` : "#FFFFFF",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <img
                              src={wp.iconSrc}
                              alt=""
                              style={{
                                width: 22,
                                height: 22,
                                objectFit: "contain",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: "#183B34",
                              }}
                            >
                              {wp.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#52635F",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Account Mobile Number
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="03XX XXXXXXX"
                      value={walletNumber}
                      onChange={(e) =>
                        setWalletNumber(formatPhoneInput(e.target.value))
                      }
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 12px",
                        border: "1.5px solid #D5E2DD",
                        borderRadius: 10,
                        fontSize: 14,
                        color: "#183B34",
                        background: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 10px",
                      background: "#E4F2EC",
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>💡</span>
                    <span style={{ fontSize: 11, color: "#52635F" }}>
                      {lang === "ur"
                        ? "ادائیگی کی تصدیق پر کلک کر کے اپنا MPIN درج کریں۔"
                        : "Tap confirm to enter your 4-digit mobile wallet MPIN."}
                    </span>
                  </div>
                </div>
              )}

              {/* Option 2: Card Payment */}
              {paymentType === "card" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#52635F",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Card Number
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 12px",
                        border: "1.5px solid #D5E2DD",
                        borderRadius: 10,
                        fontSize: 14,
                        color: "#183B34",
                        background: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#52635F",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Expiry Date
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        style={{
                          width: "100%",
                          height: 42,
                          padding: "0 12px",
                          border: "1.5px solid #D5E2DD",
                          borderRadius: 10,
                          fontSize: 13.5,
                          color: "#183B34",
                          background: "#fff",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#52635F",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Security Code
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="CVV"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) =>
                          setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        style={{
                          width: "100%",
                          height: 42,
                          padding: "0 12px",
                          border: "1.5px solid #D5E2DD",
                          borderRadius: 10,
                          fontSize: 13.5,
                          color: "#183B34",
                          background: "#fff",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#52635F",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 12px",
                        border: "1.5px solid #D5E2DD",
                        borderRadius: 10,
                        fontSize: 13.5,
                        color: "#183B34",
                        background: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      background: "#E4F2EC",
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 12 }}>🔒</span>
                    <span style={{ fontSize: 11, color: "#52635F" }}>
                      Your card details are encrypted and never stored.
                    </span>
                  </div>
                </div>
              )}

              {/* Option 3: Direct Transfer */}
              {paymentType === "direct" && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#52635F",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Choose Method
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 7,
                      marginBottom: 10,
                    }}
                  >
                    {directMethods.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setDirectMethod(m.id as any)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: 12,
                          border:
                            directMethod === m.id
                              ? "2px solid #087F63"
                              : "1.5px solid #D5E2DD",
                          background:
                            directMethod === m.id ? "#E4F2EC" : "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            background: `${m.color}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={m.iconSrc}
                            alt={m.label}
                            style={{
                              width: 24,
                              height: 24,
                              objectFit: "contain",
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "#183B34",
                            }}
                          >
                            {m.label}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#52635F" }}>
                            {m.sub}
                          </div>
                        </div>
                        {directMethod === m.id && (
                          <span
                            style={{
                              color: "#087F63",
                              fontWeight: 900,
                              fontSize: 13,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Direct Details Box */}
                  <div
                    style={{
                      background: "#fff",
                      border: "1.5px solid #D5E2DD",
                      borderRadius: 12,
                      padding: "10px 12px",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        color: "#B9822E",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      Payment Details
                    </div>
                    {directDetails[directMethod]?.rows.map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11.5,
                          padding: "3px 0",
                          borderBottom: "1px solid #F1F7F4",
                        }}
                      >
                        <span style={{ color: "#52635F" }}>{k}</span>
                        <strong
                          style={{
                            color: "#183B34",
                            fontFamily:
                              k === "IBAN" || k === "Account No."
                                ? "monospace"
                                : "inherit",
                          }}
                        >
                          {v}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {/* Upload Screenshot */}
                  <div
                    onClick={() => setHasReceipt(!hasReceipt)}
                    style={{
                      padding: "10px",
                      borderRadius: 12,
                      border: "1.5px dashed #087F63",
                      background: hasReceipt ? "#E4F2EC" : "#fff",
                      textAlign: "center",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#087F63",
                    }}
                  >
                    <span>{hasReceipt ? "✅" : "📎"}</span>
                    <span>
                      {hasReceipt
                        ? "Screenshot attached (Tap to change)"
                        : "Tap to upload payment screenshot"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions Bar (Matches Image 2 & Complete Profile) */}
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
      </div>

      {/* MPIN Entry Modal for Mobile Wallet */}
      {mpinModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(6, 45, 36, 0.75)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => {
            if (!isProcessingMpin) setMpinModalOpen(false);
          }}
        >
          <div
            className="screen-enter"
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#FFFFFF",
              borderRadius: 24,
              padding: "24px 20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              textAlign: "center",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Wallet Icon Badge */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `${selectedWp.color}15`,
                border: `2px solid ${selectedWp.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <img
                src={selectedWp.iconSrc}
                alt=""
                style={{ width: 34, height: 34, objectFit: "contain" }}
              />
            </div>

            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#183B34",
                marginBottom: 4,
              }}
            >
              {lang === "ur"
                ? `${selectedWp.label} کا MPIN درج کریں`
                : `Enter ${selectedWp.label} MPIN`}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "#52635F",
                marginBottom: 16,
                lineHeight: 1.4,
              }}
            >
              Authorize payment of{" "}
              <strong style={{ color: "#087F63" }}>
                PKR {finalTotal.toLocaleString()}
              </strong>{" "}
              for Zarai Mandi {product} subscription.
            </p>

            {/* 4 Digit PIN Inputs */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  id={`billing-mpin-box-${idx}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={mpin[idx]}
                  autoFocus={idx === 0}
                  disabled={isProcessingMpin || mpinSuccess}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const updated = [...mpin];
                    updated[idx] = val ? val.slice(-1) : "";
                    setMpin(updated);
                    setMpinError("");
                    if (val && idx < 3) {
                      const nextInput = document.getElementById(
                        `billing-mpin-box-${idx + 1}`,
                      );
                      nextInput?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !mpin[idx] && idx > 0) {
                      const prevInput = document.getElementById(
                        `billing-mpin-box-${idx - 1}`,
                      );
                      prevInput?.focus();
                    }
                  }}
                  style={{
                    width: 48,
                    height: 52,
                    textAlign: "center",
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#183B34",
                    border: mpin[idx]
                      ? "2px solid #087F63"
                      : "1.5px solid #D5E2DD",
                    borderRadius: 12,
                    background: mpin[idx] ? "#E4F2EC" : "#FAFCFB",
                    outline: "none",
                    boxShadow: mpin[idx]
                      ? "0 2px 8px rgba(8,127,99,0.15)"
                      : "none",
                  }}
                />
              ))}
            </div>

            {mpinError && (
              <div
                style={{
                  fontSize: 11.5,
                  color: "#D95A51",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {mpinError}
              </div>
            )}

            {mpinSuccess ? (
              <div
                style={{
                  background: "#E8F5E9",
                  border: "1.5px solid #81C784",
                  borderRadius: 14,
                  padding: "12px",
                  color: "#1B5E20",
                  fontWeight: 800,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <span>✅</span>
                <span>Payment Authorized Successfully!</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleMpinSubmit}
                  disabled={isProcessingMpin}
                  className="tap-target w-full py-3 rounded-xl font-bold text-sm text-white"
                  style={{
                    background: isProcessingMpin ? "#52635F" : "#087F63",
                    cursor: isProcessingMpin ? "not-allowed" : "pointer",
                  }}
                >
                  {isProcessingMpin
                    ? "Authorizing Payment..."
                    : "Authorize & Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setMpinModalOpen(false)}
                  disabled={isProcessingMpin}
                  className="tap-target w-full py-2 text-xs font-semibold text-[#52635F]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscription Success Modal */}
      {subscribedModal && (
        <div
          className="zm-sheet-overlay"
          style={{
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(6, 45, 36, 0.75)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => {
            setSubscribedModal(false);
            onBack();
          }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-[#E5E7EB] screen-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#E4F2EC",
                color: "#087F63",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 900,
                margin: "0 auto 14px",
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "#183B34",
                marginBottom: 6,
              }}
            >
              {lang === "ur"
                ? "سبسکرپشن فعال ہو گئی!"
                : "Subscription Activated!"}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#52635F",
                marginBottom: 18,
                lineHeight: 1.4,
              }}
            >
              {lang === "ur"
                ? `آپ کے پاس اب ${tc(product)} کے تمام منڈی ریٹس اور تجزیات تک مکمل رسائی ہے۔`
                : `You now have full active access to ${product} live rates, analytics & market alerts.`}
            </p>
            <button
              onClick={() => {
                setSubscribedModal(false);
                onBack();
              }}
              className="tap-target w-full py-3 rounded-2xl text-white font-extrabold text-sm"
              style={{
                background: "#087F63",
                boxShadow: "0 4px 14px rgba(8,127,99,0.3)",
              }}
            >
              {lang === "ur"
                ? "منڈی ڈیش بورڈ پر جائیں"
                : "Go to Mandi Dashboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
