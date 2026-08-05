/** Vite `base` (e.g. `/` or `/allxion/`). No trailing slash. */
export function getAppBasePath(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  if (base === "/") return "";
  return base.replace(/\/$/, "");
}

export function getTrpcUrl(): string {
  const origin = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/$/, "");
  if (origin) return `${origin}/api/trpc`;
  const base = getAppBasePath();
  return `${base}/api/trpc`.replace("//", "/");
}
