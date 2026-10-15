// Onboarding: payment method and confirmation.

import { useState } from "react";
import { DURATION_LABELS } from "../data";

// ─── Screen 8 – Payment Confirmation ─────────────────────────────────────────
export function PaymentScreen({
  amount,
  durIdx,
  onConfirm,
  onBack,
}: {
  amount: number;
  durIdx: number;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [paymentType, setPaymentType] = useState<"card" | "direct" | "">("");
  const [directMethod, setDirectMethod] = useState<
    "jazzcash" | "easypaisa" | "bank" | ""
  >("");
  const [hasFile, setHasFile] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  const planLabel = durIdx === -1 ? "Custom" : DURATION_LABELS[durIdx];

  const directMethods = [
    {
      id: "jazzcash",
      label: "JazzCash",
      color: "#E83D2B",
      iconSrc: "/src/icons/jazz.png",
      sub: "Send via JazzCash mobile wallet",
    },
    {
      id: "easypaisa",
      label: "EasyPaisa",
      color: "#4CAF50",
      iconSrc: "/src/icons/easypaisa.png",
      sub: "Send via EasyPaisa mobile wallet",
    },
    {
      id: "bank",
      label: "Bank Transfer",
      color: "#1565C0",
      iconSrc: "/src/icons/banktransfer.png",
      sub: "Direct bank / IBFT transfer",
    },
  ] as const;

  const directDetails: Record<string, { rows: [string, string][] }> = {
    jazzcash: {
      rows: [
        ["Account", "03058107777"],
        ["Account Name", "Muhammad Ghasharib Ali Shaukat"],
        ["Amount", `PKR ${amount.toLocaleString()}`],
      ],
    },
    easypaisa: {
      rows: [
        ["Account", "03048107777"],
        ["Account Name", "Abdul Raafey Shaukat"],
        ["Amount", `PKR ${amount.toLocaleString()}`],
      ],
    },
    bank: {
      rows: [
        ["Bank", "HBL"],
        ["Account Title", "Zarai Mandi Private Limited"],
        ["Account No.", "5000-7909-9814-03"],
        ["IBAN", "PK04HABB05000079089814030"],
        ["Amount", `PKR ${amount.toLocaleString()}`],
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

  const cardValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    cardHolder.trim().length > 1;

  const directReady = directMethod !== "" && hasFile;

  const canConfirm =
    paymentType === "card"
      ? cardValid
      : paymentType === "direct"
        ? directReady
        : false;

  // Shared input style
  const inputStyle = (filled: boolean): React.CSSProperties => ({
    width: "100%",
    height: 48,
    padding: "0 14px",
    border: `1.5px solid ${filled ? "var(--zm-green)" : "var(--zm-border)"}`,
    borderRadius: 12,
    fontSize: 14,
    color: "var(--zm-text)",
    background: "#fff",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    transition: "border-color .15s",
    boxSizing: "border-box" as const,
  });

  return (
    <div
      className="screen-scroll s-enter"
      style={{ alignItems: "center", padding: "36px 16px 32px" }}
    >
      <div className="auth-card" style={{ maxHeight: "none" }}>
        <div className="eyebrow">Payment Confirmation</div>
        <div className="headline">Complete your payment</div>
        <div className="subline">
          Pay{" "}
          <strong style={{ color: "var(--zm-dark)" }}>
            PKR {amount.toLocaleString()}
          </strong>{" "}
          for the{" "}
          <strong style={{ color: "var(--zm-dark)" }}>{planLabel}</strong> plan.
        </div>

        {/* ── Payment type selector ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {(
            [
              {
                id: "card",
                icon: "💳",
                label: "Card Payment",
                sub: "Debit or credit card",
              },
              {
                id: "direct",
                icon: "📲",
                label: "Direct Transfer",
                sub: "JazzCash, EasyPaisa, Bank",
              },
            ] as const
          ).map((opt) => {
            const active = paymentType === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setPaymentType(opt.id);
                  setDirectMethod("");
                  setHasFile(false);
                }}
                style={{
                  padding: "16px 10px",
                  borderRadius: 14,
                  border: active
                    ? "2px solid var(--zm-green)"
                    : "1.5px solid var(--zm-border)",
                  background: active ? "var(--zm-light)" : "#fff",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{opt.icon}</div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: active ? "var(--zm-green)" : "var(--zm-dark)",
                    lineHeight: 1.2,
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "var(--zm-muted)",
                    marginTop: 3,
                    lineHeight: 1.3,
                  }}
                >
                  {opt.sub}
                </div>
                {active && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--zm-green)",
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ══ Card Payment ══ */}
        {paymentType === "card" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Card number */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--zm-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Card Number
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  style={inputStyle(
                    cardNumber.replace(/\s/g, "").length === 16,
                  )}
                />
                {/* Card type hint */}
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 18,
                    opacity: 0.4,
                  }}
                >
                  {cardNumber.startsWith("4")
                    ? "💳"
                    : cardNumber.startsWith("5")
                      ? "💳"
                      : "💳"}
                </span>
              </div>
            </div>

            {/* Expiry + CVV */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--zm-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Expiry Date
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  style={inputStyle(expiry.length === 5)}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--zm-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Security Code
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="CVV"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  style={inputStyle(cvv.length >= 3)}
                />
              </div>
            </div>

            {/* Card holder */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--zm-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Cardholder Name
              </div>
              <input
                type="text"
                placeholder="Name on card"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                style={inputStyle(cardHolder.trim().length > 1)}
              />
            </div>

            {/* Security note */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 12px",
                background: "var(--zm-surface)",
                borderRadius: 10,
                border: "1px solid var(--zm-border)",
              }}
            >
              <span style={{ fontSize: 14 }}>🔒</span>
              <span
                style={{
                  fontSize: 11.5,
                  color: "var(--zm-muted)",
                  lineHeight: 1.4,
                }}
              >
                Your card details are encrypted and never stored.
              </span>
            </div>
          </div>
        )}

        {/* ══ Direct Transfer ══ */}
        {paymentType === "direct" && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--zm-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Choose Method
            </div>
            {directMethods.map((m) => (
              <div
                key={m.id}
                className={`pay-method${directMethod === m.id ? " selected" : ""}`}
                onClick={() => setDirectMethod(m.id)}
              >
                <div
                  style={{
                    background: `${m.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={m.iconSrc}
                    alt={m.label}
                    style={{ width: 30, height: 30, objectFit: "contain" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--zm-text)",
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--zm-muted)",
                      marginTop: 1,
                    }}
                  >
                    {m.sub}
                  </div>
                </div>
                {directMethod === m.id && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="11"
                      fill="#0F8A5F"
                      opacity="0.15"
                    />
                    <path
                      d="M7 12.5l3.5 3.5 6.5-7"
                      stroke="#0F8A5F"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            ))}

            {/* Payment details box */}
            {directMethod && (
              <>
                <div className="pay-detail-box" style={{ marginTop: 4 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--zm-gold)",
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    Payment Details
                  </div>
                  {directDetails[directMethod].rows.map(([k, v]) => (
                    <div key={k} className="pay-detail-row">
                      <span>{k}</span>
                      <span
                        style={{
                          fontFamily:
                            k === "IBAN" || k === "Account No."
                              ? "monospace"
                              : "inherit",
                          fontSize: k === "IBAN" ? 11 : 13,
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Screenshot upload */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--zm-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Upload Payment Screenshot
                </div>
                <div
                  className={`upload-area${hasFile ? " has-file" : ""}`}
                  onClick={() => setHasFile(true)}
                >
                  {hasFile ? (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--zm-dark)",
                        }}
                      >
                        Screenshot attached
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--zm-muted)",
                          marginTop: 3,
                        }}
                      >
                        Tap to change
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--zm-text)",
                        }}
                      >
                        Tap to upload screenshot
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--zm-muted)",
                          marginTop: 3,
                        }}
                      >
                        JPG, PNG — Max 10 MB
                      </div>
                    </>
                  )}
                </div>
                {!hasFile && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 11.5,
                      color: "var(--zm-muted)",
                      marginTop: 4,
                    }}
                  >
                    Upload your screenshot to confirm.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Confirm button ── */}
        {paymentType && (
          <button
            className="btn-primary"
            disabled={!canConfirm}
            onClick={onConfirm}
            style={{ marginTop: 16 }}
          >
            Confirm &amp; Pay — PKR {amount.toLocaleString()} →
          </button>
        )}

        <button
          className="btn-ghost"
          style={{
            margin: "12px auto 0",
            display: "flex",
            fontSize: 14,
            padding: "8px 16px",
          }}
          onClick={onBack}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
