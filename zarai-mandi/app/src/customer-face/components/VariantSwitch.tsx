import { useEffect, useRef, useState } from "react";

import { onScreenVariantPick, publishScreenVariants } from "../../lib/device-bridge";
import { inDevicePreview } from "../../lib/device-orientation";
import { TEST_MODE } from "../../lib/testMode";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";

// Testing switch between alternative versions of a screen. In the desktop
// phone mockup it sits outside the phone (like the testing pill); on a real
// phone it's a floating "Test" button. Only in test mode (lib/testMode.ts);
// visitors always get the first option. The first option is the default and
// the choice is remembered on this device only.

export type VariantOption<T extends string> = {
  id: T;
  en: string;
  ur: string;
  hintEn: string;
  hintUr: string;
};

export function useStoredVariant<T extends string>(storageKey: string, ids: readonly T[]): [T, (v: T) => void] {
  const [variant, setVariant] = useState<T>(() => {
    if (!TEST_MODE) return ids[0]; // visitors always get the default version
    try {
      const saved = window.localStorage.getItem(storageKey) as T | null;
      return saved && ids.includes(saved) ? saved : ids[0];
    } catch {
      return ids[0];
    }
  });
  const update = (v: T) => {
    setVariant(v);
    try {
      window.localStorage.setItem(storageKey, v);
    } catch {
      // Storage unavailable (private mode etc.): the choice just isn't remembered.
    }
  };
  return [variant, update];
}

export function VariantSwitch<T extends string>({
  options,
  variant,
  onChange,
}: {
  options: readonly VariantOption<T>[];
  variant: T;
  onChange: (v: T) => void;
}) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const inDevice = inDevicePreview();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const ids = options.map((o) => o.id);
  const idsKey = ids.join("|");
  const current = options.find((o) => o.id === variant) ?? options[0];
  const isDefault = variant === options[0].id;

  // In the mockup: offer the versions to the picker beside the phone.
  useEffect(() => {
    if (!inDevice || !TEST_MODE) return;
    publishScreenVariants({
      title: "Screen version (testing)",
      active: variant,
      options: options.map((o) => ({ id: o.id, label: o.en })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inDevice, variant, idsKey]);
  useEffect(() => {
    if (!inDevice || !TEST_MODE) return;
    const off = onScreenVariantPick((id) => {
      if (ids.includes(id as T)) onChangeRef.current(id as T);
    });
    return () => {
      off();
      publishScreenVariants(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inDevice, idsKey]);
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

  if (inDevice || !TEST_MODE) return null;

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
          {options.map((o) => {
            const on = o.id === variant;
            return (
              <button
                key={o.id}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  onChange(o.id);
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
                    {lang === "ur" ? o.ur : o.en}
                  </span>
                  <span className="block text-[10.5px] font-semibold text-[#52635F] leading-tight">
                    {lang === "ur" ? o.hintUr : o.hintEn}
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
          background: isDefault
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
        {!isDefault && (
          <span className="text-[10.5px] font-semibold text-[#087F63]">
            · {lang === "ur" ? current.ur : current.en}
          </span>
        )}
      </button>
    </div>
  );
}
