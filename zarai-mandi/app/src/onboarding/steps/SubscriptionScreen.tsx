// Onboarding: choose products and plan duration (pricing).

import { useState } from "react";
import { calcPricing, DURATION_LABELS, ICONS, PRODUCTS } from "../data";
import { Progress } from "../parts";

// ─── Screen 7 – Subscription ──────────────────────────────────────────────────
export function SubscriptionScreen({
  products,
  city,
  province,
  onTrial,
  onPay,
  onBack,
}: {
  products: string[];
  city: string;
  province: string;
  onTrial: () => void;
  onPay: (amount: number, dur: number) => void;
  onBack: () => void;
}) {
  const [dur, setDur] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customMonths, setCustomMonths] = useState<number | null>(null);

  const selectedItems = PRODUCTS.filter((p) => products.includes(p.id));
  const monthlyTotal = products.reduce((sum, id) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return sum + (p?.price ?? 0);
  }, 0);

  // Custom discount tiers
  function getCustomDiscount(months: number): number {
    if (months === 2) return 0.05;
    if (months === 4 || months === 5) return 0.125;
    if (months === 7 || months === 8) return 0.175;
    if (months === 9 || months === 10 || months === 11) return 0.2;
    return 0;
  }

  function getCustomDiscountLabel(months: number): string {
    if (months === 2) return "5% off";
    if (months === 4 || months === 5) return "12.5% off";
    if (months === 7 || months === 8) return "17.5% off";
    if (months === 9 || months === 10 || months === 11) return "20% off";
    return "";
  }

  // Pricing for standard tabs
  const { months, discount, regularTotal, discountAmt, finalTotal } = customMode
    ? (() => {
        const m = customMonths ?? 1;
        const d = getCustomDiscount(m);
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
    : calcPricing(products, dur);

  const CUSTOM_MONTH_OPTIONS = [2, 4, 5, 7, 8, 9, 10, 11];

  return (
    <div
      className="screen-scroll s-enter"
      style={{ alignItems: "center", padding: "36px 16px 32px" }}
    >
      <div className="auth-card" style={{ maxHeight: "none" }}>
        <Progress total={6} current={5} />
        <div className="eyebrow">Step 6 of 6</div>
        <div className="headline">Choose your ZM plan</div>
        <div className="subline">
          Prices are based on your selected products.
        </div>

        {/* ── Duration tabs row 1: standard 4 options ── */}
        <div
          style={{
            display: "flex",
            background: "rgba(15,138,95,0.07)",
            borderRadius: 12,
            padding: 4,
            gap: 3,
            marginBottom: 8,
          }}
        >
          {DURATION_LABELS.map((d, i) => (
            <button
              key={d}
              className={`dur-tab${!customMode && dur === i ? " active" : ""}`}
              onClick={() => {
                setCustomMode(false);
                setDur(i);
                setCustomMonths(null);
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* ── Customize button ── */}
        <button
          onClick={() => {
            setCustomMode(true);
            setCustomMonths(null);
          }}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: 12,
            border: customMode
              ? "2px solid var(--zm-green)"
              : "1.5px dashed var(--zm-border)",
            background: customMode ? "var(--zm-light)" : "#fff",
            color: customMode ? "var(--zm-green)" : "var(--zm-muted)",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            marginBottom: 16,
            transition: "border-color 0.15s, background 0.15s, color 0.15s",
          }}
        >
          <span style={{ fontSize: 15 }}>✦</span>
          Customize my own plan
        </button>

        {/* ── Custom month picker ── */}
        {customMode && (
          <div
            style={{
              border: "1.5px solid var(--zm-border)",
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            {[
              {
                label: "2 months",
                months: [2],
                discount: "5% off",
                disc: 0.05,
              },
              {
                label: "4 – 5 months",
                months: [4, 5],
                discount: "12.5% off",
                disc: 0.125,
              },
              {
                label: "7 – 8 months",
                months: [7, 8],
                discount: "17.5% off",
                disc: 0.175,
              },
              {
                label: "9 – 11 months",
                months: [9, 10, 11],
                discount: "20% off",
                disc: 0.2,
              },
            ].map((tier, ti) => {
              const tierSelected =
                customMonths !== null && tier.months.includes(customMonths);
              return (
                <div
                  key={ti}
                  style={{
                    borderBottom:
                      ti < 3 ? "1px solid var(--zm-border)" : "none",
                    background: tierSelected ? "var(--zm-light)" : "#fff",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Tier header row — always visible, clickable */}
                  <div
                    onClick={() => {
                      // If single-month tier, select immediately; else pick first
                      if (tier.months.length === 1) {
                        setCustomMonths(tier.months[0]);
                      } else {
                        setCustomMonths(
                          tierSelected ? customMonths : tier.months[0],
                        );
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 16px",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {/* Radio circle */}
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${tierSelected ? "var(--zm-green)" : "var(--zm-border)"}`,
                          flexShrink: 0,
                          position: "relative",
                          transition: "border-color 0.15s",
                        }}
                      >
                        {tierSelected && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 3,
                              borderRadius: "50%",
                              background: "var(--zm-green)",
                            }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: tierSelected ? 700 : 500,
                          color: tierSelected
                            ? "var(--zm-dark)"
                            : "var(--zm-muted)",
                        }}
                      >
                        {tier.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#16A34A",
                        background: "rgba(22,163,74,0.10)",
                        borderRadius: 20,
                        padding: "3px 10px",
                      }}
                    >
                      {tier.discount}
                    </span>
                  </div>

                  {/* Month chips — only when this tier is selected AND has multiple months */}
                  {tierSelected && tier.months.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                        padding: "0 16px 13px",
                      }}
                    >
                      {tier.months.map((m) => (
                        <button
                          key={m}
                          onClick={() => setCustomMonths(m)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border:
                              customMonths === m
                                ? "2px solid var(--zm-green)"
                                : "1.5px solid var(--zm-border)",
                            background:
                              customMonths === m ? "var(--zm-green)" : "#fff",
                            color:
                              customMonths === m ? "#fff" : "var(--zm-muted)",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            transition: "all 0.12s",
                          }}
                        >
                          {m} mo
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pricing breakdown — only show when month is determined ── */}
        {(!customMode || customMonths !== null) && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1.4px solid var(--zm-border)",
              marginBottom: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 16px 6px",
                borderBottom: "1px solid var(--zm-border)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--zm-gold)",
                  fontWeight: 700,
                }}
              >
                Product Pricing
              </div>
            </div>
            <div
              style={{
                maxHeight: 140,
                overflowY: "auto",
                scrollbarWidth: "thin",
              }}
              className="thin-scroll"
            >
              {selectedItems.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 16px",
                    borderBottom:
                      i < selectedItems.length - 1
                        ? "1px solid rgba(15,138,95,0.06)"
                        : "none",
                    fontSize: 12.5,
                    color: "var(--zm-muted)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <img
                      src={ICONS[p.id]}
                      alt=""
                      style={{ width: 24, height: 24, objectFit: "contain" }}
                    />
                    {p.label}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--zm-dark)" }}>
                    PKR {p.price.toLocaleString()}/mo
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                borderTop: "1.5px solid rgba(15,138,95,0.1)",
                background: "var(--zm-light)",
              }}
            >
              <div className="price-row" style={{ padding: "10px 16px" }}>
                <span>
                  Total/mo × {months} month{months > 1 ? "s" : ""}
                </span>
                <span>PKR {regularTotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div
                  className="price-row"
                  style={{ padding: "8px 16px", color: "#16A34A" }}
                >
                  <span style={{ fontWeight: 600 }}>
                    Discount (
                    {discount === 0.125
                      ? "12.5"
                      : discount === 0.175
                        ? "17.5"
                        : Math.round(discount * 100)}
                    % off)
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    − PKR {discountAmt.toLocaleString()}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderTop: "1px solid rgba(15,138,95,0.1)",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--zm-dark)",
                  }}
                >
                  Your Price
                </span>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--zm-dark)",
                    }}
                  >
                    PKR {finalTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--zm-muted)" }}>
                    PKR {Math.round(finalTotal / months).toLocaleString()}/mo
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          disabled={customMode && customMonths === null}
          onClick={() => onPay(finalTotal, customMode ? -1 : dur)}
        >
          Pay &amp; Subscribe — PKR{" "}
          {!customMode || customMonths !== null
            ? finalTotal.toLocaleString()
            : "—"}
        </button>

        <button
          className="btn-ghost"
          style={{
            margin: "10px auto 0",
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
