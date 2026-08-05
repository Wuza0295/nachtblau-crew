/** Temporary working title — final brand name TBD */
export const SITE = {
  name: "AETHER",
  shortName: "AETHER",
  tagline: "Dein Feed. Deine Regeln.",
  description:
    "AETHER verbindet das Beste aus allen sozialen Netzwerken: nutzergesteuerte Feeds, Circles, Signals, Boards und Resonanz — ohne Black-Box-Algorithmus.",
  /** CSS wordmark; replace when final brand/logo is ready */
  logoUrl: "",
  heroBgUrl: "",
  webspaceUrl: "",
  webspaceLabel: "",
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "GitHub",
  contactEmail: "",
  gamerPowerUrl: "",
} as const;

export const EXTERNAL_LINKS = [
  {
    href: SITE.githubUrl,
    label: SITE.githubLabel,
    description: "Quellcode und Beiträge.",
    external: true,
  },
] as const;

/** Interest topics for Pulse Dials — the user-controlled algorithm */
export const PULSE_TOPICS = [
  { id: "technologie", label: "Technologie", hue: 195 },
  { id: "kultur", label: "Kultur", hue: 320 },
  { id: "design", label: "Design", hue: 25 },
  { id: "wissenschaft", label: "Wissenschaft", hue: 160 },
  { id: "musik", label: "Musik", hue: 280 },
  { id: "sport", label: "Sport", hue: 140 },
  { id: "reisen", label: "Reisen", hue: 40 },
  { id: "food", label: "Food", hue: 55 },
  { id: "gaming", label: "Gaming", hue: 250 },
  { id: "business", label: "Business", hue: 210 },
  { id: "kunst", label: "Kunst", hue: 350 },
  { id: "nature", label: "Nature", hue: 130 },
] as const;

export type PulseTopicId = (typeof PULSE_TOPICS)[number]["id"];

export const RESONANCE_LABELS = {
  1: "Leise",
  2: "Klar",
  3: "Tief",
} as const;
