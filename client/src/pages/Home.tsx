import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/social/PostCard";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { PLATFORM_FEATURES, SITE } from "@/lib/site";
import {
  ChevronRight,
  Layers,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden mesh-hero">
      <div className="container relative z-10 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Badge
            variant="outline"
            className="border-primary/40 text-primary bg-primary/10 text-xs tracking-widest uppercase"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Name folgt — Produkt steht
          </Badge>

          <div className="space-y-4">
            <p className="text-6xl md:text-7xl font-black tracking-tight" aria-hidden>
              {SITE.codename}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text leading-tight">
              {SITE.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {SITE.tagline}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/feed">
              <Button
                size="lg"
                className="font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform"
              >
                Feed öffnen
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <Button
                size="lg"
                variant="outline"
                className="border-primary/40"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Konto erstellen
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
            {[
              {
                icon: Layers,
                title: "Alles vereint",
                desc: "Kein App-Zoo mehr: Feed, Kreise, Pulse, Stories in einem Flow.",
              },
              {
                icon: Shield,
                title: "Du steuerst",
                desc: "Chronologisch, Following oder Discovery — transparent wie Bluesky-Feeds.",
              },
              {
                icon: Zap,
                title: "Signal > Lärm",
                desc: "Reactions, Saves und Shares zählen — nicht nur Likes.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="bg-card/60 border-border/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <Icon className="h-5 w-5 text-primary mb-2" />
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  return (
    <section className="py-20 border-t border-border/60">
      <div className="container">
        <h2 className="text-2xl font-bold text-center mb-3">Das Beste aus jedem Netzwerk</h2>
        <p className="text-center text-muted-foreground text-sm max-w-xl mx-auto mb-12">
          Recherche-basiert: Instagram Stories & Saves, X-Threads & Reposts, TikTok Pulse,
          Reddit-Kreise, Discord-Nähe, BeReal-Momente, LinkedIn-Tiefe, Pinterest-Entdeckung.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_FEATURES.map((f) => (
            <Link key={f.id} href={f.href}>
              <Card className="h-full card-glow hover:border-primary/40 transition-all hover:-translate-y-0.5 cursor-pointer">
                <CardContent className="p-5 space-y-2">
                  <h3 className="font-semibold text-primary">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                  <span className="text-xs text-primary inline-flex items-center gap-1 pt-2">
                    Erkunden <ChevronRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveFeedPreview() {
  const { data } = trpc.social.getFeed.useQuery({ mode: "discover", limit: 3 });

  return (
    <section className="py-16 bg-card/20">
      <div className="container max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Live aus der Community</h2>
          <Link href="/feed">
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              Mehr <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {data?.map((item) => (
            <PostCard key={item.post.id} item={item} compact />
          ))}
          {!data?.length && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Starte den Feed — Demo-Inhalte erscheinen nach dem ersten Datenbank-Seed.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturesGrid />
      <LiveFeedPreview />
    </div>
  );
}
