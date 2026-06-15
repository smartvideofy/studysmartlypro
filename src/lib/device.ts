/**
 * Device detection helpers (client-side only).
 * Used to decide whether to surface platform-specific CTAs.
 */

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Exclude "Windows" to avoid false positives from some embedded UA strings.
  return /Android/i.test(ua) && !/Windows/i.test(ua);
}

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.studily.app";
