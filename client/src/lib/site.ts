export const SITE = {
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

export { LENSES, INTENTS } from "@shared/site";
export type { LensId, IntentId } from "@shared/site";
