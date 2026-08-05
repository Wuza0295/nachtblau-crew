import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { SITE, FREQUENCIES, FORMATS } from "@shared/site";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Full-bleed hero — one composition */}
      <section className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden hero-plane text-primary-foreground">
        <div
          className="absolute inset-0 opacity-40 animate-drift"
          style={{
            background:
              "radial-gradient(circle at 70% 30%, oklch(0.75 0.12 55 / 0.5) 0%, transparent 40%), radial-gradient(circle at 20% 70%, oklch(0.6 0.08 195 / 0.4) 0%, transparent 45%)",
          }}
        />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=70')] bg-cover bg-center mix-blend-overlay opacity-35" />

        <div className="container relative z-10 pb-16 pt-32 animate-rise">
          <p className="font-display text-6xl sm:text-8xl md:text-9xl font-bold tracking-tighter leading-[0.9] mb-6">
            {SITE.name}
            {SITE.isWorkingTitle && (
              <span className="block text-sm sm:text-base font-body font-medium tracking-[0.25em] uppercase opacity-70 mt-3">
                Arbeitstitel · Name folgt
              </span>
            )}
          </p>
          <p className="text-lg sm:text-xl max-w-md opacity-90 mb-8 leading-relaxed">
            {SITE.tagline} Das Beste aus allen sozialen Netzen — ohne Black-Box-Algorithmus.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-background text-foreground hover:bg-background/90 px-8"
            >
              <Link href="/feed">Feed öffnen</Link>
            </Button>
            {!isAuthenticated && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 px-8"
              >
                <a href={getLoginUrl()}>Anmelden</a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* One job: explain the distance model */}
      <section className="mist-bg py-24">
        <div className="container max-w-3xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Distanz statt Algorithmus
          </h2>
          <p className="text-muted-foreground text-lg mb-12 leading-relaxed">
            Jede große Plattform hat eine Stärke. NAH nimmt sie — und sortiert nach Nähe, nicht nach
            Engagement.
          </p>
          <ol className="space-y-8">
            {FREQUENCIES.map((f, i) => (
              <li
                key={f.id}
                className="animate-rise flex gap-5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="font-display text-3xl font-bold text-primary/30 tabular-nums w-10 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold">{f.label}</h3>
                  <p className="text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground/70 mt-2">
                    aus {f.inspiredBy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Formats */}
      <section className="py-24 border-t border-border">
        <div className="container">
          <h2 className="font-display text-3xl font-bold tracking-tight mb-3">Ein Konto. Vier Formate.</h2>
          <p className="text-muted-foreground mb-12 max-w-xl">
            Puls, Bild, Tiefe, Moment — schreiben wie auf X, zeigen wie auf Instagram, vertiefen wie
            auf LinkedIn, echt sein wie auf BeReal.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FORMATS.map((f) => (
              <div key={f.id}>
                <h3 className="font-display text-lg font-semibold">{f.label}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.description}</p>
                <p className="text-xs text-muted-foreground/60 mt-3 uppercase tracking-wider">
                  {f.inspiredBy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold">Bereit für weniger Lärm?</h2>
            <p className="text-muted-foreground mt-1">Demo-Feed mit echten Inhalten — ohne Account.</p>
          </div>
          <Button asChild size="lg" className="rounded-full gap-2 px-6">
            <Link href="/feed">
              Zum Feed <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
