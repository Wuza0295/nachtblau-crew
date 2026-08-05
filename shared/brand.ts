/** Temporary working brand — final name TBD by product owner. */
export const BRAND = {
  name: "Liora",
  tagline: "Ein Netzwerk. Vier Linsen. Dein Algorithmus.",
  description:
    "Das Social-Portal, das die Stärken von Instagram, TikTok, X, Reddit, Discord, LinkedIn, Bluesky und Pinterest in einer kontrollierbaren Erfahrung vereint.",
  isWorkingName: true,
} as const;

export const FEED_LENSES = [
  {
    id: "pulse" as const,
    label: "Pulse",
    blurb: "Kurze Gedanken & Gespräche",
    inspiredBy: "X · Threads · Bluesky",
  },
  {
    id: "canvas" as const,
    label: "Canvas",
    blurb: "Visuelle Momente",
    inspiredBy: "Instagram · Pinterest",
  },
  {
    id: "stream" as const,
    label: "Stream",
    blurb: "Vertikale Entdeckung",
    inspiredBy: "TikTok · Reels",
  },
  {
    id: "depth" as const,
    label: "Depth",
    blurb: "Lange Form & Expertise",
    inspiredBy: "LinkedIn · Essays",
  },
] as const;

export type FeedLens = (typeof FEED_LENSES)[number]["id"];

export const SIGNAL_TYPES = [
  { id: "amplify" as const, label: "Amplify", emoji: "↗", hint: "Reichweite geben" },
  { id: "echo" as const, label: "Echo", emoji: "↺", hint: "Mit Kontext teilen" },
  { id: "agree" as const, label: "Agree", emoji: "✓", hint: "Zustimmen" },
  { id: "collect" as const, label: "Collect", emoji: "◇", hint: "Auf Board speichern" },
] as const;

export type SignalType = (typeof SIGNAL_TYPES)[number]["id"];

export const PRIVACY_RINGS = [
  { id: "world" as const, label: "Welt" },
  { id: "circles" as const, label: "Kreise" },
  { id: "close" as const, label: "Nah" },
] as const;

export type PrivacyRing = (typeof PRIVACY_RINGS)[number]["id"];
