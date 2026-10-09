export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const LOCAL_LOGIN_PATH = "/anmelden";
export const LOCAL_REGISTER_PATH = "/registrieren";

/** OAuth-Portal, nur wenn es konfiguriert ist. Sonst bleibt E-Mail und Passwort der Weg. */
export const getOAuthLoginUrl = (): string | null => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  if (!oauthPortalUrl || !appId) return null;

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
};

export const getLoginUrl = () => getOAuthLoginUrl() ?? LOCAL_LOGIN_PATH;
