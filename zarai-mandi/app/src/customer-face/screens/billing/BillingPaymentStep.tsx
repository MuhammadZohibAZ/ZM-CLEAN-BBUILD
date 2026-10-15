// Billing step: mobile wallet, card or direct transfer payment.

import { type BillingState } from "./useBilling";

export function BillingPaymentStep({ s }: { s: BillingState }) {
  const {
    lang,
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
    v,
    iconSrc,
    walletProviders,
    directMethods,
    directDetails,
    formatCardNumber,
    formatExpiry,
    formatPhoneInput,
  } = s;
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#183B34" }}>
          {lang === "ur" ? "ادائیگی مکمل کریں" : "Complete Your Payment"}
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
                border: active ? "2px solid #087F63" : "1.5px solid #D5E2DD",
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
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
                  background: directMethod === m.id ? "#E4F2EC" : "#fff",
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
  );
}
