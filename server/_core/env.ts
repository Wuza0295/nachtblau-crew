export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  kasLogin: process.env.KAS_LOGIN ?? "",
  kasPassword: process.env.KAS_PASSWORD ?? "",
  webspaceBaseDomain: process.env.WEBSPACE_BASE_DOMAIN ?? "nacht-blau.de",
  webspaceSubdomainPath: process.env.WEBSPACE_SUBDOMAIN_PATH ?? "/webspace/",
  kasEnabled:
    Boolean(process.env.KAS_LOGIN) &&
    Boolean(process.env.KAS_PASSWORD) &&
    process.env.KAS_ENABLED !== "false",
};
