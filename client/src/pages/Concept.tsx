import { BRAND, FEED_LENSES, SIGNAL_TYPES } from "@shared/brand";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const SOURCES = [
  {
    platform: "Instagram",
    take: "Visuelle Ästhetik, Moments/Stories, Intimitätsringe",
  },
  {
    platform: "TikTok",
    take: "Interest Graph, vertikale Discovery, authentische Kurzvideos",
  },
  {
    platform: "X / Threads",
    take: "Schnelle Puls-Gespräche, öffentliche Debatte",
  },
  {
    platform: "Bluesky",
    take: "Custom Feeds, Nutzerkontrolle über Ranking",
  },
  {
    platform: "Reddit",
    take: "Themen-Communities, kuratierte Diskussionstiefe",
  },
  {
    platform: "Discord",
    take: "Live Rooms, Ambient Presence in Kreisen",
  },
  {
    platform: "LinkedIn",
    take: "Craft-Profil, lange Form, Expertise",
  },
  {
    platform: "Pinterest",
    take: "Boards als Sammelorte statt Timeline-Spam",
  },
];

export default function Concept() {
  return (
    <div className="container max-w-3xl py-12 md:py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Produktkonzept</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl text-balance">
        Warum {BRAND.name} so noch nicht existiert
      </h1>
      <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
        Bestehende Netzwerke optimieren für eine Domäne: Video, Foto, Text, Jobs oder Chat.{" "}
        {BRAND.name} ist die Mischung — und der fehlende Bedienhebel: du steuerst den Algorithmus,
        wählst die Linse und meinst Signale ernst.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Recherche-Quellen & Übernahmen</h2>
        <ul className="mt-5 space-y-3">
          {SOURCES.map((s) => (
            <li key={s.platform} className="border-l-2 border-primary/40 pl-4">
              <p className="font-medium">{s.platform}</p>
              <p className="text-sm text-muted-foreground">{s.take}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Einzigartige Kombination</h2>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">Vier Linsen in einem Graph:</span>{" "}
            {FEED_LENSES.map((l) => l.label).join(" · ")}
          </li>
          <li>
            <span className="text-foreground font-medium">Algorithmus-Regler:</span> Chronologie ↔
            Discovery als sichtbarer Slider
          </li>
          <li>
            <span className="text-foreground font-medium">Signale:</span>{" "}
            {SIGNAL_TYPES.map((s) => s.label).join(", ")} statt eines Likes
          </li>
          <li>
            <span className="text-foreground font-medium">Kreise + Rooms + Boards:</span> Community,
            Live und Sammlung ohne App-Wechsel
          </li>
          <li>
            <span className="text-foreground font-medium">Dual Face Profil:</span> Persönlich und
            Craft nebeneinander
          </li>
        </ol>
      </section>

      <div className="mt-12">
        <Button asChild size="lg" className="rounded-full">
          <Link href="/feed">Prototype öffnen</Link>
        </Button>
      </div>
    </div>
  );
}
