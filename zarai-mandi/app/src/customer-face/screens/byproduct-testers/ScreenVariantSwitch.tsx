import { useEffect, useRef, useState } from "react";

import { onScreenVariantPick, publishScreenVariants } from "../../../lib/device-bridge";
import { inDevicePreview } from "../../../lib/device-orientation";
import { URDU_FONT, useLang } from "../../shared/i18n/LangProvider";

// Testing switch on the by-product screen between the original card grid and
// the two tester variants. In the desktop phone mockup it sits outside the
// phone (like the testing pill); on a real phone it's a floating "Test" button.
// The choice is remembered on this device only.

export type ByproductScreenVariant = "original" | "attribute" | "rateType";

const STORAGE_KEY = "zm.byproductScreenVariant";
const VARIANTS: ByproductScreenVariant[] = ["original", "attribute", "rateType"];

const LABELS: Record<ByproductScreenVariant, { en: string; ur: string; hintEn: string; hintUr: string }> = {
  original: { en: "Original", ur: "اصل", hintEn: "One card per by-product", hintUr: "ہر ضمنی مصنوع کا ایک کارڈ" },
  attribute: {
    en: "Special attribute filter",
    ur: "خصوصی وصف فلٹر",
    hintEn: "A card per attribute value",
    hintUr: "ہر وصف کی قدر کا الگ کارڈ",
  },
  rateType: {
    en: "Rate type filter",
    ur: "ریٹ کی قسم فلٹر",
    hintEn: "A card per rate type",
    hintUr: "ہر ریٹ کی قسم کا الگ کارڈ",
  },
};

export function useByproductScreenVariant(): [ByproductScreenVariant, (v: ByproductScreenVariant) => void] {
  const [variant, setVariant] = useState<ByproductScreenVariant>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as ByproductScreenVariant | null;
      return saved && VARIANTS.includes(saved) ? saved : "original";
    } catch {
      return "original";
    }
  });
  const update = (v: ByproductScreenVariant) => {
    setVariant(v);
    try {
      window.localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // Storage unavailable (private mode etc.): the choice just isn't remembered.
    }
  };
  return [variant, update];
}

export function ScreenVariantSwitch({
  variant,
  onChange,
}: {
  variant: ByproductScreenVariant;
  onChange: (v: ByproductScreenVariant) => void;
}) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const inDevice = inDevicePreview();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // In the mockup: offer the versions to the picker beside the phone.
  useEffect(() => {
    if (!inDevice) return;
    publishScreenVariants({
      title: "Screen version (testing)",
      active: variant,
      options: VARIANTS.map((v) => ({ id: v, label: LABELS[v].en })),
    });
  }, [inDevice, variant]);
  useEffect(() => {
    if (!inDevice) return;
    const off = onScreenVariantPick((id) => {
      if (VARIANTS.includes(id as ByproductScreenVariant)) onChangeRef.current(id as ByproductScreenVariant);
    });
    return () => {
      off();
      publishScreenVariants(null);
    };
  }, [inDevice]);
  const rootRef = useRef<HTMLDivElement>(null);
  const font = lang === "ur" ? URDU_FONT : "inherit";

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  if (inDevice) return null;

  return (
    <div
      ref={rootRef}
      className="absolute z-30"
      style={{ left: 12, bottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)", fontFamily: font }}
    >
      {open && (
        <div
          role="menu"
          className="mb-2 w-60 rounded-2xl p-1.5"
          style={{
            background: "rgba(255, 255, 255, 0.97)",
            border: "1.2px solid rgba(16, 185, 129, 0.35)",
            boxShadow: "0 10px 30px rgba(6, 77, 64, 0.18)",
          }}
        >
          <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-black uppercase tracking-wide text-[#087F63]">
            {lang === "ur" ? "اسکرین کا ورژن (ٹیسٹ)" : "Screen version (testing)"}
          </p>
          {VARIANTS.map((v) => {
            const on = v === variant;
            const l = LABELS[v];
            return (
              <button
                key={v}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  onChange(v);
                  setOpen(false);
                }}
                className="tap-target w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition active:scale-[0.98]"
                style={{ background: on ? "rgba(167, 243, 208, 0.45)" : "transparent" }}
              >
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ border: `1.5px solid ${on ? "#10B981" : "#B7CFC6"}`, background: on ? "#10B981" : "transparent" }}
                >
                  {on && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-[#143B33] leading-tight">
                    {lang === "ur" ? l.ur : l.en}
                  </span>
                  <span className="block text-[10.5px] font-semibold text-[#52635F] leading-tight">
                    {lang === "ur" ? l.hintUr : l.hintEn}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="tap-target zm-beam-border flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold transition active:scale-95"
        style={{
          background: variant === "original"
            ? "rgba(255, 255, 255, 0.92)"
            : "linear-gradient(135deg, rgba(167, 243, 208, 0.95), rgba(110, 231, 183, 0.9))",
          color: "#064E3B",
          border: "1.2px solid #10B981",
          boxShadow: "0 4px 14px rgba(6, 77, 64, 0.16)",
          fontSize: 12,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 3h6" />
          <path d="M10 3v6L4.5 18.5A1.6 1.6 0 0 0 5.9 21h12.2a1.6 1.6 0 0 0 1.4-2.5L14 9V3" />
          <path d="M7.5 15h9" />
        </svg>
        <span>{lang === "ur" ? "ٹیسٹ" : "Test"}</span>
        {variant !== "original" && (
          <span className="text-[10.5px] font-semibold text-[#087F63]">
            · {lang === "ur" ? LABELS[variant].ur : LABELS[variant].en}
          </span>
        )}
      </button>
    </div>
  );
}
