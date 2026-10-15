// Onboarding: pick the products you are interested in.

import { useState } from "react";
import { ICONS, PRODUCTS } from "../data";
import { Progress } from "../parts";

// ─── Screen 5 – Product Interests ────────────────────────────────────────────
export function InterestsScreen({
  onNext,
  onBack,
}: {
  onNext: (prods: string[]) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const filtered = PRODUCTS.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedItems = PRODUCTS.filter((p) => selected.includes(p.id));
  const monthlyTotal = selected.reduce(
    (s, id) => s + (PRODUCTS.find((p) => p.id === id)?.price ?? 0),
    0,
  );

  return (
    <div
      className="screen-scroll s-enter"
      style={{ alignItems: "center", padding: "32px 16px 35px" }}
    >
      <div className="auth-card" style={{ maxHeight: "none" }}>
        <Progress total={6} current={3} />
        <div className="eyebrow">Step 4 of 6</div>
        <div className="headline">What are you interested in?</div>
        <div className="subline">Select your favorite products</div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            className="fl-input filled"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{ paddingTop: 13, paddingBottom: 13 }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 14,
            maxHeight: 340,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => toggle(p.id)}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  border: selected.includes(p.id)
                    ? "2.5px solid var(--zm-green)"
                    : "2px solid var(--zm-border)",
                  background: selected.includes(p.id)
                    ? "var(--zm-light)"
                    : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 8,
                  transition: "border-color 0.18s, background 0.18s",
                  flexShrink: 0,
                }}
              >
                <img
                  src={ICONS[p.id]}
                  alt={p.label}
                  style={{ width: "80%", height: "80%", objectFit: "contain" }}
                />
              </button>
              {selected.includes(p.id) && (
                <div className="item-check" style={{ top: 0, right: "8%" }}>
                  ✓
                </div>
              )}
              <span
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  fontWeight: selected.includes(p.id) ? 700 : 500,
                  color: selected.includes(p.id)
                    ? "var(--zm-dark)"
                    : "var(--zm-muted)",
                  textAlign: "center",
                  lineHeight: 1.2,
                  maxWidth: 62,
                }}
              >
                {p.label}
              </span>
            </div>
          ))}
        </div>

        {selectedItems.length > 0 && (
          <div
            style={{
              background: "var(--zm-light)",
              borderRadius: 14,
              border: "1px solid rgba(15,138,95,0.18)",
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--zm-gold)",
                  fontWeight: 700,
                }}
              >
                Your Selection ({selectedItems.length})
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--zm-dark)",
                }}
              >
                PKR {monthlyTotal.toLocaleString()}/mo
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {selectedItems.map((p) => (
                <div
                  key={p.id}
                  className="sel-tag"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <img
                    src={ICONS[p.id]}
                    alt=""
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                  {p.label}
                  <button onClick={() => toggle(p.id)}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          disabled={selected.length === 0}
          onClick={() => onNext(selected)}
        >
          Continue →
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
