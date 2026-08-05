/**
 * NAH — Arbeitstitel (finaler Name folgt)
 *
 * Ein soziales Portal nach Distanz statt Algorithmus:
 * Innenkreis → Orbit → Horizont → Drift
 */
export const SITE = {
  name: "NAH",
  shortName: "NAH",
  isWorkingTitle: true,
  tagline: "Näher dran. Weniger Lärm.",
  description:
    "NAH vereint das Beste aus Instagram, TikTok, X, LinkedIn, Discord, Reddit und BeReal — mit einem Distanz-Modell statt Black-Box-Algorithmus. Innenkreis, Orbit, Horizont und Drift: du bestimmst die Frequenz.",
  pitch:
    "Ein Netzwerk, das Nähe belohnt und Virality optional macht. Chronologisch wo es zählt, entdeckbar nur wenn du willst.",
  // Placeholder mark — ersetzt wenn der finale Name steht
  logoLetter: "N",
  contactEmail: "hello@nah.social",
} as const;

export const FREQUENCIES = [
  {
    id: "inner" as const,
    label: "Innenkreis",
    short: "Nah",
    description: "Max. 12 Menschen. Chronologisch. Wie BeReal + Close Friends.",
    inspiredBy: "BeReal, Instagram Close Friends",
  },
  {
    id: "orbit" as const,
    label: "Orbit",
    short: "Orbit",
    description: "Menschen, denen du bewusst folgst. Kein Ranking-Chaos.",
    inspiredBy: "X Following, Bluesky",
  },
  {
    id: "horizon" as const,
    label: "Horizont",
    short: "Räume",
    description: "Themen-Räume mit Diskussionstiefe — Reddit trifft Discord.",
    inspiredBy: "Reddit, Discord",
  },
  {
    id: "drift" as const,
    label: "Drift",
    short: "Entdecken",
    description: "Opt-in Entdeckung. Transparent. Nur wenn du öffnest.",
    inspiredBy: "TikTok Discovery, Pinterest",
  },
] as const;

export const FORMATS = [
  {
    id: "pulse" as const,
    label: "Puls",
    description: "Kurzer Gedanke. Text first.",
    inspiredBy: "X / Threads",
  },
  {
    id: "frame" as const,
    label: "Bild",
    description: "Ein visuelles Moment.",
    inspiredBy: "Instagram",
  },
  {
    id: "depth" as const,
    label: "Tiefe",
    description: "Longform, Carousel, Thought Leadership.",
    inspiredBy: "LinkedIn",
  },
  {
    id: "moment" as const,
    label: "Moment",
    description: "Authentisch, zeitlich begrenzt, ungeschönt.",
    inspiredBy: "BeReal + Stories",
  },
] as const;

export const REACTIONS = [
  { id: "resonate" as const, label: "Resonanz", verb: "Resoniert" },
  { id: "save" as const, label: "Merken", verb: "Gemerkt" },
  { id: "amplify" as const, label: "Weitergeben", verb: "Weitergegeben" },
] as const;

export type FrequencyId = (typeof FREQUENCIES)[number]["id"];
export type FormatId = (typeof FORMATS)[number]["id"];
export type ReactionId = (typeof REACTIONS)[number]["id"];

export const EXTERNAL_LINKS = [
  {
    href: `mailto:${SITE.contactEmail}`,
    label: "Kontakt",
    description: "Schreib uns — Name und Domain folgen.",
    external: true,
  },
] as const;
