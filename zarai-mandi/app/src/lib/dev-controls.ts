/**
 * The testing pill (stage label + Skip / Reset) lives outside the phone screen:
 * in the desktop mockup (DevicePreview) it is drawn beside the phone, and the
 * app inside the mockup's iframe reports its stage and receives the action
 * through postMessage. On a real phone it only shows with ?dev=1.
 */

import { inDevicePreview } from "./device-orientation";

const STATE = "zm-dev-state";
const ACTION = "zm-dev-action";

export type DevState = { label: string; actionLabel: string; actionTitle: string };

/** Whether the app should draw the pill itself (real phone / ?device=off with ?dev=1). */
export function showInlineDevControls(): boolean {
  return !inDevicePreview() && new URLSearchParams(window.location.search).has("dev");
}

/** App → mockup: current stage label and what the action button does. */
export function publishDevState(state: DevState) {
  if (inDevicePreview()) window.parent.postMessage({ type: STATE, ...state }, window.location.origin);
}

/** App: run `handler` when the mockup's action button is pressed. */
export function onDevAction(handler: () => void) {
  const listener = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if ((event.data as { type?: string } | null)?.type === ACTION) handler();
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

/** Mockup: receive the app's stage. */
export function onDevState(handler: (state: DevState) => void) {
  const listener = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data as ({ type?: string } & DevState) | null;
    if (data?.type === STATE) handler({ label: data.label, actionLabel: data.actionLabel, actionTitle: data.actionTitle });
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

/** Mockup: press the action in the app running in `frame`. */
export function sendDevAction(frame: HTMLIFrameElement | null) {
  frame?.contentWindow?.postMessage({ type: ACTION }, window.location.origin);
}
