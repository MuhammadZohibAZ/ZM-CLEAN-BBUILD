// "You're subscribed" success dialog.

import { type BillingState } from "./useBilling";

export function SubscribedDialog({ s }: { s: BillingState }) {
  const { product, onBack, lang, tc, setSubscribedModal } = s;
  return (
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
          {lang === "ur" ? "سبسکرپشن فعال ہو گئی!" : "Subscription Activated!"}
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
          {lang === "ur" ? "منڈی ڈیش بورڈ پر جائیں" : "Go to Mandi Dashboard"}
        </button>
      </div>
    </div>
  );
}
