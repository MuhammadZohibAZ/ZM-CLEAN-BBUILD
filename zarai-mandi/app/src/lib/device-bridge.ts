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
