export const SITE = {
  /** Working title — final name TBD by product owner */
  name: "Lumen",
  shortName: "Lumen",
  tagline: "Dein Feed. Deine Regeln. Deine Kreise.",
  description:
    "Lumen vereint das Beste aus allen Social Networks: steuerbare Lenses statt Blackbox-Algorithmen, Circles statt Server-Chaos, Moments statt Stories-Spam und Signal statt Vanity-Likes.",
  logoUrl: "",
  /** Soft atmospheric hero — Unsplash community / light */
  heroBgUrl:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2400&q=80",
  webspaceUrl: "#",
  webspaceLabel: "Lumen",
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "GitHub",
  contactEmail: "hello@lumen.social",
} as const;

export const EXTERNAL_LINKS = [
  {
    href: SITE.githubUrl,
    label: SITE.githubLabel,
    description: "Quellcode und Beiträge.",
    external: true,
  },
  {
    href: `mailto:${SITE.contactEmail}`,
    label: "Kontakt",
    description: "Schreib uns eine E-Mail.",
    external: true,
  },
] as const;

/** Best-of synthesis — what Lumen takes from each platform */
export const PLATFORM_DNA = [
  {
    from: "Bluesky",
    takes: "Custom Feeds / Lenses — du wählst den Algorithmus",
  },
  {
    from: "Instagram",
    takes: "Moments — ephemere, visuelle Alltags-Schnipsel",
  },
  {
    from: "TikTok",
    takes: "Sparks — Discovery über Interessen, nicht Follower",
  },
  {
    from: "Discord",
    takes: "Circles — Räume für echte Communities",
  },
  {
    from: "Reddit",
    takes: "Collectives — Themen-Hubs mit Qualitäts-Voting",
  },
  {
    from: "Threads / X",
    takes: "Gedanken-Streams — kurze Texte, Zitate, Dialoge",
  },
  {
    from: "LinkedIn",
    takes: "Depth — lange Gedanken ohne Job-Board-Ballast",
  },
  {
    from: "BeReal",
    takes: "Authentizitäts-Prompts — weniger Pose, mehr Präsenz",
  },
  {
    from: "Mastodon",
    takes: "Chronologie first — Kontrolle vor Engagement-Maximierung",
  },
] as const;
