import { RELEASE } from "@shared/release";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Origin that hosts the Express + tRPC backend (Manus deploy). */
export function getApiOrigin(): string {
  const fromEnv = import.meta.env.VITE_API_ORIGIN as string | undefined;
  if (fromEnv?.trim()) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const base = import.meta.env.BASE_URL ?? "/";
    const isAllxionHost = base.includes("allxion");
    if (!isAllxionHost) {
      return window.location.origin;
    }
  }
  return RELEASE.apiOriginDefault;
}

// Generate login URL at runtime so redirect URI reflects the API host.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${getApiOrigin()}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
