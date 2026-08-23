import { WEBSPACE_BASE_DOMAIN } from "@shared/webspace";

export function getWebspaceSlugFromHost(hostname = window.location.hostname): string | null {
  const host = hostname.toLowerCase();

  if (host === WEBSPACE_BASE_DOMAIN || host === `www.${WEBSPACE_BASE_DOMAIN}`) {
    return null;
  }

  const suffix = `.${WEBSPACE_BASE_DOMAIN}`;
  if (!host.endsWith(suffix)) return null;

  const slug = host.slice(0, -suffix.length);
  if (!slug || slug.includes(".")) return null;
  return slug;
}

export function isWebspaceSubdomain(hostname = window.location.hostname): boolean {
  return getWebspaceSlugFromHost(hostname) !== null;
}
