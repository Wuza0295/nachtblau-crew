export const SITE = {
  name: "NachtBlau Crew",
  shortName: "NachtBlau",
  tagline: "Deine Gaming Community für PC, Konsolen, Steam und mehr.",
  description:
    "NachtBlau Crew – Deine Gaming Community für PC, Konsolen, Steam und mehr. Aktuelle News, kostenlose Spiele und ein aktives Forum.",
  logoUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-logo-Li7umgFb8XhrYaRtYVFm4Z.webp",
  heroBgUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-hero-bg-HgRTyjrF5BBTepdctiJ8Mj.webp",
  webspaceUrl: "https://nacht-blau.de",
  webspaceLabel: "NachtBlau Webspace",
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "GitHub Repository",
  contactEmail: "info@nacht-blau.de",
  gamerPowerUrl: "https://www.gamerpower.com",
  allInklPartnerUrl: "https://all-inkl.com/PAC24FB89FC115D",
  allInklBannerUrl: "https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg",
} as const;

export const EXTERNAL_LINKS = [
  {
    href: SITE.webspaceUrl,
    label: SITE.webspaceLabel,
    description: "Offizielle Website der NachtBlau GbR mit Infos zum Projekt und Team.",
    external: true,
  },
  {
    href: SITE.githubUrl,
    label: SITE.githubLabel,
    description: "Quellcode, Issues und Beiträge zur NachtBlau Crew App auf GitHub.",
    external: true,
  },
  {
    href: `mailto:${SITE.contactEmail}`,
    label: "Kontakt",
    description: "Schreib uns eine E-Mail an info@nacht-blau.de.",
    external: true,
  },
] as const;
