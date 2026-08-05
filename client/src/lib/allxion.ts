import { ALLXION } from "@shared/site";

/** Allxion navigation paths (canonical + /portal aliases in App.tsx) */
export const ALLXION_ROUTES = {
  hub: ALLXION.hubPath,
  fluss: "/fluss",
  kreise: "/kreise",
  momente: "/momente",
  crew: "/crew",
} as const;

export function isAllxionHubPath(path: string) {
  return path === "/" || path === "/portal" || path.startsWith("/portal?");
}

export function isAllxionFlussPath(path: string) {
  return path === "/fluss" || path.startsWith("/portal/fluss");
}

export function isAllxionKreisePath(path: string) {
  return path === "/kreise" || path.startsWith("/portal/kreise");
}

export function isAllxionMomentePath(path: string) {
  return path === "/momente" || path.startsWith("/portal/momente");
}
