import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import CardTile from "@/components/marketplace/CardTile";
import {
  ShoppingBag,
  TrendingUp,
  Shield,
  Star,
  ChevronRight,
  Zap,
  Users,
  Search,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: stats } = trpc.marketplace.getStats.useQuery();
  const { data: featured } = trpc.marketplace.search.useQuery({
    sort: "popular",
    limit: 8,
  });

  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-[80vh] flex items-center overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.22 0.06 55 / 0.25) 0%, transparent 55%), oklch(0.09 0.02 250)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <img
            src="/autic-tresures-logo.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container relative z-10 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge
                variant="outline"
                className="border-primary/40 text-primary bg-primary/10 text-xs tracking-widest uppercase"
              >
                <Star className="h-3 w-3 mr-1 fill-primary" />
                TCG Marktplatz
              </Badge>

              <h1 className="text-5xl md:text-6xl font-black leading-tight">
                <span className="font-serif text-primary">Autic</span>{" "}
                <span className="text-foreground italic">tresures</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Kaufe, verkaufe und bewerte Trading Cards – moderner, schneller und
                transparenter als Cardmarket. Alle großen TCGs an einem Ort.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/marktplatz">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-xl shadow-primary/25"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Karten entdecken
                  </Button>
                </Link>
                <Link href="/verkaufen">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Karte verkaufen
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => (window.location.href = getLoginUrl())}
                  >
                    Anmelden
                  </Button>
                )}
              </div>

              {stats && (
                <div className="flex flex-wrap gap-6 pt-2">
                  {[
                    { icon: ShoppingBag, label: "Angebote", value: stats.activeListings },
                    { icon: Users, label: "Verkäufer", value: stats.totalSellers },
                    { icon: Star, label: "Ø Bewertung", value: stats.avgRating },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-sm font-semibold text-foreground">{value}</div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <img
                src="/autic-tresures-logo.png"
                alt="Autic tresures"
                className="w-72 h-72 md:w-96 md:h-96 object-contain drop-shadow-2xl rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* USPs vs Cardmarket */}
      <section className="py-12 border-y border-border bg-card/20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Preisverlauf",
                desc: "30-Tage-Charts für jede Karte – keine Überraschungen",
              },
              {
                icon: Shield,
                title: "Verkäufer-Bewertungen",
                desc: "Echte Reviews nach jedem Kauf – Vertrauen statt Rätselraten",
              },
              {
                icon: Zap,
                title: "Sofort-Kauf",
                desc: "Ein Klick – kein umständliches Warenkorb-System",
              },
              {
                icon: Star,
                title: "Große Kartenbilder",
                desc: "Visuell statt Tabellen – endlich ein Marktplatz der sich gut anfühlt",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center space-y-2 p-4">
                <div className="inline-flex p-3 rounded-full bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game categories */}
      {stats && (
        <section className="py-12">
          <div className="container">
            <h2 className="text-xl font-bold mb-6">TCGs entdecken</h2>
            <div className="flex flex-wrap gap-2">
              {stats.games.map((g) => (
                <Link key={g.game} href={`/marktplatz?game=${g.game}`}>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors"
                  >
                    {g.label}
                    <span className="ml-2 text-muted-foreground">({g.count})</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured cards */}
      <section className="py-12 bg-card/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Beliebte Karten</h2>
              <p className="text-muted-foreground mt-1">Top-Angebote der Community</p>
            </div>
            <Link href="/marktplatz">
              <Button variant="ghost" className="text-primary gap-1">
                Alle anzeigen <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured?.results.map(({ card, listing, listingCount }) => (
              <CardTile
                key={card.id}
                cardId={card.id}
                name={card.name}
                setName={card.setName}
                game={card.game}
                imageUrl={card.imageUrl}
                price={listing.price}
                listingCount={listingCount}
                avgRating={card.avgRating}
                isFoil={listing.isFoil}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
