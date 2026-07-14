import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, isOAuthConfigured } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import CardTile from "@/components/marketplace/CardTile";
import {
  useMarketplaceSearch,
  useMarketplaceStats,
} from "@/lib/useMarketplace";
import { profileSetupPath } from "@/lib/useTradingProfile";
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
import { toast } from "sonner";
import { useMemo } from "react";

export default function Home() {
  const { isAuthenticated, loginDemo } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats } = useMarketplaceStats();
  const searchFilters = useMemo(() => ({ sort: "popular" as const, limit: 8 }), []);
  const { data: featured } = useMarketplaceSearch(searchFilters);

  const handleJoin = () => {
    if (isOAuthConfigured()) {
      window.location.href = getLoginUrl();
      return;
    }
    loginDemo();
    toast.success("Angemeldet – Händlerprofil anlegen");
    navigate(profileSetupPath("/marktplatz"));
  };

  return (
    <div>
      <section className="relative min-h-[92vh] flex items-end overflow-hidden">
        <img
          src="/autic-treasures-hero.jpg"
          alt="Autic Treasures – Trading Card Community"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        <div className="container relative z-10 pb-16 pt-32 space-y-6 max-w-2xl">
          <Badge
            variant="outline"
            className="border-primary/50 text-primary bg-background/40 backdrop-blur-sm text-xs tracking-[0.2em] uppercase"
          >
            Trading Card Community
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05]">
            <span className="font-serif text-primary tracking-wide">AUTIC</span>
            <br />
            <span className="font-serif text-primary tracking-wide">TREASURES</span>
          </h1>

          <p className="text-base md:text-lg text-foreground/85 max-w-md leading-relaxed">
            Kaufe, verkaufe und bewerte Trading Cards – transparenter und schneller als
            Cardmarket.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/marktplatz">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/85 text-primary-foreground font-bold shadow-xl shadow-primary/30"
              >
                <Search className="mr-2 h-5 w-5" />
                Karten entdecken
              </Button>
            </Link>
            <Link href="/verkaufen">
              <Button
                size="lg"
                variant="outline"
                className="border-primary/50 bg-background/40 backdrop-blur-sm text-primary hover:bg-primary/15 font-semibold"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Karte verkaufen
              </Button>
            </Link>
            {!isAuthenticated && (
              <Button
                size="lg"
                variant="ghost"
                className="text-foreground/70 hover:text-foreground"
                onClick={handleJoin}
              >
                {isOAuthConfigured() ? "Anmelden" : "Profil erstellen"}
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
      </section>

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
