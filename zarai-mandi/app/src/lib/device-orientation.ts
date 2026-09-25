/**
 * Orientation requests between the app and the desktop phone mockup
 * (DevicePreview). Inside the mockup the app runs in an iframe; asking for
 * landscape rotates the mockup. On a real phone the user rotates the device.
 */

export type DeviceOrientation = "portrait" | "landscape";

const MESSAGE = "zm-device-orientation";

/** True when the app is running inside the desktop phone mockup. */
export function inDevicePreview(): boolean {
  try {
    return window.self !== window.top && window.parent.location.origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Ask the mockup to rotate. No-op outside the mockup. */
export function requestDeviceOrientation(orientation: DeviceOrientation) {
  if (inDevicePreview()) window.parent.postMessage({ type: MESSAGE, orientation }, window.location.origin);
}

/** Used by DevicePreview to receive requests from its iframe. */
export function onDeviceOrientationRequest(handler: (orientation: DeviceOrientation) => void) {
  const listener = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data as { type?: string; orientation?: DeviceOrientation } | null;
    if (data?.type === MESSAGE && (data.orientation === "portrait" || data.orientation === "landscape")) handler(data.orientation);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
