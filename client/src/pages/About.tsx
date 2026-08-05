import { SITE, PULSE_TOPICS } from "@/lib/site";
import { BrandMark } from "@/components/BrandMark";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const SOURCES = [
  {
    platform: "Instagram / Stories",
    take: "Visuelle Momente & Signals — ephemer, bewusst, ohne Archiv-Zwang.",
  },
  {
    platform: "TikTok",
    take: "Interest-Graph & Discovery: Explore folgt Themen, nicht nur Follows.",
  },
  {
    platform: "X / Threads",
    take: "Echtzeit-Text und leichte Konversation — ohne Chaos-Firehose.",
  },
  {
    platform: "LinkedIn",
    take: "Essays & Thought Leadership als First-Class-Format.",
  },
  {
    platform: "Reddit × Discord",
    take: "Circles: Themenraum + Zugehörigkeit + Moderation durch Nähe.",
  },
  {
    platform: "Bluesky / Custom Feeds",
    take: "Pulse-Dials: Nutzer*innen steuern den Algorithmus sichtbar.",
  },
  {
    platform: "Pinterest",
    take: "Boards: bewusst speichern, was bleiben soll.",
  },
  {
    platform: "2026-Trends",
    take: "User-controlled algorithms, Anti-Slop (KI kennzeichnen), Authentizität.",
  },
];

export default function About() {
  return (
    <div className="container py-12 max-w-2xl space-y-10">
      <div className="space-y-4 reveal-up">
        <BrandMark className="h-12 w-12" />
        <h1 className="font-display text-4xl font-bold text-gradient">{SITE.name}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Arbeitstitel — der finale Name kommt später. Das Produkt ist die Idee: ein Social
          Portal, das es so noch nicht gibt, weil es die Stärken aller großen Netze mischt und
          den Algorithmus in deine Hand legt.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">Recherche → Produkt</h2>
        <div className="space-y-3">
          {SOURCES.map((s) => (
            <div key={s.platform} className="atmosphere-panel rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-accent font-semibold">
                {s.platform}
              </p>
              <p className="text-sm mt-1 leading-relaxed">{s.take}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">12 Pulse-Themen</h2>
        <div className="flex flex-wrap gap-2">
          {PULSE_TOPICS.map((t) => (
            <span
              key={t.id}
              className="text-sm px-3 py-1 rounded-full border border-border"
              style={{ background: `oklch(0.96 0.03 ${t.hue})` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </section>

      <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
        <Link href="/feed">Zum Pulse</Link>
      </Button>
    </div>
  );
}
