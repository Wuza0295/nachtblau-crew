export const WEBSPACE_BASE_DOMAIN = "nacht-blau.de";

export const WEBSPACE_RESERVED_SLUGS = new Set([
  "www",
  "api",
  "mail",
  "ftp",
  "kas",
  "admin",
  "webspace",
  "portal",
  "forum",
  "news",
  "profil",
  "app",
  "cdn",
  "static",
  "dev",
  "test",
  "staging",
]);

export const WEBSPACE_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

export type WebspaceTheme = "midnight" | "neon" | "clean";

export type WebspaceBlock =
  | {
      id: string;
      type: "hero";
      title: string;
      subtitle: string;
      imageUrl?: string;
    }
  | {
      id: string;
      type: "text";
      content: string;
    }
  | {
      id: string;
      type: "links";
      heading?: string;
      items: { label: string; url: string }[];
    }
  | {
      id: string;
      type: "image";
      url: string;
      alt?: string;
      caption?: string;
    };

export type WebspaceSitePublic = {
  slug: string;
  title: string;
  tagline: string | null;
  theme: WebspaceTheme;
  blocks: WebspaceBlock[];
  publishedAt: Date | null;
};

export function isValidWebspaceSlug(slug: string): boolean {
  if (slug.length < 3) return false;
  if (!WEBSPACE_SLUG_REGEX.test(slug)) return false;
  if (WEBSPACE_RESERVED_SLUGS.has(slug)) return false;
  return true;
}

export function parseWebspaceBlocks(raw: string | null | undefined): WebspaceBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as WebspaceBlock[];
  } catch {
    return [];
  }
}

export function defaultWebspaceBlocks(title: string, tagline?: string): WebspaceBlock[] {
  return [
    {
      id: "hero-1",
      type: "hero",
      title,
      subtitle: tagline ?? "Willkommen auf meiner Seite",
    },
    {
      id: "text-1",
      type: "text",
      content: "Bearbeite diese Seite im NachtBlau Webspace-Editor.",
    },
    {
      id: "links-1",
      type: "links",
      heading: "Links",
      items: [
        { label: "NachtBlau", url: "https://nacht-blau.de" },
        { label: "Kontakt", url: "mailto:info@nacht-blau.de" },
      ],
    },
  ];
}
