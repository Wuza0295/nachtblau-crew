import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function About() {
  const concept = trpc.social.concept.useQuery();

  return (
    <div className="container py-10 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Konzept & Forschung</p>
      <h1 className="font-display text-4xl font-bold mt-2">Warum Aether?</h1>
      <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
        {concept.data?.thesis}
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Geliehen vom Besten</h2>
        <ul className="mt-5 space-y-4">
          {concept.data?.borrowed.map((b) => (
            <li key={b.from} className="border-b border-border/70 pb-4">
              <div className="text-xs uppercase tracking-[0.16em] text-primary">{b.from}</div>
              <div className="mt-1 text-[15px]">{b.take}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Was neu ist</h2>
        <ul className="mt-5 space-y-3">
          {concept.data?.unique.map((u) => (
            <li key={u} className="flex gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-accent shrink-0" />
              <span>{u}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 aether-shell rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold">Quellen & Impulse</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Platform-Vergleiche 2026 (LinkedIn Thought Leadership, TikTok Discovery, Instagram Commerce &
          Community, Threads/Bluesky Conversation), sowie Research zu intentionalen Feeds (Bonsai/CHI,
          MIT Gobo Lenses, Bluesky Custom Feeds / Skyline). Aether übersetzt das in ein einziges Produkt
          mit Linsen, Session-Intent und sichtbaren Algorithmus-Gewichten.
        </p>
        <Link href="/home" className="inline-block mt-5 text-primary hover:underline">
          Spektrum ausprobieren →
        </Link>
      </section>
    </div>
  );
}
