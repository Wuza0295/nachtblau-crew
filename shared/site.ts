/** Working title until the product is named — UI uses codename + tagline */
export const SITE = {
  codename: "◈",
  name: "Social-Universum",
  shortName: "Universum",
  tagline: "Feed, Kreise, Pulse, Stories & echte Momente — das Beste aus allen Netzwerken in einem Portal.",
  description:
    "Ein neues Social-Media-Portal: wählbare Feeds wie Bluesky, Communities wie Reddit, Kurzvideo-Pulse wie TikTok, Stories, Multi-Reactions und tägliche Authentizitäts-Momente.",
  logoUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-logo-Li7umgFb8XhrYaRtYVFm4Z.webp",
  heroBgUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-hero-bg-HgRTyjrF5BBTepdctiJ8Mj.webp",
  webspaceUrl: "https://nacht-blau.de",
  webspaceLabel: "Projekt-Webspace",
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "Quellcode",
  contactEmail: "info@nacht-blau.de",
  gamerPowerUrl: "https://www.gamerpower.com",
} as const;

export const EXTERNAL_LINKS = [
  {
    href: SITE.githubUrl,
    label: SITE.githubLabel,
    description: "Open Source und Mitgestaltung am Social-Universum.",
    external: true,
  },
  {
    href: `mailto:${SITE.contactEmail}`,
    label: "Kontakt",
    description: "Feedback zum Portal und zur Namensfindung.",
    external: true,
  },
] as const;

export const PLATFORM_FEATURES = [
  {
    id: "feed",
    title: "Intelligenter Feed",
    description:
      "Following, „Für dich“ oder strikt chronologisch — du entscheidest, nicht eine Blackbox.",
    href: "/feed",
  },
  {
    id: "pulse",
    title: "Pulse",
    description: "Vertikales Kurzformat mit Fokus auf Watch-Time statt endloser Ablenkung.",
    href: "/pulse",
  },
  {
    id: "kreise",
    title: "Kreise",
    description: "Themen-Communities mit Voting wie Reddit, ohne das Tab-Monster.",
    href: "/kreise",
  },
  {
    id: "momente",
    title: "Momente & Stories",
    description: "24h-Stories plus ein echter Tages-Moment — BeReal-Tugend, Instagram-Gewohnheit.",
    href: "/momente",
  },
  {
    id: "entdecken",
    title: "Entdecken",
    description: "Trends und Hashtags als Such-Layer — Social als Suchmaschine.",
    href: "/entdecken",
  },
] as const;
