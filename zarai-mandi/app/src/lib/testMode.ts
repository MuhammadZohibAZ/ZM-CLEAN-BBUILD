// Testing controls (the "Skip / Reset" pill, the screen-version "Test" switch
// and their copies beside the desktop phone mockup) show only in test mode, so
// visitors never see them and they never sit on top of the app's own buttons.
//
// Test mode is on in `npm run dev`, and on the live site after opening it once
// with ?test=1 (remembered on that device; ?test=0 turns it off again).

const KEY = "zm-test-mode";

function readTestMode(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    const param = new URLSearchParams(window.location.search).get("test");
    if (param === "1") window.localStorage.setItem(KEY, "1");
    if (param === "0") window.localStorage.removeItem(KEY);
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    // Storage unavailable (private mode etc.): only this page load counts.
    return new URLSearchParams(window.location.search).get("test") === "1";
  }
}

export const TEST_MODE = readTestMode();
