export const SITE = {
  /** Arbeitsname — finaler Name kommt später */
  name: "Aether",
  shortName: "Aether",
  workingNameNote: "Arbeitsname",
  tagline: "Dein soziales Spektrum. Eine Plattform statt sechs Apps.",
  description:
    "Aether vereint das Beste aus Microblogging, visuellem Teilen, Kurzvideo, Communities, Expertise und Sammlungen — gesteuert durch Linsen und deinen eigenen Algorithmus.",
  heroLine: "Nicht ein Feed. Ein Spektrum.",
  supportLine:
    "Pulse, Canvas, Motion, Circles, Signal und Vault — du wählst die Linse. Der Algorithmus gehört dir.",
} as const;

export const LENSES = [
  {
    id: "pulse",
    label: "Pulse",
    from: "X · Bluesky · Threads",
    blurb: "Gedanken, Threads und Echtzeit-Gespräch.",
    href: "/home?lens=pulse",
  },
  {
    id: "canvas",
    label: "Canvas",
    from: "Instagram",
    blurb: "Bilder, Carousels und visuelle Präsenz.",
    href: "/home?lens=canvas",
  },
  {
    id: "motion",
    label: "Motion",
    from: "TikTok · Reels",
    blurb: "Entdeckung in Bewegung — vertikal und schnell.",
    href: "/motion",
  },
  {
    id: "circles",
    label: "Circles",
    from: "Discord · Reddit",
    blurb: "Communities mit Themen, Regeln und Nähe.",
    href: "/circles",
  },
  {
    id: "signal",
    label: "Signal",
    from: "LinkedIn · Longform",
    blurb: "Tiefe Beiträge, Expertise und Kontext.",
    href: "/home?lens=signal",
  },
  {
    id: "vault",
    label: "Vault",
    from: "Pinterest",
    blurb: "Sammlungen, die bleiben und wachsen.",
    href: "/vault",
  },
] as const;

export type LensId = (typeof LENSES)[number]["id"];

export const INTENTS = [
  {
    id: "browse",
    label: "Browse",
    blurb: "Weit schweifen, entdecken, überrascht werden.",
  },
  {
    id: "connect",
    label: "Connect",
    blurb: "Menschen und Gespräche in den Vordergrund.",
  },
  {
    id: "create",
    label: "Create",
    blurb: "Composer und Inspiration zuerst.",
  },
  {
    id: "focus",
    label: "Focus",
    blurb: "Ruhig, chronologisch, ohne Lärm.",
  },
] as const;

export type IntentId = (typeof INTENTS)[number]["id"];
