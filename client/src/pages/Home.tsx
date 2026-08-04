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
      <section className="relative min-h-[88vh] flex items-end overflow-hidden">
        <img
          src="/autic-treasures-hero.jpg"
          alt="Autic Treasures – Trading Card Community"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        <div className="container relative z-10 pb-16 pt-32 space-y-6 max-w-2xl">
          <p className="font-serif text-primary text-sm tracking-[0.28em] uppercase">
            Trading Card Marketplace
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05]">
            <span className="font-serif text-primary tracking-wide">AUTIC TREASURES</span>
          </h1>

          <p className="text-base md:text-lg text-foreground/85 max-w-md leading-relaxed">
            Kaufen, verkaufen und bewerten – klarer als Cardmarket, mit eigenem Profil und echten
            Kartenfotos.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/marktplatz">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/85 text-primary-foreground font-bold shadow-xl shadow-primary/30"
              >
                <Search className="mr-2 h-5 w-5" />
                Zum Marktplatz
              </Button>
            </Link>
            <Link href="/verkaufen">
              <Button
                size="lg"
                variant="outline"
                className="border-primary/50 bg-background/40 backdrop-blur-sm text-primary hover:bg-primary/15 font-semibold"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Artikel verkaufen
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
        </div>
      </section>

      {stats && (
        <section className="border-y border-border bg-card/30">
          <div className="container py-6 flex flex-wrap gap-8 sm:gap-12">
            {[
              { label: "Aktive Angebote", value: stats.activeListings },
              { label: "Produkte", value: stats.totalCards },
              { label: "Verkäufer", value: stats.totalSellers },
              { label: "Ø Bewertung", value: stats.avgRating },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-14">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl">
            {[
              {
                icon: TrendingUp,
                title: "Preisverlauf",
                desc: "30-Tage-Charts für jedes Produkt",
              },
              {
                icon: Shield,
                title: "Händlerprofile",
                desc: "Pflichtprofil vor Kauf und Verkauf",
              },
              {
                icon: Zap,
                title: "Sofort-Kauf",
                desc: "Angebot wählen und direkt abschließen",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="space-y-2">
                <div className="inline-flex p-2.5 rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {stats && (
        <section className="py-10 border-t border-border">
          <div className="container space-y-4">
            <h2 className="text-xl font-bold">Nach TCG browsen</h2>
            <div className="flex flex-wrap gap-2">
              {stats.games.map((g) => (
                <Link key={g.game} href={`/marktplatz?game=${g.game}`}>
                  <Badge
                    variant="outline"
                    className="px-3.5 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors"
                  >
                    {g.label}
                    <span className="ml-2 text-muted-foreground">{g.count}</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 bg-card/30 border-t border-border">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Beliebte Produkte</h2>
              <p className="text-muted-foreground text-sm mt-1">Aktuelle Top-Angebote</p>
            </div>
            <Link href="/marktplatz">
              <Button variant="ghost" className="text-primary gap-1">
                Alle anzeigen <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
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
