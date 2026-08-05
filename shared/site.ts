export const SITE = {
  name: "LYRA",
  shortName: "LYRA",
  /** Placeholder — final name comes later */
  workingTitle: true,
  tagline: "Eine Stimme. Jede Frequenz.",
  description:
    "LYRA vereint Discovery, Community, Conversation und Presence in einem Netzwerk — mit Resonance statt Likes und Lenses statt Chaos.",
  claim: "Das Beste aus allen sozialen Welten. Neu zusammengesetzt.",
  contactEmail: "hello@lyra.app",
} as const;

export const LENSES = [
  {
    id: "pulse",
    label: "Pulse",
    description: "Entdeckung nach Interesse — wie TikTok, aber ruhiger",
    from: "TikTok · Interest Graph",
  },
  {
    id: "orbit",
    label: "Orbit",
    description: "Menschen, denen du folgst — klare Nähe",
    from: "Instagram · Social Graph",
  },
  {
    id: "circles",
    label: "Circles",
    description: "Mikro-Communities mit Vertrauen und Normen",
    from: "Reddit · Discord",
  },
  {
    id: "depth",
    label: "Depth",
    description: "Threads, Insights und längere Gedanken",
    from: "Threads · LinkedIn · X",
  },
] as const;

export const RESONANCE = [
  {
    id: "spark",
    label: "Spark",
    description: "Schneller Impuls — das hat mich getroffen",
  },
  {
    id: "depth",
    label: "Depth",
    description: "Tiefe Resonanz — das hat mich bewegt",
  },
  {
    id: "echo",
    label: "Echo",
    description: "Weitertragen — das braucht mehr Stimmen",
  },
] as const;

export const POST_TYPES = [
  {
    id: "pulse",
    label: "Pulse",
    description: "Kurzer Gedanke oder Moment",
  },
  {
    id: "frame",
    label: "Frame",
    description: "Visueller Beitrag",
  },
  {
    id: "signal",
    label: "Signal",
    description: "Längerer Insight oder Essay",
  },
  {
    id: "moment",
    label: "Moment",
    description: "Authentisch, 24 Stunden",
  },
] as const;
