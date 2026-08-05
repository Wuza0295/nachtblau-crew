import { BRAND } from "./brand";

export const SITE = {
  name: BRAND.name,
  shortName: BRAND.name,
  tagline: BRAND.tagline,
  description: BRAND.description,
  logoUrl: "",
  heroBgUrl:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1800&q=80",
  webspaceUrl: "/",
  webspaceLabel: `${BRAND.name} Portal`,
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "GitHub Repository",
  contactEmail: "hello@liora.social",
} as const;

export const EXTERNAL_LINKS = [
  {
    href: "/konzept",
    label: "Konzept",
    description: "Warum dieses Portal so noch nicht existiert.",
    external: false,
  },
  {
    href: "/feed",
    label: "Feed öffnen",
    description: "Pulse, Canvas, Stream und Depth in einem Graph.",
    external: false,
  },
] as const;
