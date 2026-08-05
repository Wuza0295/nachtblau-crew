import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { SITE, PORTAL_FEATURES } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[88vh] flex items-center portal-hero-gradient">
        <div className="absolute inset-0 portal-grid opacity-40 pointer-events-none" />
        <div className="container relative z-10 py-16">
          <div className="max-w-3xl">
            <Badge
              variant="outline"
              className="mb-6 border-primary/30 text-primary bg-primary/10 rounded-full px-4"
            >
              {SITE.codename} · Hybrid Social Network
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
              Ein Portal.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-[oklch(0.72_0.18_330)] to-accent">
                Alle Netzwerke. Das Beste.
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              {SITE.tagline} Recherchiert aus Trends 2026: Community vor Viralität, Social Search,
              Kurzvideo plus chronologische Kontrolle — in einer Oberfläche.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link href="/feed">
                  <Button size="lg" className="rounded-full gap-2 shadow-lg shadow-primary/25">
                    Zum Feed
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  className="rounded-full gap-2 shadow-lg shadow-primary/25"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Kostenlos starten
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Link href="/entdecken">
                <Button size="lg" variant="outline" className="rounded-full bg-transparent">
                  Entdecken
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-30 bg-gradient-to-br from-primary to-[oklch(0.72_0.18_330)] pointer-events-none" />
        </div>
      </section>

      <section className="container py-20">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Alles vereint</h2>
            <p className="text-muted-foreground mt-2 max-w-lg text-sm">
              Kein Copy-Paste der Konkurrenz — bewusste Mischung: Reichweite wo sinnvoll, Kontrolle wo
              nötig, Authentizität wo es zählt.
            </p>
          </div>
          <Sparkles className="h-8 w-8 text-primary shrink-0 hidden sm:block" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PORTAL_FEATURES.map((f) => (
            <article
              key={f.title}
              className="portal-card rounded-2xl p-5 border border-border/60 hover:border-primary/30 transition-colors duration-200"
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.subtitle}</p>
              <h3 className="font-display font-semibold text-xl mt-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20">
        <div className="container py-16 text-center max-w-2xl">
          <h2 className="font-display text-2xl font-bold">Name folgt. Features bleiben.</h2>
          <p className="text-muted-foreground mt-3 text-sm">
            Du bestimmst später den Markennamen — das Fundament steht: Waves, Flashes, Kreise, Moments,
            Stories und drei Feed-Modi.
          </p>
          <Link href="/feed">
            <Button className="mt-6 rounded-full">Live ausprobieren</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
