// Mobile-wallet MPIN entry dialog.

import { type BillingState } from "./useBilling";

export function BillingMpinDialog({ s }: { s: BillingState }) {
  const {
    product,
    lang,
    setMpinModalOpen,
    mpin,
    setMpin,
    mpinError,
    setMpinError,
    isProcessingMpin,
    mpinSuccess,
    finalTotal,
    handleMpinSubmit,
    selectedWp,
  } = s;
  return (
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
                border: mpin[idx] ? "2px solid #087F63" : "1.5px solid #D5E2DD",
                borderRadius: 12,
                background: mpin[idx] ? "#E4F2EC" : "#FAFCFB",
                outline: "none",
                boxShadow: mpin[idx] ? "0 2px 8px rgba(8,127,99,0.15)" : "none",
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
  );
}
