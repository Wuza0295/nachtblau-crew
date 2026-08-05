import { Link } from "wouter";
import { SITE, LENSES, RESONANCE, POST_TYPES } from "@shared/site";
import { ArrowRight } from "lucide-react";

const SOURCES = [
  {
    platform: "TikTok",
    take: "Interest-Graph Discovery — Pulse zeigt, was resoniert, nicht nur wen du kennst.",
  },
  {
    platform: "Instagram",
    take: "Visuelle Frames und Orbit-Nähe zu Menschen, denen du folgst.",
  },
  {
    platform: "Reddit + Discord",
    take: "Circles mit Normen, Stewardship und Gatherings, die wieder enden.",
  },
  {
    platform: "Threads + X",
    take: "Schnelle Conversation und Threads ohne Timeline-Lärm.",
  },
  {
    platform: "LinkedIn",
    take: "Signals — längere Gedanken mit Depth-Resonance statt Karriere-Theater.",
  },
  {
    platform: "BeReal / Stories",
    take: "Moments: authentisch, zeitgebunden, ohne Performance-Druck.",
  },
  {
    platform: "Pinterest",
    take: "Visuelle Entdeckung über Frames in themenbezogenen Circles.",
  },
  {
    platform: "Bluesky-Idee",
    take: "Ehrliche Stille: keine Zombie-Communities, Gatherings lösen sich auf.",
  },
];

export default function About() {
  return (
    <div className="container py-10 sm:py-16 max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Konzept</p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold text-[var(--lyra-teal-deep)] mt-2 text-balance">
        Warum {SITE.name} existiert
      </h1>
      <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
        {SITE.claim} Jede Plattform hat eine Stärke — und einen blinden Fleck.
        {SITE.name} nimmt die Stärken und baut eine neue Architektur darum:
        <strong className="text-foreground font-semibold"> Lenses + Resonance + Circles + Presence</strong>.
      </p>
      <p className="mt-3 text-sm text-muted-foreground/90">
        Der Name ist ein Arbeitstitel. Das Produktprinzip bleibt.
      </p>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold">Was wir von wem gelernt haben</h2>
        <ul className="mt-6 space-y-5">
          {SOURCES.map((s) => (
            <li key={s.platform} className="border-t border-border pt-4">
              <p className="font-semibold">{s.platform}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.take}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold">Die eigenen Ideen</h2>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-display text-lg font-bold">Lenses</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Eine Content-Welt, vier Blickwinkel: {LENSES.map((l) => l.label).join(", ")}.
              Du wechselst die Frequenz — nicht die App.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Resonance statt Likes</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {RESONANCE.map((r) => r.label).join(" · ")} — drei Signale für Impuls, Tiefe und Amplifikation.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Gatherings</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Live-Zusammenkünfte in Circles, die wieder verschwinden. Keine Zombie-Mitgliederlisten.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Compose-Formate</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {POST_TYPES.map((p) => p.label).join(" · ")} — Form folgt Absicht.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-14 text-center">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground"
        >
          Jetzt ausprobieren
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
