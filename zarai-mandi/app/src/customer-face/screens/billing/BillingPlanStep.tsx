// Billing step: plan duration (or custom months) and the price breakdown.

import { getMonthlyDiscount } from "../../shared/data/billing";
import { type BillingState } from "./useBilling";

export function BillingPlanStep({ s }: { s: BillingState }) {
  const {
    product,
    lang,
    tc,
    dur,
    setDur,
    customMode,
    setCustomMode,
    customMonths,
    setCustomMonths,
    iconSrc,
    basePrice,
    months,
    discount,
    regularTotal,
    discountAmt,
    finalTotal,
  } = s;
  return (
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
          border: customMode ? "2px solid #087F63" : "1.5px dashed #D5E2DD",
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
                    border: sel ? "2px solid #087F63" : "1.5px solid #D5E2DD",
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
                      color: sel ? "#D1FAE5" : disc > 0 ? "#16A34A" : "#80918B",
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
  );
}
