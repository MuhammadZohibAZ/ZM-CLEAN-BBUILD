import type React from "react";

import type { Fmt } from "./format";
import { C } from "./theme";
import { BottomSheet } from "./ui";

export type PickerOption = { id: string; label: string; meta?: string; disabled?: boolean };

/**
 * One list-style picker used for rate type, province and sort, so those
 * choices live behind a single compact pill instead of rows of chips.
 * `multi` turns it into a checklist (used by Compare, up to `max`).
 */
export function PickerSheet({
  f,
  title,
  subtitle,
  options,
  value,
  onChange,
  onClose,
  multi = false,
  max = 4,
  footer,
}: {
  f: Fmt;
  title: string;
  subtitle?: string;
  options: PickerOption[];
  value: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
  multi?: boolean;
  max?: number;
  footer?: React.ReactNode;
}) {
  const pick = (id: string) => {
    if (!multi) {
      onChange([id]);
      onClose();
      return;
    }
    if (value.includes(id)) onChange(value.length > 1 ? value.filter((v) => v !== id) : value);
    else if (value.length < max) onChange([...value, id]);
  };

  return (
    <BottomSheet onClose={onClose} title={title} subtitle={subtitle} dir={f.dir} font={f.font} display={f.display} footer={footer}>
      <div role={multi ? "group" : "listbox"} aria-label={title} style={{ borderRadius: 18, background: C.surface, overflow: "hidden" }}>
        {options.map((o, k) => {
          const on = value.includes(o.id);
          const full = multi && !on && value.length >= max;
          const disabled = o.disabled || full;
          return (
            <button
              key={o.id}
              type="button"
              role={multi ? "checkbox" : "option"}
              aria-checked={multi ? on : undefined}
              aria-selected={multi ? undefined : on}
              disabled={disabled}
              onClick={() => pick(o.id)}
              style={{
                width: "100%",
                minHeight: 52,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 16px",
                border: "none",
                borderTop: k ? `1px solid ${C.lineSoft}` : "none",
                background: C.surface,
                textAlign: "start",
                fontFamily: f.font,
                color: disabled ? C.faint : C.ink,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <span style={{ flex: 1, fontSize: 15, fontWeight: on ? 700 : 500, lineHeight: f.lh }}>{o.label}</span>
              {o.meta && <span style={{ fontSize: 12.5, fontWeight: 500, color: C.muted }}>{o.meta}</span>}
              <span
                aria-hidden="true"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: multi ? 7 : 11,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: on ? "none" : `1.5px solid ${C.line}`,
                  background: on ? C.brand : "transparent",
                }}
              >
                {on && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
