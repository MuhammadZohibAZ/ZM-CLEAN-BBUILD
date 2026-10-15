// Onboarding: representative dashboard preview.

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard({
  name,
  city,
  province,
  onBack,
}: {
  name: string
  city: string
  province: string
  onBack: () => void
}) {
  const prices = [
    { label: "Wheat", price: "4,200", change: "+2.1%", up: true },
    { label: "Rice", price: "6,800", change: "+0.8%", up: true },
    { label: "Cotton", price: "9,500", change: "-1.3%", up: false },
    { label: "Maize", price: "2,900", change: "+3.5%", up: true },
  ]

  return (
    <div className="screen-scroll s-enter" style={{ padding: "0 0 24px" }}>
      <div
        style={{
          padding: "48px 20px 22px",
          position: "relative",
          background:
            "linear-gradient(160deg, var(--zm-dark), var(--zm-green))",
          color: "white",
        }}
      >
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: 14,
            left: 16,
            background: "rgba(255,255,255,0.14)",
            border: "none",
            borderRadius: 20,
            padding: "5px 14px",
            color: "white",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          ← Back
        </button>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.65,
            marginBottom: 3,
            marginTop: 14,
          }}
        >
          Good morning
        </div>
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {name || "Customer"}
        </div>
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 3 }}>
          {city || "Lahore"}, {province || "Punjab"} — 3-Day Trial Active
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ marginTop: 20, marginBottom: 10 }}>
          <div className="eyebrow">Live Mandi Prices</div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 18,
          }}
        >
          {prices.map((c) => (
            <div
              key={c.label}
              style={{
                background: "white",
                borderRadius: 16,
                padding: "14px",
                border: "1px solid var(--zm-border)",
                boxShadow: "0 2px 12px rgba(10,94,67,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--zm-muted)",
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: "var(--zm-dark)",
                }}
              >
                PKR {c.price}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  marginTop: 3,
                  color: c.up ? "#16A34A" : "#DC2626",
                }}
              >
                {c.change} today
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "var(--zm-gold-lt)",
            border: "1px solid rgba(185,130,46,0.22)",
            borderRadius: 14,
            padding: "13px 15px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--zm-gold)",
              marginTop: 5,
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: "var(--zm-dark)",
                marginBottom: 1,
              }}
            >
              Market Alert
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--zm-muted)",
                lineHeight: 1.4,
              }}
            >
              Cotton prices down in Multan Mandi — check rates
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {["Prices", "Market", "Alerts", "Profile"].map((tab, i) => (
            <button
              key={tab}
              style={{
                flex: 1,
                padding: "10px 4px",
                border: "none",
                borderRadius: 10,
                background:
                  i === 0 ? "var(--zm-green)" : "rgba(15,138,95,0.07)",
                color: i === 0 ? "white" : "var(--zm-muted)",
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
