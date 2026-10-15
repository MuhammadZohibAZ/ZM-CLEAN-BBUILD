import { useState } from "react";

//  product RATES

//  HISTORICAL DATA REQUEST SHEET

export function HistoricalRequestSheet({
  subject,
  onClose,
}: {
  subject: string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="zm-sheet-overlay" style={{ zIndex: 200 }} onClick={onClose}>
      <div
        className="zm-sheet"
        style={{ background: "#F4FAF7", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 border-b border-[#DCE8E3] flex items-center justify-between">
          <div>
            <p className="font-bold text-base">Request Historical Data</p>
            <p className="text-xs" style={{ color: "#52635F" }}>
              Our team will send it to you
            </p>
          </div>
          <button
            onClick={onClose}
            className="tap-target text-xl w-8"
            style={{ color: "#52635F" }}
          ></button>
        </div>
        {sent ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <span style={{ fontSize: 52 }}></span>
            <p className="font-bold text-lg" style={{ color: "#075E4F" }}>
              Request sent
            </p>
            <p className="text-sm" style={{ color: "#52635F" }}>
              Our sales team will get back to you with the data you asked for.
            </p>
            <button
              onClick={onClose}
              className="tap-target mt-2 rounded-2xl px-6 py-3 font-bold text-white"
              style={{ background: "#087F63" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold" style={{ color: "#183B34" }}>
              What would you like to know?
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={`e.g. "Show me ${subject} rates for Lahore for the last 6 months"`}
              className="w-full rounded-2xl p-4 text-sm outline-none"
              style={{
                background: "#F1F7F4",
                border: "1.5px solid #D5E2DD",
                resize: "none",
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setText(
                    (t) =>
                      t || `Show me ${subject} rates for the last 6 months`,
                  )
                }
                className="tap-target flex-shrink-0 rounded-2xl px-4 py-3 font-bold text-sm flex items-center gap-2"
                style={{
                  background: "#E4F2EC",
                  color: "#075E4F",
                  border: "1px solid #C7E8D8",
                }}
              >
                Speak
              </button>
              <button
                onClick={() => setSent(true)}
                disabled={!text.trim()}
                className="tap-target flex-1 rounded-2xl py-3 font-bold text-white text-sm"
                style={{
                  background: text.trim() ? "#087F63" : "#C7D6D0",
                  boxShadow: text.trim()
                    ? "0 4px 16px rgba(15,138,95,0.25)"
                    : "none",
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
