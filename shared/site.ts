/** Temporary working name — final brand name TBD */
export const SITE = {
  name: "Cadence",
  shortName: "Cadence",
  workingNameNote: "Arbeitsname — finaler Name folgt",
  tagline: "Du wählst die Frequenz.",
  description:
    "Cadence vereint das Beste aus allen sozialen Netzwerken: wählbare Feeds, echte Momente, Kreise, Gespräche und Entdeckung — ohne eine Black-Box-Algorithmus-Diktatur.",
  logoLetter: "C",
  logoUrl: "",
  heroBgUrl: "",
  webspaceUrl: "https://cadence.social",
  webspaceLabel: "Cadence",
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "GitHub Repository",
  contactEmail: "hello@cadence.social",
  gamerPowerUrl: "https://www.gamerpower.com",
} as const;

export const MOODS = [
  {
    id: "nah",
    label: "Nah",
    description: "Freunde, Stories und echte Momente",
    inspiredBy: "Instagram Stories + BeReal",
  },
  {
    id: "gespraech",
    label: "Gespräch",
    description: "Text, Threads und starke Antworten",
    inspiredBy: "X / Threads",
  },
  {
    id: "entdecken",
    label: "Entdecken",
    description: "Visuelle Impulse und neue Stimmen",
    inspiredBy: "TikTok + Instagram Explore",
  },
  {
    id: "kreise",
    label: "Kreise",
    description: "Themen-Communities und Räume",
    inspiredBy: "Reddit + Discord",
  },
  {
    id: "fokus",
    label: "Fokus",
    description: "Tiefe Gedanken und Intentionalität",
    inspiredBy: "LinkedIn + Substack",
  },
] as const;

export type MoodId = (typeof MOODS)[number]["id"];

export const EXTERNAL_LINKS = [
  {
    href: SITE.githubUrl,
    label: "GitHub",
    description: "Quellcode und Beiträge",
    external: true,
  },
  {
    href: `mailto:${SITE.contactEmail}`,
    label: "Kontakt",
    description: "Schreib uns eine E-Mail",
    external: true,
  },
] as const;
