// Onboarding: representative account pending approval.

// ─── App ─────────────────────────────────────────────────────────────────────
// ─── Rep Pending Screen ───────────────────────────────────────────────────────
export function RepPendingScreen({
  name,
  onProceed,
}: {
  name: string;
  onProceed: () => void;
}) {
  return (
    <div
      className="screen-scroll s-enter"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px 40px",
      }}
    >
      <div className="auth-card" style={{ textAlign: "center" }}>
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--zm-light)",
            border: "2px solid rgba(8,127,99,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            margin: "0 auto 20px",
          }}
        >
          🕐
        </div>

        <div className="eyebrow" style={{ textAlign: "center" }}>
          Application Received
        </div>
        <div
          className="headline"
          style={{ textAlign: "center", fontSize: 20, marginBottom: 10 }}
        >
          We'll be in touch soon
        </div>

        <div
          style={{
            fontSize: 13.5,
            color: "var(--zm-muted)",
            lineHeight: 1.7,
            marginBottom: 24,
          }}
        >
          Thank you,{" "}
          <strong style={{ color: "var(--zm-dark)" }}>{name || "there"}</strong>
          . Your representative application has been submitted. Our operations
          team will review your details and verify your account within{" "}
          <strong style={{ color: "var(--zm-dark)" }}>24–48 hours</strong>.
        </div>

        {/* Horizontal Status Progress Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #FFFFFF, #F6FBF8)",
            border: "1.5px solid #B8DCCF",
            borderRadius: 16,
            padding: "16px 14px",
            boxShadow: "0 4px 16px rgba(6,77,64,0.06)",
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#183B34",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Application Status
              </span>
            </div>
          </div>

          {/* Animated Horizontal Progress Bar */}
          <div
            style={{
              width: "100%",
              height: 6,
              background: "#E2EFE9",
              borderRadius: 999,
              overflow: "hidden",
              margin: "6px 0 14px",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "50%",
                height: "100%",
                background: "linear-gradient(90deg, #087F63, #2FAE68)",
                borderRadius: 999,
                transition: "width 0.4s ease-in-out",
              }}
            />
          </div>

          {/* 3-Stage Horizontal Stepper */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {/* Step 1: Submitted */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#087F63",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 900,
                  marginBottom: 4,
                  boxShadow: "0 2px 6px rgba(8,127,99,0.25)",
                }}
              >
                ✓
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#087F63",
                  lineHeight: 1.15,
                }}
              >
                Submitted
              </span>
            </div>

            {/* Step 2: Ops Review (Active) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#E4F2EC",
                  border: "2px solid #087F63",
                  color: "#087F63",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  marginBottom: 4,
                  boxShadow: "0 0 0 3px rgba(8,127,99,0.15)",
                }}
              >
                ⏳
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#087F63",
                  lineHeight: 1.15,
                }}
              >
                Ops Review
              </span>
            </div>

            {/* Step 3: Active */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#F1F7F4",
                  border: "1.5px solid #D5E2DD",
                  color: "#80918B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                🚀
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#80918B",
                  lineHeight: 1.15,
                }}
              >
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Action button to proceed to Zarai Mandi app */}
        <button
          type="button"
          className="btn-primary"
          onClick={onProceed}
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, #087F63, #064D40)",
            boxShadow: "0 4px 16px rgba(8,127,99,0.35)",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Proceed to Zarai Mandi App →
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            background: "var(--zm-gold-lt)",
            border: "1px solid rgba(185,130,46,0.22)",
            borderRadius: 12,
            fontSize: 12.5,
            color: "var(--zm-muted)",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>💬</span>
          <span>
            Questions? WhatsApp us at{" "}
            <strong style={{ color: "var(--zm-dark)" }}>0300-0000000</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
