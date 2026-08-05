export const SITE = {
  name: "FLUX",
  shortName: "FLUX",
  workingTitle: true,
  tagline: "Alles Soziale. Ein Ort.",
  description:
    "FLUX (Arbeitstitel) vereint das Beste aus Instagram, X, TikTok, Discord, Reddit, Bluesky, LinkedIn und BeReal — mit Modi, Radar und Circles, die du steuerst.",
  logoUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-logo-Li7umgFb8XhrYaRtYVFm4Z.webp",
  heroBgUrl:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop",
  webspaceUrl: "https://nacht-blau.de",
  webspaceLabel: "NachtBlau Webspace",
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "GitHub Repository",
  contactEmail: "info@nacht-blau.de",
  gamerPowerUrl: "https://www.gamerpower.com",
} as const;

export const EXTERNAL_LINKS = [
  {
    href: SITE.webspaceUrl,
    label: SITE.webspaceLabel,
    description: "Projekt-Hintergrund und Team.",
    external: true,
  },
  {
    href: SITE.githubUrl,
    label: SITE.githubLabel,
    description: "Quellcode und Issues.",
    external: true,
  },
  {
    href: `mailto:${SITE.contactEmail}`,
    label: "Kontakt",
    description: "Schreib uns eine E-Mail.",
    external: true,
  },
] as const;
