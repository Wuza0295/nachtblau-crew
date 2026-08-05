/** Single source for cross-platform release metadata (web, Allxion, Linux, Android). */
export const RELEASE = {
  /** Bump when shipping a synced build across webspace + clients. */
  version: "1.1.1",
  buildId: "2026-08-05-sync",
  productName: "NachtBlau Crew",
  allxionName: "Allxion",
  /** Static SPA path on nacht-blau.de (Webspace + Android WebView + Linux shell). */
  allxionPath: "/allxion",
  allxionUrl: "https://nacht-blau.de/allxion/",
  /** Set via VITE_API_ORIGIN when building Allxion; Manus-Deploy-URL eintragen. */
  apiOriginDefault: "",
} as const;

export function allxionBasePath(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}
