/**
 * App ↔ desktop phone mockup (DevicePreview) bridge, besides orientation
 * (see device-orientation.ts).
 *
 * - Full-bleed: a screen whose top is an image hero (Home) lets its content run
 *   under the status bar, like a native iOS app. It sets `data-zm-bleed` on the
 *   app's <html>; the mockup then lays the screen under the status bar and the
 *   app gets `--zm-bleed-top` (index.css) to pad its header by.
 * - Dev controls: the testing pill (Onboarding / Customer App + Skip / Reset)
 *   is drawn by the mockup outside the phone rather than over the app.
 */

import { inDevicePreview } from "./device-orientation";

/** Status bar height inside the mockup (iPhone 15 Pro). */
export const DEVICE_STATUS_BAR = 54;

const CONTROLS = "zm-dev-controls";
const COMMAND = "zm-dev-command";

/** Marks the app as running in the mockup so index.css can apply its insets. */
export function markDevicePreview() {
  if (inDevicePreview()) document.documentElement.classList.add("zm-device");
}

/** Let the current screen run under the status bar (no-op outside the mockup). */
export function setFullBleed(on: boolean) {
  const root = document.documentElement;
  if (on) root.setAttribute("data-zm-bleed", "");
  else root.removeAttribute("data-zm-bleed");
}

export type DevControls = { label: string; action: string; title: string };

/** App → mockup: what the testing pill should show. */
export function publishDevControls(controls: DevControls) {
  if (inDevicePreview()) window.parent.postMessage({ type: CONTROLS, ...controls }, window.location.origin);
}

/** App: run `handler` when the mockup's testing pill button is pressed. */
export function onDevCommand(handler: () => void) {
  const listener = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if ((event.data as { type?: string } | null)?.type === COMMAND) handler();
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

/** Mockup: receive the app's testing pill state. */
export function onDevControls(handler: (controls: DevControls) => void) {
  const listener = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data as ({ type?: string } & DevControls) | null;
    if (data?.type === CONTROLS) handler({ label: data.label, action: data.action, title: data.title });
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

/** Mockup: press the testing pill button in the app inside `frame`. */
export function sendDevCommand(frame: HTMLIFrameElement | null) {
  frame?.contentWindow?.postMessage({ type: COMMAND }, window.location.origin);
}

// ── Screen variants (testing): a screen offering alternative versions, e.g. the
// by-product screen's Original / Special attribute / Rate type filters. In the
// mockup the picker sits beside the phone, like the testing pill.

const VARIANTS = "zm-screen-variants";
const VARIANT_PICK = "zm-screen-variant-pick";

export type ScreenVariants = { title: string; active: string; options: { id: string; label: string }[] };

/** App → mockup: the versions the current screen offers (null when it closes). */
export function publishScreenVariants(variants: ScreenVariants | null) {
  if (inDevicePreview()) window.parent.postMessage({ type: VARIANTS, variants }, window.location.origin);
}

/** App: run `handler` when a version is picked in the mockup. */
export function onScreenVariantPick(handler: (id: string) => void) {
  const listener = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data as { type?: string; id?: string } | null;
    if (data?.type === VARIANT_PICK && data.id) handler(data.id);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

/** Mockup: receive the current screen's versions. */
export function onScreenVariants(handler: (variants: ScreenVariants | null) => void) {
  const listener = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data as { type?: string; variants?: ScreenVariants | null } | null;
    if (data?.type === VARIANTS) handler(data.variants ?? null);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

/** Mockup: pick a version in the app inside `frame`. */
export function sendScreenVariantPick(frame: HTMLIFrameElement | null, id: string) {
  frame?.contentWindow?.postMessage({ type: VARIANT_PICK, id }, window.location.origin);
}
