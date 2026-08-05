import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { SITE, PULSE_TOPICS } from "@/lib/site";
import { Link } from "wouter";
import { BrandMark } from "@/components/BrandMark";
import { ArrowRight, SlidersHorizontal, Orbit, Waves, Clock, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";

const PILLARS = [
  {
    icon: SlidersHorizontal,
    title: "Pulse-Dials",
    from: "Bluesky · Threads · TikTok Topics",
    text: "Du stellst Interessen als Regler — der Feed folgt sofort. Kein Black-Box-Algorithmus.",
  },
  {
    icon: Orbit,
    title: "Circles",
    from: "Reddit × Discord",
    text: "Themenräume mit Zugehörigkeit: tiefe Diskussionen und echte Community — ohne Firehose.",
  },
  {
    icon: Waves,
    title: "Resonance",
    from: "Upvotes · neu gedacht",
    text: "Leise, Klar oder Tief — jede Resonanz trainiert nur dein Modell, nicht ein Werbenetzwerk.",
  },
  {
    icon: Clock,
    title: "Signals",
    from: "Stories · Snap",
    text: "24-Stunden-Momente. Was bleibt, legst du bewusst auf ein Board.",
  },
  {
    icon: LayoutGrid,
    title: "Boards & Essays",
    from: "Pinterest · LinkedIn",
    text: "Sammlungen für später. Essays für Gedanken, die mehr als 280 Zeichen brauchen.",
  },
];

function DialPreview() {
  const [weights, setWeights] = useState(() =>
    PULSE_TOPICS.slice(0, 6).map((_, i) => 30 + ((i * 17) % 50))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setWeights((prev) => prev.map((w, i) => {
        const next = w + Math.sin(Date.now() / 800 + i) * 2;
        return Math.min(95, Math.max(15, next));
      }));
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="atmosphere-panel rounded-3xl p-6 sm:p-8 space-y-5 float-soft">
      <div className="flex items-center justify-between">
        <p className="font-display font-semibold text-lg">Dein Pulse</p>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Live-Vorschau</span>
      </div>
      {PULSE_TOPICS.slice(0, 6).map((t, i) => (
        <div key={t.id} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{t.label}</span>
            <span className="tabular-nums text-muted-foreground">{Math.round(weights[i])}%</span>
          </div>
          <div className="dial-track overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-150"
              style={{
                width: `${weights[i]}%`,
                background: `linear-gradient(90deg, oklch(0.45 0.1 195), oklch(0.6 0.12 ${t.hue}))`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero — one composition: brand, headline, sentence, CTA, dominant visual */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 75% 40%, oklch(0.85 0.07 185 / 0.55), transparent 60%), radial-gradient(ellipse 50% 40% at 15% 70%, oklch(0.88 0.08 40 / 0.35), transparent 55%), linear-gradient(180deg, oklch(0.96 0.02 200), oklch(0.94 0.025 195))",
          }}
        />
        <div className="absolute right-[-10%] top-[10%] w-[55vw] h-[55vw] max-w-[640px] max-h-[640px] rounded-full signal-ring opacity-20 blur-3xl pointer-events-none" />

        <div className="container grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center py-16">
          <div className="space-y-8 reveal-up">
            <div className="flex items-center gap-3">
              <BrandMark className="h-14 w-14" />
              <span className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight text-gradient">
                {SITE.name}
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.15] text-foreground max-w-xl">
              {SITE.tagline}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Das Social Portal, das die Stärken aller Netze mischt — und dir den Algorithmus in die Hand gibt.
            </p>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/feed">
                    Zum Pulse <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href={getLoginUrl()}>
                    Starten <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button asChild size="lg" variant="outline">
                <Link href="/explore">Entdecken</Link>
              </Button>
            </div>
          </div>

          <div className="reveal-fade" style={{ animationDelay: "0.15s" }}>
            <DialPreview />
          </div>
        </div>
      </section>

      {/* One job: explain the hybrid */}
      <section className="container py-20 space-y-10">
        <div className="max-w-2xl space-y-3 reveal-up">
          <h2 className="font-display text-3xl font-bold">Das Beste — neu zusammengesetzt</h2>
          <p className="text-muted-foreground text-lg">
            Nicht noch ein Feed. Eine Schicht aus Kontrolle, Community und Formaten, die woanders getrennt leben.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="atmosphere-panel rounded-2xl p-6 space-y-3 reveal-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-lg">{p.title}</h3>
                <p className="text-[11px] uppercase tracking-wider text-accent font-medium">{p.from}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container pb-24">
        <div className="atmosphere-panel rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <h2 className="font-display text-2xl font-bold">Name folgt. Gefühl schon da.</h2>
            <p className="text-muted-foreground">
              Arbeitstitel {SITE.name}. Melde dich an, justiere deine Dials und spüre den Unterschied.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 gap-2">
            <Link href="/feed">
              Pulse öffnen <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
